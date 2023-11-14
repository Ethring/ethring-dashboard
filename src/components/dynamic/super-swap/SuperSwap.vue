<template>
    <div class="superswap-panel">
        <RoutesModal v-if="isShowRoutesModal" @close="() => toggleRoutesModal(false)" />
        <div class="reload-btn" :class="{ 'reload-btn__active': dstAmount && !isLoading }" @click="getEstimateInfo">
            <ReloadIcon />
        </div>

        <SwapField
            :is-token-loading="isTokensLoadingForChain"
            :value="srcAmount"
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
            class="mt-8"
            :label="$t('tokenOperations.to')"
            :value="dstAmount"
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
            class="mt-16"
        />

        <SelectAddress
            v-if="isReceiveToken && selectedSrcNetwork?.net !== selectedDstNetwork?.net"
            :selected-network="selectedDstNetwork"
            :error="!!errorAddress"
            placeholder="0x..."
            class="mt-16"
            :on-reset="successHash"
            @setAddress="onSetAddress"
        />

        <Collapse class="mt-16" v-if="+srcAmount > 0" :loading="isLoading" :hideContent="estimateErrorTitle">
            <template #header>
                <div class="route-info">
                    <p>{{ $t('tokenOperations.routeInfo') }}:</p>
                    <div v-if="!estimateErrorTitle" class="row">
                        <FeeIcon />
                        <span class="fee">{{ networkFee }}</span> <span class="symbol"> $</span>
                        <TimeIcon />
                        <span class="fee"> {{ '~ ' + bestRoute?.estimateTime + ' s' }}</span>
                        <h4>
                            1 <span>{{ selectedSrcToken?.symbol || '' }}</span> = {{ estimateRate }}
                            <span>{{ selectedDstToken?.symbol || '' }}</span>
                        </h4>
                    </div>

                    <a-tooltip v-else>
                        <template #title> {{ estimateErrorTitle?.message || estimateErrorTitle }} </template>
                        <p class="error-text">{{ estimateErrorTitle?.message || estimateErrorTitle }}</p>
                    </a-tooltip>
                </div>
            </template>
            <template #content>
                <div class="routes">
                    <div class="route" v-for="(item, i) in bestRoute?.routes" :key="i">
                        <img :src="item.service.icon" />
                        <div class="name">{{ item.service.name }}</div>
                        <ArrowIcon class="arrow" v-if="i != bestRoute?.routes?.length - 1" />
                    </div>
                    <ExpandIcon v-if="otherRoutes.length" class="expand" @click="() => toggleRoutesModal(true)" />
                </div>
            </template>
        </Collapse>

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledBtn"
            :loading="isWaitingTxStatusForModule || isSwapLoading"
            class="superswap-panel__btn mt-16"
            @click="swap"
            size="large"
        />
    </div>
