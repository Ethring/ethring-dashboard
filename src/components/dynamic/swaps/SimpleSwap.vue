<template>
    <div class="simple-swap">
        <SelectNetwork :items="chains" :current="selectedSrcNetwork" @select="onSelectNetwork" />

        <div class="simple-swap__switch-wrap">
            <SelectAmount
                class="mt-10"
                :value="selectedSrcToken"
                :error="!!isBalanceError"
                :on-reset="resetAmount"
                :is-token-loading="isTokensLoadingForChain"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('tokenOperations.pay')"
                @clickToken="onSetTokenFrom"
                @setAmount="onSetAmount"
            />

            <div class="simple-swap__switch" :class="{ disabled: isUpdateSwapDirectionValue }" @click="swapTokensDirection">
                <SwapIcon />
            </div>

            <SelectAmount
                class="mt-10"
                disabled
                hide-max
                :is-token-loading="isTokensLoadingForChain"
                :is-amount-loading="isEstimating"
                :value="selectedDstToken"
                :on-reset="resetAmount"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('tokenOperations.receive')"
                :disabled-value="receiveValue"
                @clickToken="onSetTokenTo"
            />
        </div>

        <EstimateInfo
            v-if="receiveValue || estimateErrorTitle"
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
            :loading="isLoading"
            class="simple-swap__btn mt-10"
            @click="handleOnSwap"
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

import { getAllowance, getApproveTx, estimateSwap, getSwapTx } from '@/api/services';

// Adapter
import { ECOSYSTEMS } from '@/Adapter/config';
import useAdapter from '@/Adapter/compositions/useAdapter';

// Notification
import useNotification from '@/compositions/useNotification';
import useTokensList from '@/compositions/useTokensList';

// Transaction Management
import useTransactions from '../../../Transactions/compositions/useTransactions';
import { STATUSES } from '../../../Transactions/shared/constants';

// Components
import Button from '@/components/ui/Button';
import SelectNetwork from '@/components/ui/SelectNetwork';

import SelectAmount from '@/components/ui/SelectAmount';

import EstimateInfo from '@/components/ui/EstimateInfo.vue';

import SwapIcon from '@/assets/icons/dashboard/swap.svg';

// Helpers
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

import { isCorrectChain } from '@/shared/utils/operations';

