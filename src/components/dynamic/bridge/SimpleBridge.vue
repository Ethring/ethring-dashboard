<template>
    <div class="simple-bridge">
        <div class="select-group">
            <SelectNetwork
                label="From"
                placeholder="Select network"
                :items="srcNets"
                :current="selectedSrcNetwork"
                @select="(network) => handleOnSelectNetwork(network, DIRECTIONS.SOURCE)"
            />
            <SelectNetwork
                label="To"
                placeholder="Select network"
                :items="dstNets"
                class="select-group-to"
                :current="selectedDstNetwork"
                @select="(network) => handleOnSelectNetwork(network, DIRECTIONS.DESTINATION)"
            />
        </div>

        <SelectAmount
            v-if="selectedSrcNetwork"
            :value="selectedSrcToken"
            :selected-network="selectedSrcNetwork"
            :error="!!isBalanceError"
            :on-reset="resetSrcAmount"
            :disabled="!selectedSrcToken"
            :label="$t('tokenOperations.transferFrom')"
            :is-token-loading="isTokensLoadingForSrc"
            :amount-value="srcAmount"
            class="mt-8"
            @setAmount="onSetAmount"
            @clickToken="onSetSrcToken"
        />

        <SelectAmount
            v-if="selectedDstNetwork"
            hide-max
            disabled
            :value="selectedDstToken"
            :is-amount-loading="isEstimating"
            :is-token-loading="isTokensLoadingForDst"
            :label="$t('tokenOperations.transferTo')"
            :disabled-value="dstAmount"
            :on-reset="resetDstAmount"
            :amount-value="dstAmount"
            class="mt-8"
            @clickToken="onSetDstToken"
        />

        <Checkbox
            v-if="selectedDstToken"
            id="isSendToAnotherAddress"
            v-model:value="isSendToAnotherAddress"
            :label="`Receive ${selectedDstToken?.symbol} to another wallet`"
            class="mt-8"
        />

        <SelectAddress
            v-if="isSendToAnotherAddress"
            :selected-network="selectedDstNetwork"
            :error="!!errorAddress"
            placeholder="0x..."
            class="mt-8"
            :value="receiverAddress"
            :on-reset="clearAddress"
            @setAddress="onSetAddress"
        />

        <EstimateInfo
            v-if="estimateErrorTitle || srcAmount"
            :loading="isEstimating"
            :service="selectedService"
            :title="$t('tokenOperations.routeInfo')"
            :main-fee="rateInfo"
            :fees="[protocolFeeMain, feeInfo, estimateTimeInfo]"
            :error="estimateErrorTitle"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledBtn"
            :loading="isWaitingTxStatusForModule || isLoading"
            class="simple-bridge__btn mt-16"
            @click="handleOnConfirm"
            size="large"
        />
    </div>
</template>
<script>
import { h, ref, watch, computed, onBeforeUnmount, onMounted, onBeforeMount } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

import { SettingOutlined } from '@ant-design/icons-vue';

// Adapter
import { ECOSYSTEMS } from '@/Adapter/config';
import useAdapter from '@/Adapter/compositions/useAdapter';

// Notification
import useNotification from '@/compositions/useNotification';
import useServices from '../../../compositions/useServices';

// Transaction Management
import useTransactions from '../../../Transactions/compositions/useTransactions';
import { STATUSES } from '../../../Transactions/shared/constants';

import {
    estimateBridge,
    getBridgeTx,
    cancelRequestByMethod,
    // getDebridgeTxHashForOrder
} from '@/api/services';

import SelectAmount from '@/components/ui/SelectAmount';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectNetwork from '@/components/ui/SelectNetwork';

import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import EstimateInfo from '@/components/ui/EstimateInfo.vue';

import { formatNumber } from '@/helpers/prettyNumber';

import { getServices, SERVICE_TYPE } from '@/config/services';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { isCorrectChain } from '@/shared/utils/operations';

