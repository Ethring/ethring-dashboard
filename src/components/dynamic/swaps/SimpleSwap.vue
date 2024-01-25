<template>
    <a-form>
        <a-form-item>
            <SelectNetwork :current="selectedSrcNetwork" :placeholder="$t('tokenOperations.selectNetwork')" @click="onSelectNetwork" />
        </a-form-item>
        <div class="switch-direction-wrap">
            <SelectAmountInput
                :value="selectedSrcToken"
                :selected-network="selectedSrcNetwork"
                :error="!!isBalanceError"
                :on-reset="resetSrcAmount"
                :is-token-loading="isTokensLoadingForChain"
                :is-update="isUpdateSwapDirection"
                :label="$t('tokenOperations.pay')"
                :amount-value="srcAmount"
                @clickToken="onSelectToken(true)"
                @setAmount="onSetAmount"
            />

            <SwitchDirection
                class="swap-module"
                :disabled="!selectedDstToken || isUpdateSwapDirection"
                :on-click-switch="swapTokensDirection"
            />

            <SelectAmountInput
                disabled
                hide-max
                :is-token-loading="isTokensLoadingForChain"
                :is-amount-loading="isEstimating"
                :value="selectedDstToken"
                :on-reset="resetDstAmount"
                :is-update="isUpdateSwapDirection"
                :label="$t('tokenOperations.receive')"
                :disabled-value="dstAmount"
                :amount-value="dstAmount"
                @clickToken="onSelectToken(false)"
            />
        </div>

        <EstimateInfo
            v-if="(selectedDstToken && srcAmount) || estimateErrorTitle"
            :loading="isEstimating"
            :service="selectedService"
            :title="$t('tokenOperations.routeInfo')"
            :main-fee="rateInfo"
            :fees="[feeInfo]"
            :error="estimateErrorTitle"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledSwap"
            :loading="isWaitingTxStatusForModule || isLoading"
            :tip="$t(opTitle)"
            class="module-layout-view-btn"
            @click="handleOnSwap"
            size="large"
        />
    </a-form>
</template>
<script>
import { h, ref, watch, inject, computed, onMounted } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

import { SettingOutlined } from '@ant-design/icons-vue';

import { estimateSwap, estimateBridge, getBridgeTx, getSwapTx } from '@/api/services';

// Adapter
import { ECOSYSTEMS } from '@/Adapter/config';

// Notification
import useNotification from '@/compositions/useNotification';
import useServices from '../../../compositions/useServices';

// Transaction Management
import useTransactions from '../../../Transactions/compositions/useTransactions';
import { STATUSES } from '../../../Transactions/shared/constants';

// Components
import Button from '@/components/ui/Button';

import SelectNetwork from '@/components/ui/Select/SelectNetwork';
import SelectAmountInput from '@/components/ui/Select/SelectAmountInput';

import EstimateInfo from '@/components/ui/EstimateInfo.vue';

import SwitchDirection from '@/components/ui/SwitchDirection.vue';

// Helpers
import { formatNumber } from '@/helpers/prettyNumber';

import { isCorrectChain } from '@/shared/utils/operations';

import { updateWalletBalances } from '@/shared/utils/balances';
import { checkErrors } from '@/helpers/checkErrors';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { SUPPORTED_CHAINS } from '@/shared/constants/super-swap/constants';

