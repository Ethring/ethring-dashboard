<template>
    <div class="superswap-panel">
        <RoutesModal v-if="isShowRoutesModal" @close="closeRoutesModal" />
        <div class="reload-btn" :class="{ 'reload-btn__active': receiveValue && !isLoading }" @click="getEstimateInfo">
            <ReloadIcon />
        </div>

        <SwapField
            :is-token-loading="isTokensLoadingForChain"
            :value="amount"
            :label="$t('tokenOperations.from')"
            :token="selectedSrcToken"
            @setAmount="onSetAmount"
        >
            <Select
                :value="selectedSrcNetwork"
                :options="supportedNetworks"
                placeholder="Network name"
                @onChange="(network) => handleOnSelectNetwork(network, DIRECTIONS.SOURCE)"
            />
            <Select
                @click="() => handleOnClickSelectToken(TOKEN_SELECT_TYPES.FROM, DIRECTIONS.SOURCE)"
                :value="selectedSrcToken"
                class="ml-8"
                :options="tokensList || []"
                placeholder="Token name"
                @onChange="(token) => handleOnSelectToken(token, TOKEN_SELECT_TYPES.FROM)"
                isToken
                balance
            />
        </SwapField>

        <div class="swap-btn">
            <SwapIcon />
        </div>

        <SwapField
            class="mt-10"
            :label="$t('tokenOperations.to')"
            :value="receiveValue"
            :token="selectedDstToken"
            :isAmountLoading="isLoading"
            :is-token-loading="isTokensLoadingForChain"
            :percentage="differPercentage"
            disabled
            hide-max
        >
            <Select
                :value="selectedDstNetwork"
                :options="supportedNetworks"
                placeholder="Network name"
                @onChange="(network) => handleOnSelectNetwork(network, DIRECTIONS.DESTINATION)"
            />

            <Select
                @click="() => handleOnClickSelectToken(TOKEN_SELECT_TYPES.TO, DIRECTIONS.DESTINATION)"
                :value="selectedDstToken"
                class="ml-8"
                :options="tokensList || []"
                placeholder="Token name"
                @onChange="(token) => handleOnSelectToken(token, TOKEN_SELECT_TYPES.TO)"
                isToken
                balance
            />
        </SwapField>

        <Checkbox
            v-if="selectedSrcNetwork?.net !== selectedDstNetwork?.net"
            v-model:value="isReceiveToken"
            :label="$t('tokenOperations.chooseAddress')"
            class="mt-14"
        />

        <SelectAddress
            v-if="isReceiveToken && selectedSrcNetwork?.net !== selectedDstNetwork?.net"
            :selected-network="selectedDstNetwork"
            :error="!!errorAddress"
            placeholder="0x..."
            class="mt-10"
            :on-reset="successHash"
            @setAddress="onSetAddress"
        />
        <Collapse v-if="+amount > 0" :loading="isLoading" :hideContent="estimateError">
            <template #header>
                <div class="route-info">
                    <p>{{ $t('tokenOperations.routeInfo') }}:</p>
                    <div v-if="!estimateError" class="row">
                        <FeeIcon />
                        <span class="fee">{{ networkFee }}</span> <span class="symbol"> $</span>
                        <TimeIcon />
                        <span class="fee"> {{ '~ ' + bestRoute.estimateTime + ' s' }}</span>
                        <h4>1 {{ selectedSrcToken?.symbol || '' }} = {{ estimateRate }} {{ selectedDstToken?.symbol || '' }}</h4>
                    </div>

                    <a-tooltip v-else>
                        <template #title> {{ estimateError?.message || estimateError }} </template>
                        <p class="error-text">{{ estimateError?.message || estimateError }}</p>
                    </a-tooltip>
                </div>
            </template>
            <template #content>
                <div class="routes">
                    <div class="route" v-for="(item, i) in bestRoute.routes" :key="i">
                        <img :src="item.service.icon" />
                        <div class="name">{{ item.service.name }}</div>
                        <ArrowIcon class="arrow" v-if="i != bestRoute.routes.length - 1" />
                    </div>
                    <ExpandIcon v-if="otherRoutes.length" class="expand" @click="setShowRoutesModal" />
                </div>
            </template>
        </Collapse>

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledBtn"
            :loading="isSwapLoading"
            class="superswap-panel__btn mt-10"
            @click="swap"
            size="large"
        />
    </div>
