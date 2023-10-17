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
                :current="selectedDstNetwork"
                @select="(network) => handleOnSelectNetwork(network, DIRECTIONS.DESTINATION)"
            />
        </div>

        <SelectAmount
            v-if="selectedSrcNetwork"
            :value="selectedSrcToken"
            :error="!!isBalanceError"
            :on-reset="resetAmount"
            :disabled="!selectedSrcToken"
            :label="$t('tokenOperations.send')"
            :is-token-loading="isTokensLoadingForSrc"
            class="mt-10"
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
            :label="$t('tokenOperations.receive')"
            :disabled-value="prettyNumber(receiveValue)"
            :on-reset="resetAmount"
            class="mt-10"
            @clickToken="onSetDstToken"
        />

        <Checkbox
            v-if="selectedDstToken"
            id="isSendToAnotherAddress"
            v-model:value="isSendToAnotherAddress"
            :label="`Receive ${selectedDstToken?.symbol} to another wallet`"
            class="mt-10"
        />

        <SelectAddress
            v-if="isSendToAnotherAddress"
            :selected-network="selectedDstNetwork"
            :error="!!errorAddress"
            placeholder="0x..."
            class="mt-10"
            :value="receiverAddress"
            :on-reset="clearAddress"
            @setAddress="onSetAddress"
        />

        <EstimateInfo
            v-if="receiveValue || estimateErrorTitle"
            :loading="isEstimating"
            :service="selectedService"
            :title="$t('tokenOperations.routeInfo')"
            :main-fee="protocolFeeMain"
            :fees="[feeInfo, estimateTimeInfo]"
            :error="estimateErrorTitle"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledBtn"
            :loading="isLoading"
            class="simple-bridge__btn mt-10"
            @click="handleOnConfirm"
            size="large"
        />
    </div>
</template>
<script>
import { h, ref, watch, computed, onBeforeUnmount, onMounted } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

import { LoadingOutlined } from '@ant-design/icons-vue';

// Adapter
import { ECOSYSTEMS } from '@/Adapter/config';
import useAdapter from '@/Adapter/compositions/useAdapter';

import useTokensList from '@/compositions/useTokensList';

// Notification
import useNotification from '@/compositions/useNotification';

// Transaction Management
import useTransactions from '../../../Transactions/compositions/useTransactions';
import { STATUSES } from '../../../Transactions/shared/constants';

import { getAllowance, getApproveTx, estimateBridge, getBridgeTx, getDebridgeTxHashForOrder } from '@/api/services';

import SelectAmount from '@/components/ui/SelectAmount';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectNetwork from '@/components/ui/SelectNetwork';

import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import EstimateInfo from '@/components/ui/EstimateInfo.vue';

import { prettyNumber } from '@/helpers/prettyNumber';