</template>
<script>
import { computed, ref, watch, onMounted, h, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { SettingOutlined } from '@ant-design/icons-vue';

//
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

// Services
import { getSwapTx, getBridgeTx } from '@/api/services';

// Adapter
import { ECOSYSTEMS } from '@/Adapter/config';
import useAdapter from '@/Adapter/compositions/useAdapter';

// Composition
import useTokensList from '@/compositions/useTokensList';
import useNotification from '@/compositions/useNotification';
import useServices from '@/compositions/useServices';

// Transaction Management
import useTransactions from '../../../Transactions/compositions/useTransactions';
// import { STATUSES } from '../../../Transactions/shared/constants';

import SelectAddress from '@/components/ui/SelectAddress';
import Collapse from '@/components/ui/Collapse';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Select from './Select.vue';
import SwapField from './SwapField';
import RoutesModal from '@/components/app/modals/RoutesModal';

import SwapIcon from '@/assets/icons/app/swap.svg';
import ReloadIcon from '@/assets/icons/app/reload.svg';
import FeeIcon from '@/assets/icons/app/fee.svg';
import TimeIcon from '@/assets/icons/app/time.svg';
import ExpandIcon from '@/assets/icons/app/expand.svg';
import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

import { prettyNumberTooltip } from '@/helpers/prettyNumber';

import { findBestRoute } from '@/modules/SuperSwap/baseScript';

import PricesModule from '@/modules/prices/';

import { STATUSES, NATIVE_CONTRACT, SUPPORTED_CHAINS } from '@/shared/constants/super-swap/constants';
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { isCorrectChain } from '@/shared/utils/operations';

// import { updateWalletBalances } from '@/shared/utils/balances';

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
        const { t } = useI18n();
        const { name: module } = router.currentRoute.value;

        const { walletAccount, walletAddress, chainList, currentChainInfo, setChain, validateAddress } = useAdapter();

        const { showNotification, closeNotification } = useNotification();

        const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](module));

        // =================================================================================================================

        const supportedNetworks = computed(() => chainList.value?.filter((elem) => SUPPORTED_CHAINS.includes(elem.net)));

        const isLoading = ref(false);
        const isSwapLoading = ref(false);

        const currentRoute = ref({});

        const selectedService = computed(() => {
            if (currentRoute.value?.service) {
                return currentRoute.value?.service;
            }

            return null;
        });

        // * Module values
        const {
            selectType,
            targetDirection,

            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,
            selectedDstNetwork,

            onlyWithBalance,

            srcAmount,
            dstAmount,
            receiverAddress,

            txError,
            txErrorTitle,

            opTitle,

            clearApproveForService,

            setTokenOnChange,
            makeAllowanceRequest,
            makeApproveRequest,
            checkSelectedNetwork,
        } = useServices({
            module,
            moduleType: 'super-swap',
        });

        // * Transaction Manager
        const { currentRequestID, transactionForSign, createTransactions, signAndSend, addTransactionToRequestID } = useTransactions();

        const isReceiveToken = ref(false);

        //  =================================================================================================================
        const bestRoute = ref({});
        const otherRoutes = ref([]);

        const successHash = ref('');
        const networkName = ref('');

        const networkFee = ref(0);
        const estimateRate = ref(0);
        const isCallEstimate = ref(false);

        const differPercentage = ref(0);

        const errorAddress = ref('');

        const isBalanceError = ref(false);

        const estimateErrorTitle = ref('');

        // =================================================================================================================

        const { getTokensList } = useTokensList();

        const tokensList = ref([]);

        // =================================================================================================================

        const allowanceForToken = computed(() => {
            if (!selectedSrcToken.value?.address || !currentRoute.value?.service?.id || !walletAccount.value) {
                return null;
            }

            return store.getters['tokenOps/allowanceForToken'](
                walletAccount.value,
                selectedSrcNetwork.value.net,
                selectedSrcToken.value.address,
                currentRoute.value?.service?.id
            );
        });

        const approveForToken = computed(() => {
            if (!selectedSrcToken.value?.address || !currentRoute.value?.service?.id || !walletAccount.value) {
                return null;
            }

            return store.getters['tokenOps/approveForToken'](
                walletAccount.value,
                selectedSrcNetwork.value.net,
                selectedSrcToken.value.address,
                currentRoute.value?.service?.id
            );
        });

        // =================================================================================================================

        const isNeedApprove = computed(() => {
            if (!srcAmount.value) {
                return false;
            }

            if (!selectedSrcToken.value?.address && !allowanceForToken.value) {
                return false;
            }

            if (!selectedSrcToken.value?.decimals) {
                return false;
            }

            const currentAmount = utils.parseUnits(srcAmount.value, selectedSrcToken.value?.decimals).toString();

            const isEnough = BigNumber(currentAmount).lte(allowanceForToken.value);

            console.log('isEnough', isEnough);

            return !isEnough;
        });

        // =================================================================================================================

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](currentChainInfo.value?.net));
        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const bestRouteInfo = computed(() => store.getters['swap/bestRoute']);
        const isShowRoutesModal = computed(() => store.getters['swap/showRoutes']);

        const disabledBtn = computed(
            () =>
                isLoading.value ||
                isBalanceError.value ||
                isSwapLoading.value ||
                isWaitingTxStatusForModule.value ||
                !+srcAmount.value ||
                !dstAmount.value ||
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstToken.value ||
                (isReceiveToken.value && (errorAddress.value || !receiverAddress.value))
        );

        const getSelectedNetwork = () => {
            if (targetDirection.value === DIRECTIONS.SOURCE) {
                return selectedSrcNetwork.value;
            }
            return selectedDstNetwork.value;
        };

        const resetValues = () => {
            dstAmount.value = '';
            isLoading.value = false;
            estimateRate.value = 0;
            networkFee.value = 0;
            differPercentage.value = null;
            bestRoute.value = null;
        };

        const handleOnSelectNetwork = (network, direction) => {
            if (direction === DIRECTIONS.SOURCE) {
                selectedSrcNetwork.value = network;
                return clearApproveForService();
            }

            selectedDstNetwork.value = network;

            selectedDstToken.value = null;

            resetValues();
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

                const price = await PricesModule.Coingecko.priceByPlatformContracts({
                    chainId: chainId,
                    addresses: token.address,
                });

                const { usd = 0 } = price[token.address.toLowerCase()];
                token.price = usd;
            }

            if (direction === TOKEN_SELECT_TYPES.FROM) {
                selectedSrcToken.value = token;
                clearApproveForService();
                currentRoute.value = null;
                bestRoute.value = null;
            } else {
                selectedDstToken.value = token;
            }

            await onSetAmount(srcAmount.value);

            isLoading.value = false;
        };

        // =================================================================================================================

        const toggleRoutesModal = (action = false) => {
            store.dispatch('swap/setShowRoutes', action);
        };

        // =================================================================================================================

        const onSetAddress = (addr) => {
            receiverAddress.value = addr;

            if (!addr.length) {
                return (errorAddress.value = '');
            }

            if (!validateAddress(addr, { chainId: selectedDstNetwork?.value?.net })) {
                return (errorAddress.value = 'Invalid address');
            }

            return (errorAddress.value = '');
        };

        const onSetAmount = async (value) => {
            srcAmount.value = value;
            differPercentage.value = null;
            txError.value = '';
            dstAmount.value = '';
            isBalanceError.value = false;

            if (!+value) {
                return (isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance));
            }

            isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance);

            if (!allowanceForToken.value) {
                await requestAllowance(currentRoute.value?.service);
            }

            if (srcAmount.value || isCallEstimate.value) {
                await getEstimateInfo();
                isCallEstimate.value = false;
            }
        };

        // =================================================================================================================

        const isAllowForRequest = () => {
            const notAllData = !walletAddress.value || !selectedSrcNetwork.value;

            if (notAllData) {
                return false;
            }

            if (!selectedSrcToken.value) {
                estimateErrorTitle.value = t('tokenOperations.selectSrcToken');
                return false;
            }

            if (!selectedDstToken.value) {
                estimateErrorTitle.value = t('tokenOperations.selectDstToken');
                return false;
            }

            const isNotEVM = selectedSrcNetwork.value?.ecosystem !== ECOSYSTEMS.EVM;

            return isNotEVM || true;
        };

        // =================================================================================================================

        const requestAllowance = async (service) => {
            if (!isAllowForRequest() || !selectedSrcToken.value?.address) {
                return;
            }

            return await makeAllowanceRequest(service);
        };

        const requestApprove = async (service) => {
            if (!isAllowForRequest() || !selectedSrcToken.value?.address) {
                return;
            }

            return await makeApproveRequest(service);
        };

        // =================================================================================================================

        const getDifferPercentage = () => {
            const { price: srcPrice = 0 } = selectedSrcToken.value || {};
            const { price: dstPrice = 0 } = selectedDstToken.value || {};

            const fromUsdValue = BigNumber(srcPrice).multipliedBy(srcAmount.value);
            const toUsdValue = BigNumber(dstPrice).multipliedBy(dstAmount.value);

            return toUsdValue.minus(fromUsdValue).dividedBy(toUsdValue).multipliedBy(100).toFixed(2);
        };

        const getRecipientAddress = () => {
            if (currentRoute.value.service.type === 'swap') {
                return walletAddress.value;
            }

            return receiverAddress.value || walletAddress.value;
        };

        // =================================================================================================================

        const getEstimateInfo = async () => {
            if (
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstNetwork.value ||
                !selectedDstToken.value ||
                !+srcAmount.value
            ) {
                return (estimateErrorTitle.value = 'Select all fields');
            }

            isLoading.value = true;

            const resEstimate = await findBestRoute(srcAmount.value, walletAddress.value, selectedSrcToken.value, selectedDstToken.value);

            if (resEstimate?.error) {
                estimateErrorTitle.value = resEstimate.error;
                dstAmount.value = 0;

                return (isLoading.value = false);
            }

            if (!+srcAmount.value) {
                dstAmount.value = 0;

                return (isLoading.value = false);
            }

            const checkRoute =
                resEstimate.toToken === selectedDstToken.value &&
                resEstimate.fromToken === selectedSrcToken.value &&
                resEstimate.bestRoute?.fromTokenAmount === srcAmount.value;

            if (checkRoute) {
                store.dispatch('swap/setBestRoute', resEstimate);
                currentRoute.value = resEstimate.bestRoute.routes.find((elem) => elem.status === STATUSES.SIGNING);

                bestRoute.value = resEstimate.bestRoute;
                otherRoutes.value = resEstimate.otherRoutes || [];
                estimateErrorTitle.value = '';

                dstAmount.value = resEstimate.bestRoute?.toTokenAmount;

                networkFee.value = prettyNumberTooltip(resEstimate.bestRoute?.estimateFeeUsd, 6);
                estimateRate.value = prettyNumberTooltip(resEstimate.bestRoute.toTokenAmount / resEstimate.bestRoute.fromTokenAmount, 6);

                differPercentage.value = getDifferPercentage();

                isLoading.value = false;
            }

            if (selectedSrcNetwork.value.net !== currentChainInfo.value.net) {
                networkName.value = selectedSrcNetwork.value.name;
                opTitle.value = 'tokenOperations.switchNetwork';
            }
        };

        // =================================================================================================================

        const makeSwapRequest = async (params) => {
            showNotification({
                key: 'prepare-tx',
                type: 'info',
                title: `Swap ${srcAmount.value} ${selectedSrcToken.value.symbol} to ~${dstAmount.value} ${selectedDstToken.value.symbol}`,
                description: 'Please wait, transaction is preparing',
                icon: h(SettingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const response = await getSwapTx({
                    ...params,
                });

                if (response.error) {
                    txError.value = response?.error || response;
                    txErrorTitle.value = 'Swap error';
                    closeNotification('prepare-tx');

                    return (isLoading.value = false);
                }

                return response;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
                closeNotification('prepare-tx');
            }
        };

        // =================================================================================================================
        const makeBridgeTx = async (params) => {
            showNotification({
                key: 'prepare-tx',
                type: 'info',
                title: `Bridge ${srcAmount.value} ${selectedSrcToken.value.symbol} to ~${dstAmount.value} ${selectedDstToken.value.symbol}`,
                description: 'Please wait, transaction is preparing',
                icon: h(SettingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const response = await getBridgeTx({
                    ...params,
                });

                if (response.error) {
                    txError.value = response?.error || response;
                    txErrorTitle.value = 'Bridge transaction error';

                    closeNotification('prepare-tx');

                    return (isLoading.value = false);
                }

                return response;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
                closeNotification('prepare-tx');
            }
        };

        // =================================================================================================================

        const handleApprove = async () => {
            console.log('handleApprove', currentRoute.value?.service);
            await requestApprove(currentRoute.value?.service);

            if (!approveForToken.value) {
                return (isLoading.value = false);
            }

            txError.value = '';
            txErrorTitle.value = '';

            const txToSave = {
                index: 0,
                ecosystem: selectedSrcNetwork.value.ecosystem,
                module,
                status: STATUSES.IN_PROGRESS,
                parameters: {
                    ...approveForToken.value,
                    from: walletAddress.value,
                },
                account: walletAccount.value,
                chainId: `${selectedSrcNetwork.value?.chain_id}`,
                metaData: {
                    action: 'formatTransactionForSign',
                    type: 'Approve',
                    successCallback: {
                        action: 'GET_ALLOWANCE',
                        requestParams: {
                            url: selectedService.value.url,
                            net: selectedSrcNetwork.value.net,
                            tokenAddress: selectedSrcToken.value.address,
                            ownerAddress: walletAddress.value,
                            service: selectedService.value,
                        },
                    },
                },
            };

            await createTransactions([txToSave]);
        };

        const handleOperationByType = async () => {
            const OPERATIONS = {
                swap: makeSwapRequest,
                bridge: makeBridgeTx,
            };

            opTitle.value = 'tokenOperations.confirm';

            const { type } = currentRoute.value?.service || {};

            if (!type) {
                return (isLoading.value = false);
            }

            if (!OPERATIONS[type]) {
                return;
            }

            const params = {
                url: currentRoute.value.service.url,
                net: currentRoute.value.net,
                fromTokenAddress: currentRoute.value.fromToken?.address || NATIVE_CONTRACT,
                fromNet: currentRoute.value.net,
                amount: currentRoute.value.amount,
                toNet: currentRoute.value.toNet,
                toTokenAddress: currentRoute.value.toToken?.address || NATIVE_CONTRACT,
                ownerAddress: walletAddress.value,
                slippage: 1,
            };

            if (currentRoute.value.service?.recipientAddress) {
                params.recipientAddress = getRecipientAddress();
                params.fallbackAddress = walletAddress.value;
            }

            const response = await OPERATIONS[type]({ ...params });

            const txToSave = {
                ecosystem: selectedSrcNetwork.value.ecosystem,
                module,
                status: STATUSES.IN_PROGRESS,
                parameters: response,
                account: walletAccount.value,
                chainId: `${selectedSrcNetwork.value?.chain_id}`,
                metaData: {
                    action: 'formatTransactionForSign',
                    type: type.toUpperCase(),
                },
            };

            if (currentRequestID.value && currentRequestID.value !== '') {
                return await addTransactionToRequestID(currentRequestID.value, txToSave);
            }

            txToSave.index = 0;

            return await createTransactions([txToSave]);
        };

        const swap = async () => {
            const network = networkName.value === selectedDstNetwork.value.name ? selectedDstNetwork : selectedSrcNetwork;

            const { isChanged, btnTitle } = await isCorrectChain(network, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                isLoading.value = false;
            }

            opTitle.value = 'tokenOperations.confirm';

            isSwapLoading.value = true;
            txError.value = '';

            // APPROVE
            if (isNeedApprove.value) {
                opTitle.value = 'tokenOperations.approve';
                await handleApprove();
            } else {
                await handleOperationByType();
            }

            if (!transactionForSign.value) {
                isSwapLoading.value = false;
                return (isLoading.value = false);
            }

            closeNotification('prepare-tx');

            try {
                const responseSendTx = await signAndSend(transactionForSign.value);

                if (responseSendTx.error) {
                    txError.value = responseSendTx.error;
                    txErrorTitle.value = 'Swap Transaction error';
                    return;
                }

                isSwapLoading.value = false;

                if (!isNeedApprove.value) {
                    bestRoute.value.routes = bestRoute.value.routes.map((elem, i) => {
                        if (elem.status === STATUSES.SIGNING) {
                            elem.status = STATUSES.COMPLETED;
                        } else if (elem.status === STATUSES.PENDING && bestRoute.value.routes[i - 1]?.status == STATUSES.COMPLETED) {
                            elem.status = STATUSES.SIGNING;
                        }
                        return elem;
                    });
                }

                currentRoute.value = bestRoute.value.routes.find((elem) => elem.status === STATUSES.SIGNING);

                if (!currentRoute.value) {
                    isBalanceError.value = '';
                    return store.dispatch('swap/setBestRoute', null);
                }

                if (currentRoute.value.net !== selectedSrcNetwork.value.net) {
                    store.dispatch('tokens/setDisableLoader', true);
                    return (networkName.value = selectedDstNetwork.value.name);
                }
            } catch (error) {
                txError.value = error?.message || error?.error || error;
                txErrorTitle.value = 'Swap Transaction error';
                isLoading.value = false;
                isSwapLoading.value = false;
            }
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

        watch(isAllTokensLoading, () => {
            setTokenOnChange();
        });

        watch(selectedSrcNetwork, () => {
            resetValues();
            onSetAmount(null);
            selectedSrcToken.value = null;
            setTokenOnChange();
            getEstimateInfo();
        });

        watch(selectedDstNetwork, () => {
            getEstimateInfo();
        });

        watch(txError, () => {
            if (!txError.value) {
                return;
            }

            isSwapLoading.value = false;
        });

        // route is changed
        watch(isShowRoutesModal, () => {
            if (isShowRoutesModal.value) {
                return;
            }

            console.log('bestRouteInfo', bestRouteInfo.value);

            bestRoute.value = bestRouteInfo.value.bestRoute;
            otherRoutes.value = bestRouteInfo.value.otherRoutes;
            currentRoute.value = bestRoute.value.routes.find((elem) => elem.status === STATUSES.SIGNING);
            srcAmount.value = bestRouteInfo.value.bestRoute?.fromTokenAmount;
            dstAmount.value = bestRouteInfo.value.bestRoute?.toTokenAmount;

            networkFee.value = prettyNumberTooltip(bestRouteInfo.value.bestRoute?.estimateFeeUsd, 6);

            estimateRate.value = prettyNumberTooltip(
                bestRouteInfo.value.bestRoute.toTokenAmount / bestRouteInfo.value.bestRoute.fromTokenAmount,
                6
            );
        });

        //
        watch(currentRoute, async () => {
            console.log('-'.repeat(20));
            console.log('currentRoute', currentRoute.value);
            console.log('-'.repeat(20));

            if (!allowanceForToken.value) {
                await requestAllowance(currentRoute.value?.service);
            }
        });

        watch(isWaitingTxStatusForModule, () => {
            if (!currentRoute.value && !isWaitingTxStatusForModule.value) {
                // reset values

                onSetAmount(null);
                estimateRate.value = 0;
                networkFee.value = 0;
                differPercentage.value = null;
                bestRoute.value = null;
                otherRoutes.value = [];
                estimateErrorTitle.value = '';
                isSwapLoading.value = false;
                isLoading.value = false;
                return;
            }
        });

        //         if ((!currentChainInfo.value.net || !SUPPORTED_CHAINS.includes(currentChainInfo.value?.net)) && !isShowRoutesModal.value) {
        //             router.push('/main');
        //         }
        //     }
        // );

        watch(isNeedApprove, () => {
            if (isNeedApprove.value && opTitle.value !== 'tokenOperations.switchNetwork') {
                return (opTitle.value = 'tokenOperations.approve');
            }

            checkSelectedNetwork();
        });

        watch(walletAccount, () => {
            selectedSrcNetwork.value = currentChainInfo.value;
            selectedSrcToken.value = null;
            selectedDstNetwork.value = currentChainInfo.value;
            selectedDstToken.value = null;
            onSetAmount(null);
            setTokenOnChange();
        });

        // =================================================================================================================

        onBeforeUnmount(() => {
            selectedSrcNetwork.value = null;
            selectedSrcToken.value = null;
            selectedDstNetwork.value = null;
            selectedDstToken.value = null;
            receiverAddress.value = '';
        });

        return {
            isLoading,
            isSwapLoading,
            isShowRoutesModal,
            isTokensLoadingForChain,
            isWaitingTxStatusForModule,

            disabledBtn,
            isReceiveToken,
            estimateRate,
            supportedNetworks,

            dstAmount,
            srcAmount,

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

            estimateErrorTitle,
            successHash,
            currentChainInfo,
            networkFee,

            tokensList,

            differPercentage,

            handleOnSelectNetwork,
            handleOnClickSelectToken,
            handleOnSelectToken,

            onSetAddress,
            onSetAmount,

            swap,

            getEstimateInfo,
            toggleRoutesModal,
        };
    },
};
</script>
<style lang="scss">
.superswap-panel {
    width: 660px;
    position: relative;

    .swap-btn {
        @include pageFlexRow;
        justify-content: center;
        position: absolute;
        left: 120px;
        top: 114px;
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
        top: -56px;
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

            span {
                color: var(--#{$prefix}base-text);
                font-weight: 400;
            }
        }
    }

    .routes {
        @include pageFlexRow;
        padding: 12px 0;
        width: 96%;

        border-top: 2px solid var(--#{$prefix}collapse-border-color);

        div {
            @include pageFlexRow;
        }

        img {
            width: 24px;
            height: 24px;
            margin-right: 8px;
            border-radius: 50%;
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