</template>
<script>
import { computed, ref, watch, onMounted, h, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import BigNumber from 'bignumber.js';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';
import useNotification from '@/compositions/useNotification';

import SelectAddress from '@/components/ui/SelectAddress';
import Collapse from '@/components/ui/Collapse';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Select from './Select.vue';
import SwapField from './SwapField';
import RoutesModal from '@/components/app/modals/RoutesModal';

import { LoadingOutlined } from '@ant-design/icons-vue';

import SwapIcon from '@/assets/icons/app/swap.svg';
import ReloadIcon from '@/assets/icons/app/reload.svg';
import FeeIcon from '@/assets/icons/app/fee.svg';
import TimeIcon from '@/assets/icons/app/time.svg';
import ExpandIcon from '@/assets/icons/app/expand.svg';
import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

import { toMantissa } from '@/helpers/numbers';
import { prettyNumber, prettyNumberTooltip } from '@/helpers/prettyNumber';

import { checkErrors } from '@/helpers/checkErrors';

import { findBestRoute } from '@/modules/SuperSwap/baseScript';

import prices from '@/modules/prices/';

import { STATUSES, NATIVE_CONTRACT, SUPPORTED_CHAINS } from '@/shared/constants/superswap/constants';
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { isCorrectChain } from '@/shared/utils/operations';

export default {
    name: 'SuperSwap',
    components: {
        SelectAddress,
        Button,
        Collapse,
        Checkbox,
        Select,
        SwapField,
        RoutesModal,
        SwapIcon,
        ReloadIcon,
        FeeIcon,
        TimeIcon,
        ArrowIcon,
        ExpandIcon,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const {
            walletAccount,
            walletAddress,
            chainList,
            currentChainInfo,
            formatTransactionForSign,
            setChain,
            signSend,
            getTxExplorerLink,
        } = useAdapter();

        const { showNotification, closeNotification } = useNotification();

        const supportedNetworks = computed(() => chainList.value?.filter((elem) => SUPPORTED_CHAINS.includes(elem.net)));
        const isLoading = ref(false);
        const isSwapLoading = ref(false);
        const isNeedApprove = ref(false);

        const isBalanceUpdated = ref(false);
        const isReceiveToken = ref(false);
        const approveTx = ref(null);
        const bestRoute = ref({});
        const otherRoutes = ref([]);
        const currentRoute = ref({});
        const txError = ref('');
        const txErrorTitle = ref('');

        const successHash = ref('');
        const networkName = ref('');

        const networkFee = ref(0);
        const estimateRate = ref(0);
        const isNeedNetworkChange = ref(false);
        const isCallEstimate = ref(false);

        const amount = ref('');
        const receiveValue = ref('');
        const address = ref('');
        const allowance = ref(null);
        const differPercentage = ref(0);

        const errorAddress = ref('');
        const isErrorBalance = ref('');
        const estimateError = ref('');

        const opTitle = ref('tokenOperations.swap');

        const selectedSrcToken = ref(null);
        const selectedDstToken = ref(null);

        // =================================================================================================================

        const selectType = computed({
            get: () => store.getters['tokenOps/selectType'],
            set: (value) => store.dispatch('tokenOps/setSelectType', value),
        });

        const selectedSrcNetwork = computed({
            get: () => store.getters['tokenOps/srcNetwork'],
            set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
        });

        const selectedDstNetwork = computed({
            get: () => store.getters['tokenOps/dstNetwork'],
            set: (value) => store.dispatch('tokenOps/setDstNetwork', value),
        });

        // =================================================================================================================

        const targetDirection = computed({
            get: () => store.getters['tokenOps/direction'],
            set: (value) => store.dispatch('tokenOps/setDirection', value),
        });

        const onlyWithBalance = computed({
            get: () => store.getters['tokenOps/onlyWithBalance'],
            set: (value) => store.dispatch('tokenOps/setOnlyWithBalance', value),
        });

        // =================================================================================================================

        const { getTokensList } = useTokensList();

        const tokensList = ref([]);

        // =================================================================================================================

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](currentChainInfo.value?.net));

        const bestRouteInfo = computed(() => store.getters['swap/bestRoute']);
        const isShowRoutesModal = computed(() => store.getters['swap/showRoutes']);

        const disabledBtn = computed(() => {
            return (
                isLoading.value ||
                isErrorBalance.value ||
                !+amount.value ||
                !receiveValue.value ||
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstToken.value ||
                txError.value
            );
        });

        const getSelectedNetwork = () => {
            if (targetDirection.value === DIRECTIONS.SOURCE) {
                return selectedSrcNetwork.value;
            }
            return selectedDstNetwork.value;
        };

        const clearApprove = () => {
            isNeedApprove.value = false;
            approveTx.value = null;
            receiveValue.value = '';
            allowance.value = null;
        };

        const resetValues = () => {
            receiveValue.value = '';
            isLoading.value = false;
            estimateRate.value = 0;
            networkFee.value = 0;
            differPercentage.value = null;
            isNeedApprove.value = false;
            receiveValue.value = '';
            bestRoute.value = null;
            clearApprove();
        };

        const handleOnSelectNetwork = (network, direction) => {
            if (currentChainInfo.value.net !== selectedSrcNetwork.value.net) {
                opTitle.value = 'tokenOperations.switchNetwork';
            }

            if (direction === DIRECTIONS.SOURCE) {
                selectedSrcNetwork.value = network;

                return clearApprove();
            }

            selectedDstNetwork.value = network;

            selectedDstToken.value = null;

            resetValues();

            return (opTitle.value = 'tokenOperations.swap');
        };

        // =================================================================================================================

        const handleOnClickSelectToken = (type, direction) => {
            selectType.value = type;
            targetDirection.value = direction;
            onlyWithBalance.value = type === TOKEN_SELECT_TYPES.FROM;

            tokensList.value = getTokensList({
                srcNet: getSelectedNetwork(),
                srcToken: selectedSrcToken.value,
                dstToken: selectedDstToken.value,
            });
        };

        // =================================================================================================================

        const handleOnSelectToken = async (token, direction) => {
            if (token && token.address && !token?.price) {
                const chainId =
                    direction === TOKEN_SELECT_TYPES.FROM ? selectedSrcNetwork.value?.chain_id : selectedDstNetwork.value?.chain_id;

                const price = await prices.Coingecko.priceByPlatformContracts({
                    chainId: chainId,
                    addresses: token.address,
                });

                const { usd = 0 } = price[token.address.toLowerCase()];
                token.price = usd;
            }

            if (direction === TOKEN_SELECT_TYPES.FROM) {
                selectedSrcToken.value = token;
                clearApprove();
            } else {
                selectedDstToken.value = token;
            }

            onSetAmount(amount.value);
        };

        const setTokenOnChange = () => {
            selectedDstToken.value = null;

            tokensList.value = getTokensList({
                srcNet: selectedSrcNetwork.value,
                srcToken: selectedSrcToken.value,
                dstToken: selectedDstToken.value,
            });

            const [defaultFromToken = null] = tokensList.value || [];

            if (!selectedSrcToken.value && defaultFromToken) {
                selectedSrcToken.value = defaultFromToken;
            }

            if (!isBalanceUpdated.value) {
                return;
            }

            if (!selectedSrcToken.value && !selectedDstToken.value) {
                return;
            }

            const { symbol: fromSymbol } = selectedSrcToken.value || {};
            const { symbol: toSymbol } = selectedSrcToken.value || {};

            const searchTokens = [fromSymbol, toSymbol];

            const updatedList = tokensList.value?.filter((tkn) => searchTokens.includes(tkn.symbol)) || [];

            if (!updatedList.length) {
                return;
            }

            const [fromToken = null, toToken = null] = updatedList;

            if (fromToken) {
                selectedSrcToken.value = fromToken;
            }

            if (toToken) {
                selectedDstToken.value = toToken;
            }
        };

        // =================================================================================================================

        const setShowRoutesModal = () => {
            store.dispatch('swap/setShowRoutes', true);
        };

        const closeRoutesModal = () => {
            store.dispatch('swap/setShowRoutes', false);
        };

        // =================================================================================================================

        const onSetAddress = (addr) => {
            const reg = new RegExp(selectedDstNetwork.value.address_validating);
            address.value = addr;

            if (address.value.length && !reg.test(addr)) {
                errorAddress.value = 'Invalid address';
                return;
            }
            errorAddress.value = '';
        };

        const onSetAmount = async (value) => {
            amount.value = value;

            differPercentage.value = null;
            receiveValue.value = '';

            if (!+value) {
                return;
            }

            if (amount.value || isCallEstimate.value) {
                await getEstimateInfo();
                isCallEstimate.value = false;
            }

            const isBalanceAllowed = +amount.value > +selectedSrcToken.value.balance;
            isErrorBalance.value = isBalanceAllowed;
        };

        // =================================================================================================================

        const checkAllowance = async (amount) => {
            if (allowance.value >= toMantissa(amount, currentRoute.value.fromToken?.decimals)) {
                isNeedApprove.value = false;
                return;
            }

            if (!approveTx.value && currentRoute.value.fromToken?.address) {
                isNeedApprove.value = true;
                await getApproveTx();
            }
        };

        const getAllowance = async () => {
            approveTx.value = null;
            isNeedApprove.value = false;

            if (!currentRoute.value.fromToken?.address) {
                return;
            }
            const resAllowance = await store.dispatch(currentRoute.value.service.type + '/getAllowance', {
                url: currentRoute.value.service.url,
                net: currentRoute.value.net,
                tokenAddress: currentRoute.value.fromToken.address,
                ownerAddress: walletAddress.value,
            });

            if (resAllowance.error) {
                return;
            }

            allowance.value = resAllowance.allowance || resAllowance;
        };

        // =================================================================================================================

        const getApproveTx = async () => {
            if (!currentRoute.value.fromToken?.address) {
                return;
            }
            opTitle.value = 'tokenOperations.approve';
            const resApproveTx = await store.dispatch(currentRoute.value.service.type + '/getApproveTx', {
                url: currentRoute.value.service.url,
                net: currentRoute.value.net,
                tokenAddress: currentRoute.value.fromToken?.address,
                ownerAddress: walletAddress.value,
            });

            approveTx.value = resApproveTx;
        };

        const makeApproveTx = async () => {
            showNotification({
                key: 'approve-swap-tx',
                type: 'info',
                title: `Getting Approve for ${selectedSrcToken.value.symbol}`,
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            const resTx = await sendTransaction({ ...approveTx.value, from: walletAddress.value });
            closeNotification('approve-swap-tx');

            if (resTx.error) {
                isSwapLoading.value = false;

                txError.value = resTx.error.message || resTx.error;
                txErrorTitle.value = 'Approve transaction error';

                return;
            }

            approveTx.value = null;

            successHash.value = getTxExplorerLink(resTx.transactionHash, currentChainInfo.value);

            setTimeout(async () => {
                await getAllowance();
                await checkAllowance(amount.value);
                isSwapLoading.value = false;
            }, 5000);
        };

        // =================================================================================================================

        const getDifferPercentage = () => {
            const fromUsdValue = BigNumber(selectedSrcToken.value.price).multipliedBy(amount.value);
            const toUsdValue = BigNumber(selectedDstToken.value.price).multipliedBy(receiveValue.value);

            return toUsdValue.minus(fromUsdValue).dividedBy(toUsdValue).multipliedBy(100).toFixed(2);
        };

        const getRecipientAddress = () => {
            if (currentRoute.value.service.type === 'swap') {
                return walletAddress.value;
            }
            return address.value || walletAddress.value;
        };

        // =================================================================================================================

        const getEstimateInfo = async () => {
            if (
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstNetwork.value ||
                !selectedDstToken.value ||
                !+amount.value
            ) {
                estimateError.value = 'Select all fields';
                return;
            }

            isLoading.value = true;

            const resEstimate = await findBestRoute(amount.value, walletAddress.value, selectedSrcToken.value, selectedDstToken.value);

            if (resEstimate?.error) {
                estimateError.value = resEstimate.error;
                receiveValue.value = 0;
                isLoading.value = false;
                return;
            }

            if (!+amount.value) {
                receiveValue.value = 0;
                isLoading.value = false;
                return;
            }

            const checkRoute =
                resEstimate.toToken === selectedDstToken.value &&
                resEstimate.fromToken === selectedSrcToken.value &&
                resEstimate.bestRoute?.fromTokenAmount === amount.value;

            if (checkRoute) {
                store.dispatch('swap/setBestRoute', resEstimate);
                currentRoute.value = resEstimate.bestRoute.routes.find((elem) => elem.status === STATUSES.SIGNING);

                if (currentRoute.value.needApprove) {
                    isNeedApprove.value = true;
                    getApproveTx();
                } else {
                    opTitle.value = 'tokenOperations.swap';
                }

                bestRoute.value = resEstimate.bestRoute;
                otherRoutes.value = resEstimate.otherRoutes || [];
                estimateError.value = '';

                receiveValue.value = resEstimate.bestRoute?.toTokenAmount;

                networkFee.value = prettyNumberTooltip(resEstimate.bestRoute?.estimateFeeUsd, 6);
                estimateRate.value = prettyNumberTooltip(resEstimate.bestRoute.toTokenAmount / resEstimate.bestRoute.fromTokenAmount, 6);

                differPercentage.value = getDifferPercentage();
                isLoading.value = false;
            }

            if (selectedSrcNetwork.value.net !== currentChainInfo.value.net) {
                isNeedNetworkChange.value = true;
                networkName.value = selectedSrcNetwork.value.name;
                opTitle.value = 'tokenOperations.switchNetwork';
            }
        };

        // =================================================================================================================

        const sendTransaction = async (transaction) => {
            try {
                const tx = formatTransactionForSign(transaction);

                const signedTx = await signSend(tx);

                return signedTx;
            } catch (e) {
                return checkErrors(e);
            }
        };

        // =================================================================================================================

        const getServiceApi = (type) => {
            if (type === 'bridge') {
                return currentRoute.value.service.type + '/getBridgeTx';
            }
            return currentRoute.value.service.type + '/getSwapTx';
        };

        const updateBalances = (network, setNetwork) => {
            store.dispatch('tokens/updateTokenBalances', {
                net: network.value.net,
                address: walletAddress.value,
                info: network.value,
                update(wallet) {
                    isBalanceUpdated.value = true;
                    setNetwork(wallet);
                },
            });
        };

        const swap = async () => {
            const network = networkName.value === selectedDstNetwork.value.name ? selectedDstNetwork : selectedSrcNetwork;

            const { isChanged, btnTitle } = await isCorrectChain(network, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                isLoading.value = false;

                return setTimeout(async () => {
                    if (currentRoute.value.net === currentChainInfo.value.net) {
                        await swap();
                    }
                }, 5000);
            }

            opTitle.value = 'tokenOperations.swap';

            isSwapLoading.value = true;
            txError.value = '';

            // APPROVE
            if (approveTx.value && isNeedApprove.value) {
                opTitle.value = 'tokenOperations.approve';
                return await makeApproveTx();
            }

            const SERVICE_API = getServiceApi(currentRoute.value.service.type);

            const params = {
                url: currentRoute.value.service.url,
                net: currentRoute.value.net,
                fromTokenAddress: currentRoute.value.fromToken?.address || NATIVE_CONTRACT,
                fromNet: currentRoute.value.net,
                amount: prettyNumber(currentRoute.value.amount, 6),
                toNet: currentRoute.value.toNet,
                toTokenAddress: currentRoute.value.toToken?.address || NATIVE_CONTRACT,
                ownerAddress: walletAddress.value,
                slippage: 1,
            };

            if (currentRoute.value.service?.recipientAddress) {
                params.recipientAddress = getRecipientAddress();
                params.fallbackAddress = walletAddress.value;
            }

            showNotification({
                key: 'prepare-swap-tx',
                type: 'info',
                title: `Swap ${amount.value} ${selectedSrcToken.value.symbol} to ~${receiveValue.value} ${selectedDstToken.value.symbol}`,
                description: 'Please wait, transaction is preparing',
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            const resSwap = await store.dispatch(SERVICE_API, params);
            closeNotification('prepare-swap-tx');

            if (resSwap.error) {
                txError.value = resSwap.error;
                txErrorTitle.value = 'Prepare swap error';

                return;
            }

            const resTx = await await sendTransaction(resSwap);

            if (resTx.error) {
                txError.value = resTx.error;
                txErrorTitle.value = 'Swap Transaction error';
                return;
            }

            successHash.value = getTxExplorerLink(resTx.transactionHash, currentChainInfo.value);
            isSwapLoading.value = false;

            bestRoute.value.routes = bestRoute.value.routes.map((elem, i) => {
                if (elem.status === STATUSES.SIGNING) {
                    elem.status = STATUSES.COMPLETED;
                } else if (elem.status === STATUSES.PENDING && bestRoute.value.routes[i - 1]?.status == STATUSES.COMPLETED) {
                    elem.status = STATUSES.SIGNING;
                }
                return elem;
            });

            currentRoute.value = bestRoute.value.routes.find((elem) => elem.status === STATUSES.SIGNING);

            setTimeout(() => {
                updateBalances(selectedSrcNetwork, (network) => handleOnSelectNetwork(network, DIRECTIONS.SOURCE));

                isBalanceUpdated.value = false;

                updateBalances(selectedDstNetwork, (network) => handleOnSelectNetwork(network, DIRECTIONS.DESTINATION));
            }, 5000);

            if (!currentRoute.value) {
                receiveValue.value = null;
                amount.value = '';
                isErrorBalance.value = '';
                store.dispatch('swap/setBestRoute', null);
                return;
            }

            if (currentRoute.value.net !== selectedSrcNetwork.value.net) {
                store.dispatch('tokens/setDisableLoader', true);
                networkName.value = selectedDstNetwork.value.name;
                isNeedNetworkChange.value = true;
                return;
            }

            isNeedNetworkChange.value = false;
            if (currentRoute.value.isNeedApprove) {
                isNeedApprove.value = true;
                await getApproveTx();
            }
            await swap();
        };

        // =================================================================================================================

        onMounted(() => {
            onlyWithBalance.value = true;
            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
                selectedDstNetwork.value = currentChainInfo.value;
            }

            setTokenOnChange();
        });

        // =================================================================================================================

        watch(isTokensLoadingForChain, (val) => {
            if (!val && selectedSrcNetwork.value) {
                setTokenOnChange();
            }
        });

        watch(selectedSrcNetwork, () => {
            resetValues();
            onSetAmount('');
            selectedSrcToken.value = null;
            setTokenOnChange();
        });

        watch(txError, (err) => {
            if (!err) {
                return;
            }

            showNotification({
                key: 'error-tx',
                type: 'error',
                title: txErrorTitle.value,
                description: JSON.stringify(txError.value || 'Unknown error'),
                duration: 5,
            });

            isSwapLoading.value = false;

            return setTimeout(() => {
                closeNotification('error-tx');
                txError.value = '';
            }, 5000);
        });

        watch(successHash, () => {
            if (!successHash.value) {
                return;
            }

            showNotification({
                key: 'success-swap-tx',
                type: 'success',
                title: 'Click to view transaction',
                onClick: () => {
                    window.open(successHash.value, '_blank');
                    closeNotification('success-swap-tx');
                    successHash.value = '';
                },
                duration: 4,
                style: {
                    cursor: 'pointer',
                },
            });

            return setTimeout(() => {
                successHash.value = '';
            }, 5000);
        });

        // route is changed
        watch(isShowRoutesModal, () => {
            if (isShowRoutesModal.value) {
                return;
            }

            bestRoute.value = bestRouteInfo.value.bestRoute;
            otherRoutes.value = bestRouteInfo.value.otherRoutes;
            currentRoute.value = bestRoute.value.routes.find((elem) => elem.status === STATUSES.SIGNING);
            amount.value = bestRouteInfo.value.bestRoute?.fromTokenAmount;
            receiveValue.value = bestRouteInfo.value.bestRoute?.toTokenAmount;

            networkFee.value = prettyNumberTooltip(bestRouteInfo.value.bestRoute?.estimateFeeUsd, 6);

            estimateRate.value = prettyNumberTooltip(
                bestRouteInfo.value.bestRoute.toTokenAmount / bestRouteInfo.value.bestRoute.fromTokenAmount,
                6
            );
            isNeedApprove.value = currentRoute.value?.isNeedApprove;

            if (isNeedApprove.value) {
                getApproveTx();
            }
        });

        watch(
            () => currentChainInfo.value,
            () => {
                if ((!currentChainInfo.value.net || !SUPPORTED_CHAINS.includes(currentChainInfo.value?.net)) && !isShowRoutesModal.value) {
                    router.push('/main');
                }
            }
        );

        watch(walletAccount, () => {
            selectedSrcNetwork.value = currentChainInfo.value;
            setTokenOnChange();
        });

        onBeforeUnmount(() => {
            selectedSrcNetwork.value = null;
            selectedSrcToken.value = null;
            selectedDstNetwork.value = null;
            selectedDstToken.value = null;
        });

        return {
            isLoading,
            isShowRoutesModal,
            isTokensLoadingForChain,
            isSwapLoading,

            disabledBtn,
            isReceiveToken,
            receiveValue,
            estimateRate,
            supportedNetworks,

            amount,
            opTitle,
            bestRoute,
            otherRoutes,
            errorAddress,
            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            DIRECTIONS,
            TOKEN_SELECT_TYPES,

            estimateError,
            successHash,
            currentChainInfo,
            networkFee,

            tokensList,

            differPercentage,

            closeRoutesModal,
            handleOnSelectNetwork,
            handleOnClickSelectToken,
            handleOnSelectToken,

            onSetAddress,
            onSetAmount,

            swap,

            getEstimateInfo,
            setShowRoutesModal,
        };
    },
};
</script>
<style lang="scss">
.superswap-panel {
    width: 660px;
    position: relative;

    .mt-10 {
        margin-top: 10px;
    }

    .mt-14 {
        margin-top: 14px;
    }

    .ml-8 {
        margin-left: 8px;
    }

    .swap-btn {
        @include pageFlexRow;
        justify-content: center;
        position: absolute;
        left: 120px;
        top: 138px;
        z-index: 5;
        height: 54px;
        width: 54px;
        border-radius: 50%;
        background-color: var(--#{$prefix}swap-btn-bg-color);
        border: 5px solid var(--#{$prefix}main-background);

        svg .path-2 {
            fill: var(--#{$prefix}primary-text);
        }

        svg .path-1 {
            fill: var(--#{$prefix}eye-logo-hover);
        }
    }

    .reload-btn {
        @include pageFlexRow;
        justify-content: center;
        position: absolute;
        cursor: not-allowed;
        top: -60px;
        right: 0;
        height: 40px;
        width: 40px;
        border-radius: 50%;
        z-index: 15;
        background-color: var(--#{$prefix}icon-secondary-bg-color);
        opacity: 0.5;
        svg path {
            fill: var(--#{$prefix}base-text);
        }

        &__active {
            cursor: pointer;
            opacity: 1;
        }
    }

    .route-info {
        @include pageFlexRow;

        * {
            margin: 0;
        }

        p {
            color: var(--#{$prefix}mute-text);
            font-size: var(--#{$prefix}small-lg-fs);
            line-height: var(--#{$prefix}default-fs);
            font-weight: 600;
        }

        .error-text {
            margin-left: 8px;
            font-weight: 500;
            color: var(--#{$prefix}warning);
            opacity: 0.8;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            width: 520px;
        }

        span {
            color: var(--#{$prefix}warning);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 600;
        }

        svg {
            margin: 0 6px 0 16px;
        }

        svg path {
            fill: var(--#{$prefix}base-text);
        }

        h4 {
            margin-left: 16px;
            font-weight: 600;
            color: var(--#{$prefix}base-text);
        }
    }

    .routes {
        @include pageFlexRow;
        padding: 12px 0;
        width: 94%;
        margin-left: 24px;
        border-top: 2px solid var(--#{$prefix}collapse-border-color);

        div {
            @include pageFlexRow;
        }

        img {
            width: 24px;
            height: 24px;
            margin-right: 8px;
            border-radius: 50%;
            border: 2px solid var(--#{$prefix}banner-logo-color);
        }

        .name {
            font-size: var(--#{$prefix}small-lg-fs);
            color: var(--#{$prefix}base-text);
            font-weight: 600;
        }

        svg.arrow {
            fill: var(--#{$prefix}select-icon-color);
            transform: rotate(-90deg) scale(0.7);
            @include animateEasy;
        }

        svg.expand {
            fill: var(--#{$prefix}base-text);
            margin-left: 12px;
            @include animateEasy;
        }
    }

    .accordion__content {
        img {
            width: 16px;
            height: 16px;
        }
        .symbol {
            margin-left: 5px;
        }
    }

    .accordion__title {
        .symbol {
            font-weight: 600;
        }
    }

    .accordion-item {
        position: relative;
        &__value {
            .route {
                @include pageFlexRow;
                margin-left: 6px;

                .name {
                    margin-left: 6px;
                }
            }
        }
        &__row {
            display: flex;
        }
    }
    .other-routes {
        background-color: var(--#{$prefix}tag-01);
        border-radius: 15px;
        padding: 4px 10px;
        color: var(--#{$prefix}info);
        font-weight: 600;
        position: absolute;
        right: 0;
        bottom: 8px;
        cursor: pointer;
    }

    &__btn {
        height: 64px;
        width: 100%;
    }

    .row {
        @include pageFlexRow;
    }
}
</style>
