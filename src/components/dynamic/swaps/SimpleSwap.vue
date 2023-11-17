<template>
    <div class="simple-swap">
        <SelectNetwork :items="chains" :current="selectedSrcNetwork" @select="onSelectNetwork" />

        <div class="simple-swap__switch-wrap">
            <SelectAmount
                class="mt-10"
                :value="selectedSrcToken"
                :error="!!isBalanceError"
                :on-reset="resetSrcAmount"
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
                :on-reset="resetDstAmount"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('tokenOperations.receive')"
                :disabled-value="dstAmount"
                @clickToken="onSetTokenTo"
            />
        </div>

        <EstimateInfo
            v-if="estimateErrorTitle || srcAmount"
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

import { SettingOutlined } from '@ant-design/icons-vue';

import { estimateSwap, estimateBridge, getBridgeTx, getSwapTx } from '@/api/services';

import { getServices, SERVICE_TYPE } from '@/config/services';

// Adapter
import { ECOSYSTEMS } from '@/Adapter/config';
import useAdapter from '@/Adapter/compositions/useAdapter';

// Notification
import useNotification from '@/compositions/useNotification';
import useServices from '../../../compositions/useServices';

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

import { updateWalletBalances } from '@/shared/utils/balances';
import { checkErrors } from '@/helpers/checkErrors';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { SUPPORTED_CHAINS } from '@/shared/constants/super-swap/constants';

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

        const services = getServices(SERVICE_TYPE.SWAP);

        if (currentChainInfo.value.ecosystem === ECOSYSTEMS.COSMOS) {
            selectedService.value = services.find((service) => service.id === 'swap-skip');
        }

        const addressesByChains = ref({});

        // * Module values
        const {
            selectType,
            targetDirection,

            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,

            onlyWithBalance,

            srcAmount,
            dstAmount,

            txError,
            txErrorTitle,

            opTitle,

            clearApproveForService,

            setTokenOnChange,
            makeAllowanceRequest,
            makeApproveRequest,
            checkSelectedNetwork,

            onSelectSrcNetwork,
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
        const isUpdateSwapDirectionValue = ref(false);

        const balanceUpdated = ref(false);

        // * Errors
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

        const onSelectNetwork = (network) => {
            if (!onSelectSrcNetwork(network)) {
                return;
            }

            isEstimating.value = false;
            estimateErrorTitle.value = '';
            resetSrcAmount.value = true;
            resetDstAmount.value = true;
        };

        const onSetTokenFrom = () => {
            onlyWithBalance.value = true;
            selectType.value = TOKEN_SELECT_TYPES.FROM;
            targetDirection.value = DIRECTIONS.SOURCE;

            router.push('/swap/select-token');

            srcAmount.value = 0;

            return clearApproveForService();
        };

        const onSetTokenTo = async () => {
            onlyWithBalance.value = false;
            selectType.value = TOKEN_SELECT_TYPES.TO;
            // for SWAP targetDirection also SOURCE;
            targetDirection.value = DIRECTIONS.SOURCE;

            router.push('/swap/select-token');

            await onSetAmount(srcAmount.value);
        };

        const onSetAmount = async (value) => {
            srcAmount.value = value;

            txError.value = '';
            dstAmount.value = '';
            isBalanceError.value = false;

            if (!+value) {
                return (isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance));
            }

            isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance);

            if (!allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                await requestAllowance();
            }

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

            const currentAmount = utils.parseUnits(srcAmount.value, selectedSrcToken.value?.decimals).toString();

            const isEnough = BigNumber(currentAmount).lte(allowanceForToken.value);

            return !isEnough;
        });

        // =================================================================================================================

        const swapTokensDirection = async () => {
            if (isUpdateSwapDirectionValue.value) {
                return;
            }

            srcAmount.value = '';

            clearApproveForService();

            const from = { ...selectedSrcToken.value };
            const to = { ...selectedDstToken.value };

            isUpdateSwapDirectionValue.value = true;

            selectedSrcToken.value = to;
            selectedDstToken.value = from;

            if (selectedSrcToken.value?.address && !allowanceForToken.value) {
                await requestAllowance();
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

            if (response.error) {
                isEstimating.value = false;
                return (estimateErrorTitle.value = response.error);
            }

            isEstimating.value = false;
            isLoading.value = false;

            dstAmount.value = response.toTokenAmount;
            dstAmount.value = response.toTokenAmount;

            estimateErrorTitle.value = '';

            // TODO: add fee

            const { native_token } = selectedSrcNetwork.value || {};

            const { price = 0 } = native_token || {};

            if (response.fee) {
                feeInfo.value = {
                    title: 'tokenOperations.networkFee',
                    symbolBetween: '~',
                    fromAmount: prettyNumberTooltip(response.fee.amount),
                    fromSymbol: response.fee.currency,
                    toAmount: prettyNumberTooltip(+response.fee.amount * price, 4),
                    toSymbol: '$',
                };
            }

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

                console.log('response', response);

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

                    txError.value = checkErrors(responseSendTx.error);

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
            selectedSrcToken.value = null;
            selectedDstToken.value = null;
            setTokenOnChange();
        });

        watch(isWaitingTxStatusForModule, async () => {
            if (!isWaitingTxStatusForModule.value) {
                await handleUpdateBalance();
            }
        });

        watch(srcAmount, () => {
            resetSrcAmount.value = srcAmount.value === null;
        });

        watch(dstAmount, () => {
            resetDstAmount.value = dstAmount.value === null;
        });

        watch(selectedSrcToken, () => {
            if (!selectedSrcToken.value) {
                return;
            }

            if (!allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                requestAllowance();
            }
        });

        watch(walletAccount, () => {
            selectedSrcNetwork.value = currentChainInfo.value;
            selectedSrcToken.value = null;
            selectedDstToken.value = null;

            setTokenOnChange();
        });

        watch(isNeedApprove, () => {
            if (isNeedApprove.value && opTitle.value !== 'tokenOperations.switchNetwork') {
                return (opTitle.value = 'tokenOperations.approve');
            }

            checkSelectedNetwork();
        });

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
            selectType.value = TOKEN_SELECT_TYPES.FROM;
            store.dispatch('txManager/setCurrentRequestID', null);

            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
                setTokenOnChange();
            }

            onlyWithBalance.value = true;

            if (selectedSrcToken.value?.address && !allowanceForToken.value && ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem) {
                await requestAllowance();
            }

            isAllowForRequest();

            setOwnerAddresses();
        });

        watch(selectedService, () => setOwnerAddresses());

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/swap/select-token') {
                targetDirection.value = DIRECTIONS.SOURCE;
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

            isUpdateSwapDirectionValue,
            currentChainInfo,

            selectedSrcToken,
            selectedDstToken,

            srcAmount,
            dstAmount,

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
        @include pageFlexRow;
        justify-content: center;

        @include animateEasy;

        cursor: pointer;
        position: absolute;
        z-index: 10;

        width: 48px;
        height: 48px;

        border-radius: 50%;
        left: calc(50% - 24px);
        bottom: 138px;

        background: var(--#{$prefix}select-bg-color);
        border: 4px solid var(--#{$prefix}white);

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