import { getServices, SERVICE_TYPE } from '@/config/services';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { isCorrectChain } from '@/shared/utils/operations';

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

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        const { walletAccount, walletAddress, currentChainInfo, chainList, validateAddress, setChain } = useAdapter();

        // * Transaction Manager
        const { currentRequestID, transactionForSign, createTransactions, signAndSend, addTransactionToRequestID } = useTransactions();

        // Loaders
        const isEstimating = ref(false);
        const isLoading = ref(false);

        const clearAddress = ref(false);
        const isNeedApprove = ref(false);
        const balanceUpdated = ref(false);
        const isSendToAnotherAddress = ref(false);

        // Errors
        const txError = ref('');
        const txErrorTitle = ref('Transaction error');

        const estimateErrorTitle = ref('');

        const resetAmount = ref(false);

        const feeInfo = ref({
            title: '',
            symbolBetween: '',
            fromAmount: '',
            fromSymbol: '',
            toAmount: '',
            toSymbol: '',
        });

        const estimateTimeInfo = ref({
            title: '',
            symbolBetween: '',
            fromAmount: '',
            fromSymbol: '',
            toAmount: '',
            toSymbol: '',
        });

        // Bridge Data
        const opTitle = ref('tokenOperations.confirm');

        const services = getServices(SERVICE_TYPE.BRIDGE);

        // =================================================================================================================

        const allowanceForToken = computed(() =>
            store.getters['tokenOps/allowanceForToken'](
                walletAccount.value,
                selectedSrcNetwork.value?.net,
                selectedSrcToken.value?.address,
                selectedService.value?.id
            )
        );

        const approveForToken = computed(() =>
            store.getters['tokenOps/approveForToken'](
                walletAccount.value,
                selectedSrcNetwork.value?.net,
                selectedSrcToken.value?.address,
                selectedService.value?.id
            )
        );

        // =================================================================================================================

        const selectedService = computed({
            get: () => store.getters['bridge/service'],
            set: (value) => store.dispatch('bridge/setService', value),
        });

        // =================================================================================================================

        const selectType = computed({
            get: () => store.getters['tokenOps/selectType'],
            set: (value) => store.dispatch('tokenOps/setSelectType', value),
        });

        // =================================================================================================================

        const selectedSrcToken = computed({
            get: () => store.getters['tokenOps/srcToken'],
            set: (value) => store.dispatch('tokenOps/setSrcToken', value),
        });

        const selectedDstToken = computed({
            get: () => store.getters['tokenOps/dstToken'],
            set: (value) => store.dispatch('tokenOps/setDstToken', value),
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

        const receiverAddress = computed({
            get: () => store.getters['tokenOps/receiverAddress'],
            set: (value) => store.dispatch('tokenOps/setReceiverAddress', value),
        });

        // =================================================================================================================

        const amount = ref('');
        const receiveValue = ref('');
        const estimateTime = ref('');

        // =================================================================================================================

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);
        const isTokensLoadingForSrc = computed(() => store.getters['tokens/loadingByChain'](selectedSrcNetwork.value?.net));
        const isTokensLoadingForDst = computed(() => store.getters['tokens/loadingByChain'](selectedDstNetwork.value?.net));

        // =================================================================================================================

        const serviceFee = computed(() => {
            const { protocolFee = null } = selectedService.value || {};

            if (!protocolFee) {
                return;
            }

            const { chain_id } = selectedSrcNetwork.value || {};

            const fee = protocolFee[chain_id];

            if (!chain_id || !fee) {
                return;
            }

            return fee;
        });

        const protocolFeeMain = computed(() => {
            const { protocolFee = null } = selectedService.value || {};

            if (!protocolFee) {
                return;
            }

            const { chain_id, native_token = null } = selectedSrcNetwork.value || {};

            const fee = protocolFee[chain_id] || 0;

            if (!chain_id || !fee) {
                return;
            }

            if (!native_token) {
                return;
            }

            const { symbol = null, price = 0 } = native_token || 0;

            const feeInUSD = prettyNumber(BigNumber(fee).multipliedBy(price).toString());

            return {
                title: 'tokenOperations.protocolFee',
                symbolBetween: '~',
                fromAmount: fee,
                fromSymbol: symbol,
                toAmount: feeInUSD,
                toSymbol: '$',
            };
        });

        // =================================================================================================================

        const errorAddress = ref('');
        const isBalanceError = ref(false);

        // =================================================================================================================

        const { getTokensList } = useTokensList();

        const tokensList = ref([]);

        // =================================================================================================================

        const setTokenOnChange = () => {
            tokensList.value = getTokensList({
                srcNet: selectedSrcToken.value,
            });

            const [defaultToken = null] = tokensList.value;

            if (!selectedSrcToken.value && defaultToken) {
                selectedSrcToken.value = defaultToken;
            }

            const { symbol: targetSymbol } = selectedSrcToken.value || {};

            const searchTokens = [targetSymbol];

            const updatedList = tokensList.value?.filter((tkn) => searchTokens.includes(tkn.symbol)) || [];

            if (!updatedList.length) {
                return;
            }

            const [token = null] = updatedList;

            if (token) {
                return (selectedSrcToken.value = token);
            }
        };

        // =================================================================================================================

        onMounted(async () => {
            onlyWithBalance.value = true;

            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
            }

            setTokenOnChange();

            if (!allowanceForToken.value) {
                await makeAllowanceRequest();
            }
        });

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
                !+amount.value ||
                !receiveValue.value ||
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstNetwork.value ||
                !selectedDstToken.value
        );

        // =================================================================================================================

        const clearApprove = () => {
            isNeedApprove.value = false;
            return store.dispatch('tokenOps/setApprove', {
                chain: selectedSrcNetwork.value.net,
                account: walletAccount.value,
                tokenAddress: selectedSrcToken.value?.address,
                approve: null,
                service: selectedService.value?.id,
            });
        };

        const resetValues = () => {
            resetAmount.value = true;
            estimateErrorTitle.value = '';
            receiveValue.value = '';
            estimateBridge.value = '';
            resetAmount.value = false;
            clearApprove();
            onSetAmount('');
        };

        // =================================================================================================================

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

            isEstimating.value = false;

            resetAmount.value = true;

            estimateErrorTitle.value = '';

            return (opTitle.value = 'tokenOperations.swap');
        };

        // =================================================================================================================

        const onSetSrcToken = () => {
            onlyWithBalance.value = true;
            targetDirection.value = DIRECTIONS.SOURCE;
            selectType.value = TOKEN_SELECT_TYPES.FROM;

            router.push('/bridge/select-token');

            balanceUpdated.value = false;

            return clearApprove();
        };

        const onSetDstToken = () => {
            targetDirection.value = DIRECTIONS.DESTINATION;
            selectType.value = TOKEN_SELECT_TYPES.TO;
            onlyWithBalance.value = false;

            router.push('/bridge/select-token');

            return (balanceUpdated.value = false);
        };

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
            amount.value = value;
            txError.value = '';
            errorAddress.value = '';
            receiveValue.value = '';

            if (!+value) {
                return (isBalanceError.value = BigNumber(amount.value).gt(selectedSrcToken.value?.balance));
            }

            const isNotEnoughBalance = BigNumber(amount.value).gt(selectedSrcToken.value?.balance);

            isBalanceError.value = isNotEnoughBalance;

            if (!allowanceForToken.value) {
                await makeAllowanceRequest();
            }

            if (selectedSrcToken.value && selectedSrcToken.value.address) {
                await isEnoughAllowance();
            }

            const isEnoughForFee = BigNumber(selectedSrcToken.value?.balance).gt(feeInfo.value.fromAmount);

            if (!isNotEnoughBalance || isEnoughForFee) {
                return await makeEstimateBridgeRequest();
            }

            return (isBalanceError.value = isNotEnoughBalance || !isEnoughForFee);
        };

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

        const isEnoughAllowance = async () => {
            if (!isAllowForRequest()) {
                return (isNeedApprove.value = false);
            }

            if (isBalanceError.value) {
                return (isNeedApprove.value = false);
            }

            const currentAmount = utils.parseUnits(amount.value, selectedSrcToken.value?.decimals).toString();

            const isEnough = BigNumber(currentAmount).lte(allowanceForToken.value);

            if (isEnough) {
                opTitle.value = 'tokenOperations.confirm';
                return (isNeedApprove.value = false);
            }

            opTitle.value = 'tokenOperations.approve';
            isNeedApprove.value = true;

            if (!isEnough && !isBalanceError.value) {
                return await makeApproveRequest();
            }

            return (isLoading.value = false);
        };

        // =================================================================================================================

        const makeAllowanceRequest = async () => {
            isNeedApprove.value = false;

            if (!isAllowForRequest() || !selectedSrcToken.value?.address) {
                return;
            }

            if (!selectedSrcToken.value && !selectedSrcToken.value.address) {
                return;
            }

            const response = await getAllowance({
                url: selectedService.value.url,
                net: selectedSrcNetwork.value.net,
                tokenAddress: selectedSrcToken.value.address,
                ownerAddress: walletAddress.value,
            });

            if (response.error) {
                return;
            }

            return store.dispatch('tokenOps/setAllowance', {
                chain: selectedSrcNetwork.value.net,
                account: walletAccount.value,
                tokenAddress: selectedSrcToken.value.address,
                allowance: response.allowance,
                service: selectedService.value?.id,
            });
        };

        // =================================================================================================================

        const makeApproveRequest = async () => {
            if (!isAllowForRequest() || !selectedSrcToken.value?.address) {
                return;
            }

            const response = await getApproveTx({
                url: selectedService.value.url,
                net: selectedSrcNetwork.value.net,
                tokenAddress: selectedSrcToken.value.address,
                ownerAddress: walletAddress.value,
            });

            opTitle.value = 'tokenOperations.approve';

            if (response.error) {
                txError.value = response.error;
                return (isLoading.value = false);
            }

            isLoading.value = false;
            isNeedApprove.value = true;

            return store.dispatch('tokenOps/setApprove', {
                chain: selectedSrcNetwork.value.net,
                account: walletAccount.value,
                tokenAddress: selectedSrcToken.value.address,
                approve: response,
                service: selectedService.value?.id,
            });
        };
        // =================================================================================================================

        const makeEstimateBridgeRequest = async () => {
            if (!isAllowForRequest() || !selectedDstNetwork.value || !+amount.value === 0) {
                isEstimating.value = false;
                return (isLoading.value = false);
            }

            isEstimating.value = true;

            const response = await estimateBridge({
                url: selectedService.value.url,
                fromNet: selectedSrcNetwork.value.net,
                toNet: selectedDstNetwork.value.net,
                fromTokenAddress: selectedSrcToken.value.address,
                toTokenAddress: selectedDstToken.value.address,
                amount: amount.value,
                ownerAddress: walletAddress.value,
            });

            if (response.error) {
                isEstimating.value = false;
                estimateErrorTitle.value = response.error;
                return (isEstimating.value = false);
            }

            estimateErrorTitle.value = '';

            isEstimating.value = false;
            isLoading.value = false;

            // TODO: add fee
            receiveValue.value = response.toTokenAmount;

            feeInfo.value = {
                title: 'tokenOperations.serviceFee',
                symbolBetween: '~',
                fromAmount: prettyNumber(response.fee.amount),
                fromSymbol: response.fee.currency,
                toAmount: prettyNumber(BigNumber(response.fee.amount).multipliedBy(selectedSrcToken.value?.price).toString()),
                toSymbol: '$',
            };

            const { estimatedTime = {} } = selectedService.value || {};

            const { chainId, chain_id } = selectedSrcNetwork.value || {};

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
        };

        // =================================================================================================================
        const makeBridgeTx = async () => {
            showNotification({
                key: 'prepare-tx',
                type: 'info',
                title: `Bridge ${amount.value} ${selectedSrcToken.value.symbol} to ~${receiveValue.value} ${selectedDstToken.value.symbol}`,
                description: 'Please wait, transaction is preparing',
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const response = await getBridgeTx({
                    url: selectedService.value.url,
                    fromNet: selectedSrcNetwork.value.net,
                    fromTokenAddress: selectedSrcToken.value.address,
                    amount: amount.value,
                    toNet: selectedDstNetwork.value.net,
                    toTokenAddress: selectedDstToken.value.address,
                    recipientAddress: receiverAddress.value || walletAddress.value,
                    fallbackAddress: walletAddress.value,
                    ownerAddress: walletAddress.value,
                });

                if (response.error) {
                    txError.value = response.error;
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

            await makeApproveRequest();

            if (!approveForToken.value) {
                return (isLoading.value = false);
            }

            txError.value = '';
            txErrorTitle.value = '';

            const targetKey = `${walletAccount.value}:${selectedSrcNetwork.value.net}:${selectedService.value?.id}:${selectedSrcToken.value?.address}`;

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
                        action: 'tokenOps/clearApproveForToken',
                        targetKey,
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
                account: walletAccount.value,
                chainId: `${selectedSrcNetwork.value?.chain_id}`,
                metaData: {
                    action: 'formatTransactionForSign',
                    type: 'BRIDGE',
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
            if (!network) {
                return;
            }

            const { net = null } = network || {};

            if (!net) {
                return;
            }

            store.dispatch('tokens/updateTokenBalances', {
                net: net,
                address: walletAddress.value,
                info: network,
                update(wallet) {
                    store.dispatch(`tokenOps/set${targetDirection}`, wallet);
                },
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

            try {
                isLoading.value = true;

                const responseSendTx = await signAndSend(transactionForSign.value);

                closeNotification('prepare-tx');

                clearApprove();

                if (responseSendTx.error) {
                    resetAmount.value = false;
                    txError.value = responseSendTx.error;
                    txErrorTitle.value = 'Sign transaction error';
                    return (isLoading.value = false);
                }

                if (selectedService.value.id === 'bridge-debridge') {
                    const hash = await getDebridgeTxHashForOrder(responseSendTx.transactionHash);

                    if (hash) {
                        // successHash.value = getTxExplorerLink(hash.dstHash, selectedDstNetwork.value);
                    }
                }

                resetValues();

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

        watch(isAllTokensLoading, () => setTokenOnChange());

        watch(walletAccount, () => {
            selectedSrcNetwork.value = currentChainInfo.value;

            selectedSrcToken.value = null;
            selectedDstToken.value = null;

            setTokenOnChange();
        });

        watch(isTokensLoadingForSrc, () => setTokenOnChange());

        watch(selectedSrcNetwork, (newValue, oldValue) => {
            if (newValue?.net !== oldValue?.net) {
                selectedSrcToken.value = null;
                setTokenOnChange();
            }
        });

        watch(selectedSrcToken, async () => {
            if (!selectedSrcToken.value) {
                return;
            }

            if (!allowanceForToken.value) {
                await makeAllowanceRequest();
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
            return onSetAddress('');
        });

        // =================================================================================================================

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/bridge/select-token') {
                targetDirection.value = DIRECTIONS.SOURCE;
                selectedSrcNetwork.value = null;
                selectedSrcToken.value = null;
                selectedDstNetwork.value = null;
                selectedDstToken.value = null;
                receiverAddress.value = '';
            }
        });

        return {
            // Loading
            isLoading,
            isEstimating,
            isAllTokensLoading,
            isTokensLoadingForSrc,
            isTokensLoadingForDst,

            disabledBtn,
            isNeedApprove,
            resetAmount,
            isSendToAnotherAddress,
            receiveValue,

            chainList,

            DIRECTIONS,
            opTitle,

            srcNets,
            dstNets,

            services,

            errorAddress,
            isBalanceError,

            receiverAddress,
            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,
            amount,

            // Information for accordion
            protocolFeeMain,
            feeInfo,
            estimateTimeInfo,
            estimateTime,
            serviceFee,
            txError,
            estimateErrorTitle,
            clearAddress,

            prettyNumber,
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
    width: 660px;

    .mt-10 {
        margin-top: 10px;
    }

    .select-group {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .select {
            width: 48%;

            .name {
                font-size: var(--#{$prefix}h6-fs);
                line-height: 26px;
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
        display: flex;
        align-items: center;

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