export default {
    name: 'SimpleSwap',

    components: {
        SelectNetwork,
        SelectAmountInput,
        Button,
        EstimateInfo,
        SwitchDirection,
    },

    setup() {
        const store = useStore();
        const router = useRouter();

        const useAdapter = inject('useAdapter');

        const { name: module } = router.currentRoute.value;

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        const { walletAddress, currentChainInfo, chainList, walletAccount, setChain, getAddressesWithChainsByEcosystem } = useAdapter();

        const chains = computed(() => {
            if (currentChainInfo.value.ecosystem === ECOSYSTEMS.COSMOS) {
                return chainList.value;
            }

            return chainList.value?.filter((chain) => SUPPORTED_CHAINS.includes(chain.net));
        });

        const selectedService = computed({
            get: () => store.getters[`swap/service`],
            set: (value) => store.dispatch(`swap/setService`, value),
        });

        const addressesByChains = ref({});

        // * Module values
        const {
            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,

            onlyWithBalance,

            srcAmount,
            dstAmount,

            txError,
            txErrorTitle,
            estimateErrorTitle,

            opTitle,

            clearApproveForService,

            resetTokensForModules,
            makeAllowanceRequest,
            makeApproveRequest,
            checkSelectedNetwork,

            // onSelectSrcNetwork,

            handleOnSelectToken,
            handleOnSelectNetwork,
        } = useServices({
            module,
            moduleType: 'swap',
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

        // * Transaction Manager
        const { currentRequestID, transactionForSign, createTransactions, signAndSend, addTransactionToRequestID } = useTransactions();

        const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](module));

        // * Loaders
        const isLoading = ref(false);
        const isEstimating = ref(false);
        const isUpdateSwapDirection = ref(false);

        const balanceUpdated = ref(false);

        // * Errors
        const isBalanceError = ref(false);

        // * Estimate data
        const rateInfo = ref({
            title: '',
            symbolBetween: '',
            fromAmount: '',
            fromSymbol: '',
            toAmount: '',
            toSymbol: '',
        });

        const feeInfo = ref({
            title: '',
            symbolBetween: '',
            fromAmount: '',
            fromSymbol: '',
            toAmount: '',
            toSymbol: '',
        });

        // =================================================================================================================

        const resetSrcAmount = ref(false);
        const resetDstAmount = ref(false);

        // =================================================================================================================

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](selectedSrcNetwork.value?.net));

        // =================================================================================================================

        const disabledSwap = computed(
            () =>
                isLoading.value ||
                isBalanceError.value ||
                isWaitingTxStatusForModule.value ||
                !+srcAmount.value ||
                !dstAmount.value ||
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstToken.value
        );

        // =================================================================================================================

        const onSelectNetwork = () => {
            handleOnSelectNetwork({
                direction: DIRECTIONS.SOURCE,
            });
        };

        // isEstimating.value = false;
        // estimateErrorTitle.value = '';
        // resetSrcAmount.value = true;
        // resetDstAmount.value = true;

        // setTimeout(() => {
        //     resetSrcAmount.value = false;
        //     resetDstAmount.value = false;
        // });

        const onSelectToken = (withBalance = true) => {
            onlyWithBalance.value = withBalance;

            handleOnSelectToken({
                direction: DIRECTIONS.SOURCE,
                type: withBalance ? TOKEN_SELECT_TYPES.FROM : TOKEN_SELECT_TYPES.TO,
            });

            withBalance && clearApproveForService();
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
        };

        const onSetAmount = async (value) => {
            srcAmount.value = value;

            txError.value = '';
            dstAmount.value = '';
            isBalanceError.value = false;
            isUpdateSwapDirection.value = true;

            if (!+value) {
                isUpdateSwapDirection.value = false;
                return (isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance));
            }

            isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance);

            if (!allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                await requestAllowance();
            }

            feeInfo.value = {
                title: '',
                symbolBetween: '',
                fromAmount: '',
                fromSymbol: '',
                toAmount: '',
                toSymbol: '',
            };

            rateInfo.value = {
                title: '',
                symbolBetween: '',
                fromAmount: '',
                fromSymbol: '',
                toAmount: '',
                toSymbol: '',
            };

            return await makeEstimateSwapRequest();
        };

        // =================================================================================================================

        const isNeedApprove = computed(() => {
            if (!srcAmount.value) {
                return false;
            }

            if (!selectedSrcToken.value?.address && !allowanceForToken.value) {
                return false;
            }

            if (selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.COSMOS) {
                return false;
            }

            if (!selectedSrcToken.value?.decimals) {
                return false;
            }

            try {
                const currentAmount = utils.parseUnits(srcAmount.value, selectedSrcToken.value?.decimals).toString();

                const isEnough = BigNumber(currentAmount).lte(allowanceForToken.value);

                return !isEnough;
            } catch {
                return false;
            }
        });

        // =================================================================================================================

        const swapTokensDirection = async () => {
            if (isUpdateSwapDirection.value || !selectedDstToken.value) {
                return;
            }

            clearApproveForService();

            const from = { ...selectedSrcToken.value };
            const to = { ...selectedDstToken.value };

            selectedSrcToken.value = to;
            selectedDstToken.value = from;

            await onSetAmount(dstAmount.value);
        };

        // =================================================================================================================

        const isAllowForRequest = () => {
            const notAllData = !walletAddress.value || !selectedSrcNetwork.value || !selectedService.value;

            if (notAllData) {
                return false;
            }

            if (estimateErrorTitle.value) {
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

        const makeEstimateSwapRequest = async () => {
            if (!isAllowForRequest() || !selectedDstToken.value || +srcAmount.value === 0) {
                isEstimating.value = false;
                isUpdateSwapDirection.value = false;
                return (isLoading.value = false);
            }

            isEstimating.value = true;

            const params = {
                url: selectedService.value.url,
                net: selectedSrcNetwork.value.net,
                fromTokenAddress: selectedSrcToken.value?.address,
                toTokenAddress: selectedDstToken.value?.address,
                amount: srcAmount.value,
                ownerAddress: walletAddress.value,
            };

            let response = null;

            if (selectedService.value.id === 'swap-skip') {
                params.fromNet = selectedSrcNetwork.value.net;
                params.toNet = selectedSrcNetwork.value.net;

                response = await estimateBridge(params);
            } else {
                response = await estimateSwap(params);
            }

            isUpdateSwapDirection.value = false;

            if (response.error) {
                isEstimating.value = false;
                isLoading.value = false;
                return (estimateErrorTitle.value = response.error);
            }

            const checkRoute = +response?.fromTokenAmount === +srcAmount.value;

            if (!checkRoute) {
                return;
            }

            isEstimating.value = false;
            isLoading.value = false;

            dstAmount.value = BigNumber(response.toTokenAmount).decimalPlaces(6).toString();

            estimateErrorTitle.value = '';

            // TODO: add fee

            const { native_token } = selectedSrcNetwork.value || {};

            const { price = 0 } = native_token || {};

            if (response.fee) {
                feeInfo.value = {
                    title: 'tokenOperations.networkFee',
                    symbolBetween: '~',
                    fromAmount: response.fee.amount,
                    fromSymbol: response.fee.currency,
                    toAmount: formatNumber(+response.fee.amount * price, 4),
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
        };

        // =================================================================================================================

        const makeSwapRequest = async () => {
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
                const params = {
                    url: selectedService.value.url,
                    net: selectedSrcNetwork.value.net,
                    fromTokenAddress: selectedSrcToken.value.address,
                    toTokenAddress: selectedDstToken.value.address,
                    amount: srcAmount.value,
                    ownerAddress: walletAddress.value,
                };

                let response = null;

                if (selectedService.value.id === 'swap-skip') {
                    params.ownerAddresses = JSON.stringify(addressesByChains.value);

                    params.fromNet = selectedSrcNetwork.value.net;
                    params.toNet = selectedSrcNetwork.value.net;

                    response = await getBridgeTx(params);
                } else {
                    response = await getSwapTx(params);
                }

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

        const handleApprove = async () => {
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

        const handleSwap = async () => {
            opTitle.value = 'tokenOperations.swap';

            const responseSwap = await makeSwapRequest();

            if (!responseSwap) {
                return (isLoading.value = false);
            }

            const txToSave = {
                ecosystem: selectedSrcNetwork.value.ecosystem,
                module,
                status: STATUSES.IN_PROGRESS,
                parameters: responseSwap,
                account: walletAddress.value,
                chainId: `${selectedSrcNetwork.value?.chain_id}`,
                metaData: {
                    action: 'formatTransactionForSign',
                    type: 'SWAP',
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

        const updateTokens = (list) => {
            if (!selectedSrcToken.value && !selectedDstToken.value) {
                return;
            }

            const fromToken = list.find((elem) => elem.symbol === selectedSrcToken.value.symbol);

            if (fromToken) {
                selectedSrcToken.value = fromToken;
            }

            const toToken = list.find((elem) => elem.symbol === selectedDstToken.value.symbol);

            if (toToken) {
                selectedDstToken.value = toToken;
            }
        };

        const handleUpdateBalance = async () => {
            await updateWalletBalances(walletAccount.value, walletAddress.value, selectedSrcNetwork.value, (list) => {
                updateTokens(list);
            });
        };

        // =================================================================================================================

        const handleOnSwap = async () => {
            isLoading.value = true;
            txError.value = '';

            const { isChanged, btnTitle } = await isCorrectChain(selectedSrcNetwork, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                return (isLoading.value = false);
            }

            opTitle.value = 'tokenOperations.swap';

            if (isNeedApprove.value) {
                await handleApprove();
            } else {
                await handleSwap();
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

                    txError.value = checkErrors(responseSendTx.error).error;

                    return (isLoading.value = false);
                }

                isLoading.value = false;
                balanceUpdated.value = true;

                handleUpdateBalance();
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        watch(txError, () => {
            if (!txError.value) {
                return;
            }

            isLoading.value = false;
        });

        watch(isTokensLoadingForChain, () => {
            resetTokensForModules();
        });

        watch(isWaitingTxStatusForModule, async () => {
            if (!isWaitingTxStatusForModule.value) {
                await handleUpdateBalance();
            }
        });

        watch(srcAmount, () => resetAmounts(DIRECTIONS.SOURCE, srcAmount.value));

        watch(dstAmount, () => resetAmounts(DIRECTIONS.DESTINATION, dstAmount.value));

        watch(selectedSrcToken, () => {
            if (!selectedSrcToken.value) {
                return;
            }

            isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance);

            if (!allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                requestAllowance();
            }
        });

        watch(walletAccount, () => {
            selectedSrcNetwork.value = currentChainInfo.value;
            estimateErrorTitle.value = '';
            isEstimating.value = false;
            isLoading.value = false;
            resetTokensForModules();
        });

        watch(isNeedApprove, () => {
            if (isNeedApprove.value && opTitle.value !== 'tokenOperations.switchNetwork') {
                return (opTitle.value = 'tokenOperations.approve');
            }

            checkSelectedNetwork();
        });

        watch(selectedService, () => setOwnerAddresses());

        // =================================================================================================================

        const setOwnerAddresses = () => {
            if (selectedService.value?.id !== 'swap-skip') {
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
            store.dispatch('txManager/setCurrentRequestID', null);

            if (srcAmount.value) {
                dstAmount.value = null;
                await onSetAmount(srcAmount.value);
            }

            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
                resetTokensForModules();
            }

            if (selectedSrcToken.value?.address && !allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                await requestAllowance();
            }

            isAllowForRequest();

            setOwnerAddresses();
        });

        return {
            isLoading,
            isEstimating,
            isNeedApprove,
            isTokensLoadingForChain,
            isWaitingTxStatusForModule,

            opTitle,

            disabledSwap,
            walletAddress,

            chains,

            isBalanceError,
            estimateErrorTitle,
            selectedSrcNetwork,

            resetSrcAmount,
            resetDstAmount,

            isUpdateSwapDirection,
            currentChainInfo,

            selectedSrcToken,
            selectedDstToken,

            srcAmount,
            dstAmount,

            feeInfo,
            rateInfo,

            selectedService,

            onSelectToken,
            onSelectNetwork,

            onSetAmount,

            handleOnSwap,
            swapTokensDirection,
        };
    },
};
</script>