import { updateWalletBalances } from '@/shared/utils/balances';

export default {
    name: 'SimpleBridge',
    components: {
        SelectAmount,
        SelectNetwork,
        SelectAddress,
        Button,
        Checkbox,
        EstimateInfo,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const { t } = useI18n();

        const { name: module } = router.currentRoute.value;

        const addressesByChains = ref({});

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        const { walletAccount, walletAddress, currentChainInfo, chainList, validateAddress, setChain, getAddressesWithChainsByEcosystem } =
            useAdapter();

        // * Transaction Manager
        const { currentRequestID, transactionForSign, createTransactions, signAndSend, addTransactionToRequestID } = useTransactions();

        // Bridge Data

        const servicesEVM = getServices(SERVICE_TYPE.BRIDGE);
        const servicesCosmos = getServices(SERVICE_TYPE.BRIDGE, ECOSYSTEMS.COSMOS);

        // =================================================================================================================

        const selectedService = computed({
            get: () => store.getters['bridge/service'],
            set: (value) => store.dispatch('bridge/setService', value),
        });

        const setEcosystemService = () => {
            if (!currentChainInfo.value?.ecosystem) {
                return;
            }

            const DEFAULT_FOR_ECOSYSTEM = {
                [ECOSYSTEMS.EVM]: 'bridge-debridge',
                [ECOSYSTEMS.COSMOS]: 'bridge-skip',
            };

            switch (currentChainInfo.value?.ecosystem) {
                case ECOSYSTEMS.COSMOS:
                    return (selectedService.value = servicesCosmos.find(
                        (service) => service.id === DEFAULT_FOR_ECOSYSTEM[ECOSYSTEMS.COSMOS]
                    ));
                case ECOSYSTEMS.EVM:
                    return (selectedService.value = servicesEVM.find((service) => service.id === DEFAULT_FOR_ECOSYSTEM[ECOSYSTEMS.EVM]));
            }
        };

        // =================================================================================================================
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

            setTokenOnChangeForNet,
            makeAllowanceRequest,
            makeApproveRequest,
            checkSelectedNetwork,
        } = useServices({
            selectedService: selectedService.value,
            module,
            moduleType: 'bridge',
        });

        // =================================================================================================================

        const allowanceForToken = computed(() => {
            if (!selectedSrcToken.value?.address || !selectedService.value?.id || !walletAccount.value) {
                return null;
            }

            return store.getters['tokenOps/allowanceForToken'](
                walletAccount.value,
                selectedSrcNetwork.value.net,
                selectedSrcToken.value.address,
                selectedService.value.id
            );
        });

        const approveForToken = computed(() => {
            if (!selectedSrcToken.value?.address || !selectedService.value?.id || !walletAccount.value) {
                return null;
            }

            return store.getters['tokenOps/approveForToken'](
                walletAccount.value,
                selectedSrcNetwork.value.net,
                selectedSrcToken.value.address,
                selectedService.value.id
            );
        });

        // =================================================================================================================
        // Loaders
        const isEstimating = ref(false);
        const isLoading = ref(false);
        const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](module));

        const clearAddress = ref(false);
        const balanceUpdated = ref(false);
        const isSendToAnotherAddress = ref(false);

        const estimateErrorTitle = ref('');

        const resetSrcAmount = ref(false);
        const resetDstAmount = ref(false);

        const baseFeeInfo = (title, symbolBetween, fromAmount, fromSymbol, toAmount, toSymbol) => {
            return {
                title,
                symbolBetween,
                fromAmount,
                fromSymbol,
                toAmount,
                toSymbol,
            };
        };

        const rateInfo = ref(baseFeeInfo('', '', '', '', '', ''));
        const feeInfo = ref(baseFeeInfo('', '', '', '', '', ''));
        const estimateTimeInfo = ref(baseFeeInfo('', '', '', '', '', ''));
        const protocolFeeMain = ref(baseFeeInfo('', '', '', '', '', ''));

        const estimateTime = ref('');

        // =================================================================================================================

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);
        const isTokensLoadingForSrc = computed(() => store.getters['tokens/loadingByChain'](selectedSrcNetwork.value?.net));
        const isTokensLoadingForDst = computed(() => store.getters['tokens/loadingByChain'](selectedDstNetwork.value?.net));

        // =================================================================================================================

        const errorAddress = ref('');
        const isBalanceError = ref(false);

        // =================================================================================================================

        const NOT_SUPPORT = ['fantom', 'optimism'];

        const srcNets = computed(() =>
            chainList.value.filter((network) => network.net !== selectedDstNetwork?.value?.net && !NOT_SUPPORT.includes(network.net))
        );

        const dstNets = computed(() =>
            chainList.value.filter((network) => network.net !== selectedSrcNetwork?.value?.net && !NOT_SUPPORT.includes(network.net))
        );

        // =================================================================================================================

        const disabledBtn = computed(
            () =>
                isLoading.value ||
                isBalanceError.value ||
                isWaitingTxStatusForModule.value ||
                !+srcAmount.value ||
                !dstAmount.value ||
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstNetwork.value ||
                !selectedDstToken.value ||
                (isSendToAnotherAddress.value && (errorAddress.value || !receiverAddress.value))
        );

        // =================================================================================================================

        const handleOnSelectNetwork = async (network, direction) => {
            if (!network.net) {
                return;
            }
            if (direction === DIRECTIONS.SOURCE) {
                selectedSrcNetwork.value = network;
                selectedSrcToken.value = setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

                srcAmount.value && (await onSetAmount(srcAmount.value));
                receiverAddress.value && onSetAddress(receiverAddress.value);

                return clearApproveForService();
            }

            selectedDstNetwork.value = network;

            selectedDstToken.value = null;

            selectedDstToken.value = setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value);

            isEstimating.value = false;

            estimateErrorTitle.value = '';

            srcAmount.value && (await onSetAmount(srcAmount.value));
            receiverAddress.value && onSetAddress(receiverAddress.value);
        };

        // =================================================================================================================

        const onSetSrcToken = async () => {
            onlyWithBalance.value = true;
            targetDirection.value = DIRECTIONS.SOURCE;
            selectType.value = TOKEN_SELECT_TYPES.FROM;

            router.push('/bridge/select-token');

            balanceUpdated.value = false;

            return clearApproveForService();
        };

        const onSetDstToken = async () => {
            targetDirection.value = DIRECTIONS.DESTINATION;
            selectType.value = TOKEN_SELECT_TYPES.TO;
            onlyWithBalance.value = false;

            router.push('/bridge/select-token');

            return (balanceUpdated.value = false);
        };

        const onSetAddress = (addr) => {
            receiverAddress.value = addr;

            if (!addr) {
                clearAddress.value = true;
                errorAddress.value = '';
                return setTimeout(() => (clearAddress.value = false), 1000);
            }

            if (!validateAddress(addr, { chainId: selectedDstNetwork?.value?.net })) {
                return (errorAddress.value = 'Invalid address');
            }

            return (errorAddress.value = '');
        };

        const resetAmounts = async (type = DIRECTIONS.SOURCE, amount) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) {
                return;
            }

            const direction = {
                [DIRECTIONS.SOURCE]: resetSrcAmount,
                [DIRECTIONS.DESTINATION]: resetDstAmount,
            };

            const isEmpty = amount === null;

            if (direction[type] && isEmpty) {
                direction[type].value = false;
                direction[type].value = isEmpty;
                setTimeout(() => (direction[type].value = false));
            }

            clearAddress.value = receiverAddress.value === null;

            if (clearAddress.value) {
                onSetAddress(null);
                setTimeout(() => (clearAddress.value = false));
            }
        };

        const onSetAmount = async (value) => {
            srcAmount.value = value;
            txError.value = '';
            dstAmount.value = '';

            if (!+value) {
                return (isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance));
            }

            const isNotEnoughBalance = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance);

            isBalanceError.value = isNotEnoughBalance;

            if (!allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                await requestAllowance();
            }

            receiverAddress.value && onSetAddress(receiverAddress.value);

            feeInfo.value = baseFeeInfo('', '', '', '', '', '');
            rateInfo.value = baseFeeInfo('', '', '', '', '', '');
            estimateTimeInfo.value = baseFeeInfo('', '', '', '', '', '');
            protocolFeeMain.value = baseFeeInfo('', '', '', '', '', '');

            return await makeEstimateBridgeRequest();
        };

        // =================================================================================================================

        const isNeedApprove = computed(() => {
            if (!srcAmount.value) {
                return false;
            }

            if (selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.COSMOS) {
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

            return !isEnough;
        });

        // =================================================================================================================

        const isAllowForRequest = () => {
            const notAllData = !walletAddress.value || !selectedSrcNetwork.value || !selectedService.value;

            if (notAllData) {
                return false;
            }

            if (!selectedSrcToken.value) {
                estimateErrorTitle.value = t('tokenOperations.selectSrcToken');
                return false;
            }

            if (!selectedDstNetwork.value) {
                estimateErrorTitle.value = t('tokenOperations.selectDstNetwork');
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

        const requestAllowance = async () => {
            if (!isAllowForRequest() || !selectedSrcToken.value?.address) {
                return;
            }

            return await makeAllowanceRequest(selectedService.value);
        };

        const requestApprove = async () => {
            if (!isAllowForRequest() || !selectedSrcToken.value?.address) {
                return;
            }

            return await makeApproveRequest(selectedService.value);
        };

        // =================================================================================================================

        const makeEstimateBridgeRequest = async () => {
            if (!isAllowForRequest() || !selectedDstNetwork.value || !+srcAmount.value === 0) {
                isEstimating.value = false;
                return (isLoading.value = false);
            }

            isEstimating.value = true;

            if (cancelRequestByMethod) {
                await cancelRequestByMethod('estimateBridge');
            }

            const params = {
                url: selectedService.value.url,
                fromNet: selectedSrcNetwork.value.net,
                toNet: selectedDstNetwork.value.net,
                fromTokenAddress: selectedSrcToken.value.address,
                toTokenAddress: selectedDstToken.value.address,
                amount: srcAmount.value,
            };

            if (selectedService.value.id === 'bridge-skip') {
                params.ownerAddresses = JSON.stringify(addressesByChains.value);
            } else {
                params.ownerAddress = walletAddress.value;
            }

            const response = await estimateBridge(params);

            if (response.error) {
                isEstimating.value = false;

                return (estimateErrorTitle.value = response.error);
            }

            isEstimating.value = false;
            isLoading.value = false;

            dstAmount.value = BigNumber(response.toTokenAmount).toFixed(6);

            estimateErrorTitle.value = '';

            if (response.fee) {
                feeInfo.value = {
                    title: 'tokenOperations.serviceFee',
                    symbolBetween: '~',
                    fromAmount: formatNumber(response.fee.amount),
                    fromSymbol: response.fee.currency,
                    toAmount: formatNumber(BigNumber(response.fee.amount).multipliedBy(selectedSrcToken.value?.price).toString()),
                    toSymbol: '$',
                };
            }

            rateInfo.value = {
                title: 'tokenOperations.rate',
                symbolBetween: '~',
                fromAmount: '1',
                fromSymbol: selectedSrcToken.value.symbol,
                toAmount: formatNumber(response.toTokenAmount / response.fromTokenAmount, 6),
                toSymbol: selectedDstToken.value.symbol,
            };

            const { estimatedTime = {}, protocolFee = null } = selectedService.value || {};

            const { chainId, chain_id, native_token = null } = selectedSrcNetwork.value || {};

            const chain = chainId || chain_id;

            if (estimatedTime[chain]) {
                const time = Math.round(estimatedTime[chain] / 60);

                estimateTimeInfo.value = {
                    title: 'tokenOperations.time',
                    symbolBetween: '<',
                    fromAmount: '',
                    fromSymbol: '',
                    toAmount: time,
                    toSymbol: 'min',
                };
            }

            if (!protocolFee) {
                return;
            }

            const fee = protocolFee[chain_id] || 0;

            if (!fee) {
                return;
            }

            const { symbol = null, price = 0 } = native_token || 0;

            const feeInUSD = BigNumber(fee).multipliedBy(price).toString();

            protocolFeeMain.value = {
                title: 'tokenOperations.protocolFee',
                symbolBetween: '~',
                fromAmount: fee,
                fromSymbol: symbol,
                toAmount: feeInUSD,
                toSymbol: '$',
            };
        };

        // =================================================================================================================
        const makeBridgeTx = async () => {
            if (cancelRequestByMethod) {
                await cancelRequestByMethod('getBridgeTx');
            }

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
                const params = {
                    url: selectedService.value.url,
                    fromNet: selectedSrcNetwork.value.net,
                    fromTokenAddress: selectedSrcToken.value.address,
                    amount: srcAmount.value,
                    toNet: selectedDstNetwork.value.net,
                    toTokenAddress: selectedDstToken.value.address,
                };

                if (receiverAddress.value && receiverAddress.value !== '' && isSendToAnotherAddress.value) {
                    params.recipientAddress = receiverAddress.value;
                    addressesByChains.value[selectedDstNetwork.value?.net] = receiverAddress.value;
                }

                if (selectedService.value.id === 'bridge-skip') {
                    params.ownerAddresses = JSON.stringify(addressesByChains.value);
                } else {
                    params.ownerAddress = walletAddress.value;
                    params.recipientAddress = receiverAddress.value || walletAddress.value;
                    params.fallbackAddress = walletAddress.value;
                }

                const response = await getBridgeTx(params);

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
            opTitle.value = 'tokenOperations.approve';

            await requestApprove();

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
                account: walletAddress.value,
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

        // =================================================================================================================

        const handleBridge = async () => {
            opTitle.value = 'tokenOperations.confirm';

            const responseBridge = await makeBridgeTx();

            if (!responseBridge) {
                return (isLoading.value = false);
            }

            const txToSave = {
                ecosystem: selectedSrcNetwork.value.ecosystem,
                module,
                status: STATUSES.IN_PROGRESS,
                parameters: responseBridge,
                account: walletAddress.value,
                chainId: `${selectedSrcNetwork.value?.chain_id}`,
                metaData: {
                    action: 'formatTransactionForSign',
                    type: 'BRIDGE',
                    successCallback: {
                        action: 'CLEAR_AMOUNTS',
                    },
                },
            };

            if (currentRequestID.value && currentRequestID.value !== '') {
                return await addTransactionToRequestID(currentRequestID.value, txToSave);
            }

            txToSave.index = 0;

            return await createTransactions([txToSave]);
        };

        // =================================================================================================================

        const handleUpdateBalance = (network, targetDirection = 'SrcNetwork') => {
            const isSrc = targetDirection === 'SrcNetwork';

            const selectedToken = isSrc ? selectedSrcToken.value : selectedDstToken.value;

            const targetAddress = addressesByChains.value[network.net] || walletAddress.value;

            updateWalletBalances(walletAccount.value, targetAddress, network, (list) => {
                const token = list.find((elem) => elem.symbol === selectedToken.symbol);
                if (!token) {
                    return;
                }

                if (isSrc && selectedSrcToken.value?.id === token.id) {
                    selectedSrcToken.value = token;
                }

                if (!isSrc && selectedDstToken.value?.id === token.id) {
                    selectedDstToken.value = token;
                }
            });
        };

        // =================================================================================================================

        const handleOnConfirm = async () => {
            isLoading.value = true;
            txError.value = '';

            const { isChanged, btnTitle } = await isCorrectChain(selectedSrcNetwork, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                return (isLoading.value = false);
            }

            opTitle.value = 'tokenOperations.confirm';

            if (isNeedApprove.value) {
                await handleApprove();
            } else {
                await handleBridge();
            }

            if (!transactionForSign.value) {
                return (isLoading.value = false);
            }

            try {
                isLoading.value = true;

                const responseSendTx = await signAndSend(transactionForSign.value);

                closeNotification('prepare-tx');

                clearApproveForService();

                if (responseSendTx.error) {
                    resetSrcAmount.value = false;
                    resetDstAmount.value = false;
                    txError.value = responseSendTx.error;
                    txErrorTitle.value = 'Sign transaction error';
                    return (isLoading.value = false);
                }

                // if (selectedService.value.id === 'bridge-debridge') {
                //     await delay(1000);
                //     const hash = await getDebridgeTxHashForOrder(responseSendTx.transactionHash);

                //     if (hash) {
                //         // successHash.value = getTxExplorerLink(hash.dstHash, selectedDstNetwork.value);
                //     }
                // }

                isLoading.value = false;
                balanceUpdated.value = true;

                handleUpdateBalance(selectedSrcNetwork.value, 'SrcNetwork');
                handleUpdateBalance(selectedDstNetwork.value, 'DstNetwork');

                balanceUpdated.value = true;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        watch(walletAccount, () => {
            selectedSrcNetwork.value = currentChainInfo.value;

            selectedDstNetwork.value = null;

            selectedSrcToken.value = null;
            selectedDstToken.value = null;

            selectedSrcToken.value = setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

            selectedDstToken.value = setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value);

            setEcosystemService();
        });

        watch(isAllTokensLoading, () => {
            onlyWithBalance.value = false;
            selectedSrcToken.value = setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
            selectedDstToken.value = setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value);
        });

        watch(isTokensLoadingForSrc, () => {
            selectedSrcToken.value = null;
            onlyWithBalance.value = true;
            selectedSrcToken.value = setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
        });

        watch(isTokensLoadingForDst, () => {
            selectedDstToken.value = null;
            onlyWithBalance.value = false;
            selectedDstToken.value = setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value);
        });

        watch(isNeedApprove, () => {
            if (isNeedApprove.value) {
                return (opTitle.value = 'tokenOperations.approve');
            }

            return (opTitle.value = 'tokenOperations.confirm');
        });

        watch(selectedSrcNetwork, (newValue, oldValue) => {
            if (newValue?.net !== oldValue?.net) {
                selectedSrcToken.value = null;
                selectedSrcToken.value = setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
            }

            if (selectedDstNetwork.value && newValue?.net === selectedDstNetwork.value.net) {
                selectedDstNetwork.value = null;
                selectedDstToken.value = null;
            }
        });

        watch(selectedSrcToken, async () => {
            if (!selectedSrcToken.value) {
                return;
            }

            isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance);

            if (!allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                await requestAllowance();
            }
        });

        watch(txError, (err) => {
            if (!err) {
                return;
            }

            isLoading.value = false;

            showNotification({
                key: 'error-tx',
                type: 'error',
                title: txErrorTitle.value,
                description: JSON.stringify(txError.value || 'Unknown error'),
                duration: 5,
            });

            closeNotification('prepare-tx');
        });

        watch(isSendToAnotherAddress, () => {
            clearAddress.value = true;
            onSetAddress('');
            clearAddress.value = false;
        });

        watch(isNeedApprove, () => {
            if (isNeedApprove.value && opTitle.value !== 'tokenOperations.switchNetwork') {
                return (opTitle.value = 'tokenOperations.approve');
            }

            checkSelectedNetwork();
        });

        watch(srcAmount, () => resetAmounts(DIRECTIONS.SOURCE, srcAmount.value));

        watch(dstAmount, () => resetAmounts(DIRECTIONS.DESTINATION, dstAmount.value));

        watch(isWaitingTxStatusForModule, () => {
            if (!isWaitingTxStatusForModule.value) {
                selectedSrcNetwork.value && handleUpdateBalance(selectedSrcNetwork.value, 'SrcNetwork');
                selectedDstNetwork.value && handleUpdateBalance(selectedDstNetwork.value, 'DstNetwork');
            }
        });

        // =================================================================================================================

        onBeforeMount(() => {
            onlyWithBalance.value = true;
        });

        const setOwnerAddresses = () => {
            if (selectedService.value?.id !== 'bridge-skip') {
                return;
            }

            const addressesWithChains = getAddressesWithChainsByEcosystem(selectedSrcNetwork.value?.ecosystem);

            for (const chain in addressesWithChains) {
                const { address } = addressesWithChains[chain];

                addressesByChains.value = {
                    ...addressesByChains.value,
                    [chain]: address,
                };
            }
        };

        onMounted(async () => {
            setEcosystemService();

            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
                selectedSrcToken.value = setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
            }

            if (srcAmount.value) {
                dstAmount.value = null;
                await onSetAmount(srcAmount.value);
            }

            if (!allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                await makeAllowanceRequest();
            }

            isAllowForRequest();

            setOwnerAddresses();
        });

        watch(selectedService, () => setOwnerAddresses());

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/bridge/select-token') {
                targetDirection.value = DIRECTIONS.SOURCE;
                selectedSrcNetwork.value = null;
                selectedSrcToken.value = null;
                selectedDstNetwork.value = null;
                selectedDstToken.value = null;
                receiverAddress.value = '';
                srcAmount.value = null;
                dstAmount.value = null;
            }
        });

        return {
            // Loading
            isLoading,
            isEstimating,
            isAllTokensLoading,
            isTokensLoadingForSrc,
            isTokensLoadingForDst,
            isWaitingTxStatusForModule,

            disabledBtn,
            isNeedApprove,

            resetSrcAmount,
            resetDstAmount,

            isSendToAnotherAddress,

            chainList,

            DIRECTIONS,
            opTitle,

            srcNets,
            dstNets,

            srcAmount,
            dstAmount,

            errorAddress,
            isBalanceError,

            receiverAddress,
            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            // Information for accordion
            protocolFeeMain,
            feeInfo,
            rateInfo,
            estimateTimeInfo,
            estimateTime,
            txError,
            estimateErrorTitle,
            clearAddress,

            formatNumber,
            walletAddress,
            currentChainInfo,
            selectedService,

            // Handlers
            handleOnSelectNetwork,
            onSetAddress,
            onSetSrcToken,
            onSetDstToken,
            onSetAmount,
            handleOnConfirm,
        };
    },
};
</script>
<style lang="scss">
.simple-bridge {
    width: 524px;
    position: relative;

    .select-group {
        @include pageFlexRow;
        justify-content: space-between;
        position: relative;

        .select {
            width: 49%;

            .select__panel .name {
                font-size: var(--#{$prefix}h6-fs);
                line-height: 26px;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
                width: 160px;
            }
        }
        &-to {
            .select__items {
                left: -266px;
            }
        }
    }

    .accordion__content {
        img {
            width: 16px;
            height: 16px;
        }
    }

    .service-fee {
        font-weight: 600;
        color: var(--#{$prefix}sub-text);
    }

    .symbol {
        margin-left: 5px;
        font-weight: 600;
    }

    .accordion__title {
        @include pageFlexRow;

        font-weight: 400;
        color: var(--zmt-accordion-label-color);
        font-size: var(--zmt-default-fs);

        .route-info-title {
            color: var(--#{$prefix}warning);
            font-weight: 500;
            line-height: 20px;
            opacity: 0.8;

            display: inline;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            width: 500px;
            margin-left: 4px;
        }
    }

    &__btn {
        height: 64px;
        width: 100%;
    }
}
</style>