// Constants
import { TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { SUPPORTED_CHAINS } from '@/shared/constants/superswap/constants';

export default {
    name: 'SimpleSwap',

    components: {
        SelectNetwork,
        SelectAmount,
        Button,
        SwapIcon,
        EstimateInfo,
    },

    setup() {
        const store = useStore();
        const router = useRouter();

        const { t } = useI18n();

        const { name: module } = router.currentRoute.value;

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        const { walletAddress, currentChainInfo, chainList, walletAccount, setChain } = useAdapter();

        const chains = computed(() => chainList.value?.filter((chain) => SUPPORTED_CHAINS.includes(chain.net)));

        // * Transaction Manager
        const { currentRequestID, transactionForSign, createTransactions, signAndSend, addTransactionToRequestID } = useTransactions();

        // * Loaders
        const isLoading = ref(false);
        const isEstimating = ref(false);
        const isUpdateSwapDirectionValue = ref(false);

        // * Swap data
        const opTitle = ref('tokenOperations.swap');

        const isNeedApprove = ref(false);
        const balanceUpdated = ref(false);

        // * Errors
        const txError = ref('');
        const txErrorTitle = ref('Transaction error');
        const estimateErrorTitle = ref('');
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

        const resetAmount = ref(false);

        // * Amount data
        const amount = ref('');
        const receiveValue = ref('');

        // =================================================================================================================

        const selectedService = computed({
            get: () => store.getters['swap/service'],
            set: (value) => store.dispatch('swap/setService', value),
        });

        // =================================================================================================================

        // * Main data for swap
        const selectType = computed({
            get: () => store.getters['tokenOps/selectType'],
            set: (value) => store.dispatch('tokenOps/setSelectType', value),
        });

        const onlyWithBalance = computed({
            get: () => store.getters['tokenOps/onlyWithBalance'],
            set: (value) => store.dispatch('tokenOps/setOnlyWithBalance', value),
        });

        const selectedSrcNetwork = computed({
            get: () => store.getters['tokenOps/srcNetwork'],
            set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
        });

        const selectedSrcToken = computed({
            get: () => store.getters['tokenOps/srcToken'],
            set: (value) => store.dispatch('tokenOps/setSrcToken', value),
        });

        const selectedDstToken = computed({
            get: () => store.getters['tokenOps/dstToken'],
            set: (value) => store.dispatch('tokenOps/setDstToken', value),
        });

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

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](selectedSrcNetwork.value?.net));

        // =================================================================================================================

        const { getTokensList } = useTokensList();

        const tokensList = ref([]);

        // =================================================================================================================

        const setTokenOnChange = () => {
            tokensList.value = getTokensList({
                srcNet: selectedSrcNetwork.value,
            });

            const [defaultFromToken = null, defaultToToken = null] = tokensList.value || [];

            if (!selectedSrcToken.value && defaultFromToken) {
                selectedSrcToken.value = defaultFromToken;
            }

            if (!selectedDstToken.value && defaultToToken) {
                selectedDstToken.value = defaultToToken;
            }

            if (!balanceUpdated.value) {
                return;
            }

            if (!selectedSrcToken.value && !selectedDstToken.value) {
                return;
            }

            const { symbol: fromSymbol } = selectedSrcToken.value || {};
            const { symbol: toSymbol } = selectedSrcToken.value || {};

            const searchTokens = [fromSymbol, toSymbol];

            const updatedList = tokensList.value.filter((tkn) => searchTokens.includes(tkn.symbol)) || [];

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

        const disabledSwap = computed(
            () =>
                isLoading.value ||
                isBalanceError.value ||
                !+amount.value ||
                !receiveValue.value ||
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstToken.value
        );

        const clearApprove = () => {
            isNeedApprove.value = false;
            receiveValue.value = '';
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
            resetAmount.value = false;
            clearApprove();
            onSetAmount('');
        };

        // =================================================================================================================

        const onSelectNetwork = (network) => {
            selectedSrcNetwork.value = network;

            if (currentChainInfo.value.net !== selectedSrcNetwork.value.net) {
                return (opTitle.value = 'tokenOperations.switchNetwork');
            }

            return (opTitle.value = 'tokenOperations.swap');
        };

        const onSetTokenFrom = () => {
            selectType.value = TOKEN_SELECT_TYPES.FROM;
            onlyWithBalance.value = true;
            balanceUpdated.value = false;

            router.push('/swap/select-token');

            return clearApprove();
        };

        const onSetTokenTo = async () => {
            selectType.value = TOKEN_SELECT_TYPES.TO;
            onlyWithBalance.value = false;
            balanceUpdated.value = false;

            router.push('/swap/select-token');

            return await onSetAmount(amount.value);
        };

        const onSetAmount = async (value) => {
            amount.value = value;

            txError.value = '';
            receiveValue.value = '';
            isBalanceError.value = false;

            if (!+value) {
                return (isBalanceError.value = BigNumber(amount.value).gt(selectedSrcToken.value?.balance));
            }

            isBalanceError.value = BigNumber(amount.value).gt(selectedSrcToken.value?.balance);

            if (!allowanceForToken.value) {
                await makeAllowanceRequest();
            }

            if (allowanceForToken.value && selectedSrcToken.value && selectedSrcToken.value?.address) {
                await isEnoughAllowance();
            }

            return await makeEstimateSwapRequest();
        };

        const swapTokensDirection = async () => {
            if (isUpdateSwapDirectionValue.value) {
                return;
            }

            amount.value = '';

            clearApprove();

            const from = { ...selectedSrcToken.value };
            const to = { ...selectedDstToken.value };

            isUpdateSwapDirectionValue.value = true;

            selectedSrcToken.value = to;
            selectedDstToken.value = from;

            if (selectedSrcToken.value?.address) {
                await makeAllowanceRequest();
            }

            await makeEstimateSwapRequest();

            setTimeout(() => {
                isUpdateSwapDirectionValue.value = false;
            }, 500);
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
                opTitle.value = 'tokenOperations.swap';
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

            clearApprove();

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
                service: selectedService.value.id,
            });
        };

        // =================================================================================================================

        const makeEstimateSwapRequest = async () => {
            if (!isAllowForRequest() || !selectedDstToken.value || +amount.value === 0) {
                isEstimating.value = false;
                return (isLoading.value = false);
            }

            isEstimating.value = true;

            const response = await estimateSwap({
                url: selectedService.value.url,
                net: selectedSrcNetwork.value.net,
                fromTokenAddress: selectedSrcToken.value?.address,
                toTokenAddress: selectedDstToken.value?.address,
                amount: amount.value,
                ownerAddress: walletAddress.value,
            });

            if (response.error) {
                isEstimating.value = false;
                estimateErrorTitle.value = response.error;

                return (receiveValue.value = '');
            }

            isEstimating.value = false;

            isLoading.value = false;

            receiveValue.value = response.toTokenAmount;

            estimateErrorTitle.value = '';

            // TODO: add fee

            const { native_token } = selectedSrcNetwork.value || {};

            const { price = 0 } = native_token || {};

            feeInfo.value = {
                title: 'tokenOperations.networkFee',
                symbolBetween: '~',
                fromAmount: prettyNumberTooltip(response.fee.amount),
                fromSymbol: response.fee.currency,
                toAmount: prettyNumberTooltip(+response.fee.amount * price, 4),
                toSymbol: '$',
            };

            rateInfo.value = {
                title: 'tokenOperations.rate',
                symbolBetween: '=',
                fromAmount: '1',
                fromSymbol: selectedSrcToken.value.symbol,
                toAmount: prettyNumberTooltip(response.toTokenAmount / response.fromTokenAmount, 6),
                toSymbol: selectedDstToken.value.symbol,
            };
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

        const makeSwapRequest = async () => {
            showNotification({
                key: 'prepare-tx',
                type: 'info',
                title: `Swap ${amount.value} ${selectedSrcToken.value.symbol} to ~${receiveValue.value} ${selectedDstToken.value.symbol}`,
                description: 'Please wait, transaction is preparing',
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const response = await getSwapTx({
                    url: selectedService.value.url,
                    net: selectedSrcNetwork.value.net,
                    fromTokenAddress: selectedSrcToken.value.address,
                    toTokenAddress: selectedDstToken.value.address,
                    amount: amount.value,
                    ownerAddress: walletAddress.value,
                });

                if (response.error && response.error !== '') {
                    txError.value = response.error;
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
            opTitle.value = 'tokenOperations.approve';

            await makeApproveRequest();

            if (!approveForToken.value) {
                return (isLoading.value = false);
            }

            txError.value = '';
            txErrorTitle.value = '';

            const targetKey = `${walletAccount.value}:${selectedSrcNetwork.value.net}${selectedService.value?.id}:${selectedSrcToken.value?.address}`;

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
                account: walletAccount.value,
                chainId: `${selectedSrcNetwork.value?.chain_id}`,
                metaData: {
                    action: 'formatTransactionForSign',
                    type: 'SWAP',
                },
            };

            if (currentRequestID.value && currentRequestID.value !== '') {
                return await addTransactionToRequestID(currentRequestID.value, txToSave);
            }

            txToSave.index = 0;

            return await createTransactions([txToSave]);
        };

        // =================================================================================================================

        const handleUpdateBalance = () => {
            store.dispatch('tokens/updateTokenBalances', {
                net: selectedSrcNetwork.value.net,
                address: walletAddress.value,
                info: selectedSrcNetwork.value,
                update(wallet) {
                    store.dispatch('tokenOps/setSrcNetwork', wallet);
                },
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

                resetValues();
                isLoading.value = false;
                balanceUpdated.value = true;

                handleUpdateBalance();
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        watch(selectedSrcNetwork, (newValue, oldValue) => {
            if (newValue?.net !== oldValue?.net) {
                resetValues();
                selectedSrcToken.value = null;
                selectedDstToken.value = null;
                setTokenOnChange();
            }
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

            closeNotification('prepare-tx');

            isLoading.value = false;
        });

        watch(isTokensLoadingForChain, () => setTokenOnChange());

        watch(selectedSrcToken, async () => {
            if (!allowanceForToken.value) {
                await makeAllowanceRequest();
            }
        });

        watch(walletAccount, () => {
            selectedSrcNetwork.value = currentChainInfo.value;
            selectedSrcToken.value = null;
            selectedDstToken.value = null;

            setTokenOnChange();
        });

        // =================================================================================================================

        onMounted(async () => {
            selectType.value = TOKEN_SELECT_TYPES.FROM;
            store.dispatch('txManager/setCurrentRequestID', null);

            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
            }

            setTokenOnChange();

            if (!allowanceForToken.value) {
                await makeAllowanceRequest();
            }
        });

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/swap/select-token') {
                selectedSrcToken.value = null;
                selectedDstToken.value = null;
                selectedSrcNetwork.value = null;
            }
        });

        return {
            isLoading,
            isEstimating,
            isNeedApprove,
            isTokensLoadingForChain,

            opTitle,

            disabledSwap,
            walletAddress,

            chains,

            isBalanceError,
            estimateErrorTitle,
            selectedSrcNetwork,

            resetAmount,
            isUpdateSwapDirectionValue,
            currentChainInfo,

            selectedSrcToken,
            selectedDstToken,
            receiveValue,

            feeInfo,
            rateInfo,

            selectedService,

            onSelectNetwork,
            onSetTokenFrom,
            onSetTokenTo,
            onSetAmount,
            swapTokensDirection,
            handleOnSwap,
        };
    },
};
</script>
<style lang="scss">
.simple-swap {
    width: 660px;

    &__switch-wrap {
        position: relative;
    }

    &__switch {
        cursor: pointer;
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 48px;
        height: 48px;
        z-index: 10;
        border-radius: 50%;
        left: calc(50% - 24px);
        bottom: 138px;
        background: var(--#{$prefix}select-bg-color);
        border: 4px solid var(--#{$prefix}white);
        @include animateEasy;

        svg {
            @include animateEasy;
        }

        &:not(.disabled):hover {
            background: var(--#{$prefix}icon-logo-bg-hover);

            svg {
                fill: var(--#{$prefix}primary);
            }
        }

        svg {
            fill: $colorPl;
        }

        &.disabled {
            pointer-events: none;
            opacity: 0.5;
        }
    }

    .mt-10 {
        margin-top: 10px;
    }

    &__btn {
        height: 64px;
        width: 100%;
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
        img {
            width: 16px;
            height: 16px;
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
        .fee {
            color: var(--#{$prefix}sub-text);
            margin-right: 4px;
        }

        .fee-symbol {
            color: $colorPl;
            font-weight: 400;
        }
    }
}
</style>
