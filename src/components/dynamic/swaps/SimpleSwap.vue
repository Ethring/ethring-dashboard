<template>
    <div class="simple-swap">
        <SelectNetwork :items="chainList" :current="selectedNetwork" @select="onSelectNetwork" />

        <div class="simple-swap__switch-wrap">
            <SelectAmount
                class="mt-10"
                :value="selectedTokenFrom"
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
                :value="selectedTokenTo"
                :on-reset="resetAmount"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('tokenOperations.receive')"
                :disabled-value="receiveValue"
                @clickToken="onSetTokenTo"
            />
        </div>

        <Accordion v-if="receiveValue || estimateErrorTitle" :loading="isEstimating" class="mt-10" :hide="estimateErrorTitle.length > 0">
            <template #header>
                <div v-if="!estimateErrorTitle" class="accordion__title">
                    <div v-html="setReceiveValue"></div>
                </div>

                <div v-else class="accordion__title">
                    {{ $t('tokenOperations.routeInfo') }}:
                    <span class="route-info-title">{{ estimateErrorTitle }}</span>
                </div>
            </template>
            <template #content>
                <div class="accordion__content">
                    <AccordionItem :label="$t('tokenOperations.networkFee') + ' : '">
                        <span class="fee">{{ networkFee }}</span> <span class="fee-symbol">$</span>
                    </AccordionItem>
                    <AccordionItem :label="$t('simpleSwap.service') + ' : '">
                        <img :src="selectedService.icon" alt="service-logo" />
                        <span class="symbol">1inch</span>
                    </AccordionItem>
                </div>
            </template>
        </Accordion>

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

import { LoadingOutlined } from '@ant-design/icons-vue';

import { getAllowance, getApproveTx, estimateSwap, getSwapTx } from '@/api/services';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useNotification from '@/compositions/useNotification';

import Button from '@/components/ui/Button';
import SelectNetwork from '@/components/ui/SelectNetwork';

import SelectAmount from '@/components/ui/SelectAmount';

import Accordion from '@/components/ui/Accordion.vue';
import AccordionItem from '@/components/ui/AccordionItem.vue';

import SwapIcon from '@/assets/icons/dashboard/swap.svg';

import { prettyNumberTooltip } from '@/helpers/prettyNumber';

import { sortByKey } from '@/helpers/utils';
import { toMantissa } from '@/helpers/numbers';
import { checkErrors } from '@/helpers/checkErrors';

import { TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { isCorrectChain } from '@/shared/utils/operations';

export default {
    name: 'SimpleSwap',

    components: {
        SelectNetwork,
        SelectAmount,
        Button,
        SwapIcon,
        Accordion,
        AccordionItem,
    },

    setup() {
        const store = useStore();
        const router = useRouter();

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        const { walletAddress, currentChainInfo, chainList, getTxExplorerLink, formatTransactionForSign, signSend, setChain } =
            useAdapter();

        // * Loaders
        const isLoading = ref(false);
        const isEstimating = ref(false);
        const isUpdateSwapDirectionValue = ref(false);

        // * Swap data
        const opTitle = ref('tokenOperations.swap');

        const isNeedApprove = ref(false);
        const balanceUpdated = ref(false);
        const approveTx = ref(null);
        const allowance = ref(null);

        // * Errors
        const txError = ref('');
        const txErrorTitle = ref('Transaction error');
        const estimateErrorTitle = ref('');
        const isBalanceError = ref(false);

        // * Success
        const successHash = ref('');

        // * Estimate data
        const estimateRate = ref(0);
        const networkFee = ref(0);
        const resetAmount = ref(false);

        // * Amount data
        const amount = ref('');
        const receiveValue = ref('');
        const setReceiveValue = ref('');

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

        const selectedNetwork = computed({
            get: () => store.getters['tokenOps/srcNetwork'],
            set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
        });

        const selectedTokenFrom = computed({
            get: () => store.getters['tokenOps/srcToken'],
            set: (value) => store.dispatch('tokenOps/setSrcToken', value),
        });

        const selectedTokenTo = computed({
            get: () => store.getters['tokenOps/dstToken'],
            set: (value) => store.dispatch('tokenOps/setDstToken', value),
        });

        // =================================================================================================================

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](selectedNetwork.value?.net));

        // =================================================================================================================

        // * Tokens list for validation
        const tokensList = computed(() => {
            const { net } = selectedNetwork.value || {};
            const listFromStore = store.getters['tokens/getTokensListForChain'](net);

            return sortByKey(listFromStore, 'balanceUsd');
        });

        // =================================================================================================================

        const setTokenOnChange = () => {
            const [defaultFromToken = null, defaultToToken = null] = tokensList.value || [];

            if (!selectedTokenFrom.value && defaultFromToken) {
                selectedTokenFrom.value = defaultFromToken;
            }

            if (!selectedTokenTo.value && defaultToToken) {
                selectedTokenTo.value = defaultToToken;
            }

            if (!balanceUpdated.value) {
                return;
            }

            if (!selectedTokenFrom.value && !selectedTokenTo.value) {
                return;
            }

            const { symbol: fromSymbol } = selectedTokenFrom.value || {};
            const { symbol: toSymbol } = selectedTokenFrom.value || {};

            const searchTokens = [fromSymbol, toSymbol];

            const updatedList = tokensList.value.filter((tkn) => searchTokens.includes(tkn.symbol)) || [];

            if (!updatedList.length) {
                return;
            }

            const [fromToken = null, toToken = null] = updatedList;

            if (fromToken) {
                selectedTokenFrom.value = fromToken;
            }

            if (toToken) {
                selectedTokenTo.value = toToken;
            }
        };

        // =================================================================================================================

        const disabledSwap = computed(() => {
            return (
                isLoading.value ||
                isBalanceError.value ||
                txError.value ||
                !+amount.value ||
                !receiveValue.value ||
                !selectedNetwork.value ||
                !selectedTokenFrom.value ||
                !selectedTokenTo.value
            );
        });

        const clearApprove = () => {
            isNeedApprove.value = false;
            approveTx.value = null;
            receiveValue.value = '';
            allowance.value = null;
        };

        const resetValues = () => {
            resetAmount.value = true;
            onSetAmount('');
            receiveValue.value = '';
            setReceiveValue.value = '';
            estimateRate.value = 0;
            networkFee.value = 0;
            clearApprove();
            resetAmount.value = false;
        };

        // =================================================================================================================

        const onSelectNetwork = (network) => {
            selectedNetwork.value = network;

            if (currentChainInfo.value.net !== selectedNetwork.value.net) {
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

        const checkBalanceAllowed = () => {
            const isBalanceAllowed = +amount.value > +selectedTokenFrom.value?.balance;

            isBalanceError.value = isBalanceAllowed;
        };

        const onSetAmount = async (value) => {
            amount.value = value;

            txError.value = '';
            receiveValue.value = '';

            if (!+value) {
                estimateErrorTitle.value = '';
                
                return checkBalanceAllowed();
            }

            if (!allowance.value) {
                await makeAllowanceRequest();
            }

            if (selectedTokenFrom.value.address) {
                await isEnoughAllowance();
            }

            await makeEstimateSwapRequest();

            return checkBalanceAllowed();
        };

        const swapTokensDirection = async () => {
            if (isUpdateSwapDirectionValue.value) {
                return;
            }

            amount.value = '';

            clearApprove();

            const from = { ...selectedTokenFrom.value };
            const to = { ...selectedTokenTo.value };

            isUpdateSwapDirectionValue.value = true;

            selectedTokenFrom.value = to;
            selectedTokenTo.value = from;

            if (selectedTokenFrom.value.address) {
                await makeAllowanceRequest();
            }

            await makeEstimateSwapRequest();

            setTimeout(() => {
                isUpdateSwapDirectionValue.value = false;
            }, 1000);
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

        const isEnoughAllowance = async () => {
            if (!selectedTokenFrom.value || !selectedNetwork.value || !walletAddress.value) {
                return;
            }

            isLoading.value = true;

            if (allowance.value >= toMantissa(amount.value, selectedTokenFrom.value?.decimals)) {
                isLoading.value = false;
                return (isNeedApprove.value = false);
            }

            isNeedApprove.value = true;

            if (approveTx.value) {
                return;
            }

            return await makeApproveRequest();
        };

        // =================================================================================================================

        const makeAllowanceRequest = async () => {
            approveTx.value = null;
            isNeedApprove.value = false;

            if (!selectedNetwork.value || !selectedTokenFrom.value || !walletAddress.value) {
                return;
            }

            if (!selectedTokenFrom.value.address) {
                return;
            }

            const response = await getAllowance({
                url: selectedService.value.url,
                net: selectedNetwork.value.net,
                tokenAddress: selectedTokenFrom.value.address,
                ownerAddress: walletAddress.value,
            });

            if (response.error) {
                return;
            }

            return (allowance.value = response.allowance);
        };

        // =================================================================================================================

        const makeEstimateSwapRequest = async () => {
            if (!selectedNetwork.value || !selectedTokenFrom.value || !selectedTokenTo.value || !+amount.value) {
                isEstimating.value = false;
                return;
            }

            isEstimating.value = true;

            const response = await estimateSwap({
                url: selectedService.value.url,
                net: selectedNetwork.value.net,
                fromTokenAddress: selectedTokenFrom.value.address,
                toTokenAddress: selectedTokenTo.value.address,
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
            networkFee.value = prettyNumberTooltip(+response.fee.amount * selectedNetwork.value.price, 4);

            estimateRate.value = prettyNumberTooltip(response.toTokenAmount / response.fromTokenAmount, 6);

            setReceiveValue.value = `Rate: <span class='symbol'>1</span> ${selectedTokenFrom.value.symbol} = <span class='symbol'>${estimateRate.value}</span> ${selectedTokenTo.value.symbol}`;
        };

        // =================================================================================================================

        const makeApproveRequest = async () => {
            if (!selectedNetwork.value || !selectedTokenFrom.value || !walletAddress.value) {
                return;
            }

            if (!selectedTokenFrom.value.address) {
                return;
            }

            const response = await getApproveTx({
                url: selectedService.value.url,
                net: selectedNetwork.value.net,
                tokenAddress: selectedTokenFrom.value.address,
                ownerAddress: walletAddress.value,
            });

            opTitle.value = 'tokenOperations.approve';

            if (response.error) {
                approveTx.value = response.error;
                isLoading.value = false;
                return;
            }

            approveTx.value = response;

            isLoading.value = false;

            return (isNeedApprove.value = true);
        };

        // =================================================================================================================

        const makeApproveTx = async () => {
            showNotification({
                key: 'approve-tx',
                type: 'info',
                title: `Getting Approve for ${selectedTokenFrom.value.symbol}`,
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const responseSendTx = await sendTransaction({ ...approveTx.value, from: walletAddress.value });

                if (responseSendTx.error) {
                    txError.value = responseSendTx.error;
                    txErrorTitle.value = 'Send approve transaction error';

                    isNeedApprove.value = false;

                    closeNotification('approve-tx');

                    return (isLoading.value = false);
                }

                approveTx.value = null;
                isNeedApprove.value = false;

                successHash.value = getTxExplorerLink(responseSendTx.transactionHash, currentChainInfo.value);

                closeNotification('approve-tx');

                await makeAllowanceRequest();
                await isEnoughAllowance();

                return (resetAmount.value = false);
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        const makeSwapTx = async () => {
            showNotification({
                key: 'prepare-tx',
                type: 'info',
                title: `Swap ${amount.value} ${selectedTokenFrom.value.symbol} to ~${receiveValue.value} ${selectedTokenTo.value.symbol}`,
                description: 'Please wait, transaction is preparing',
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const response = await getSwapTx({
                    url: selectedService.value.url,
                    net: selectedNetwork.value.net,
                    fromTokenAddress: selectedTokenFrom.value.address,
                    toTokenAddress: selectedTokenTo.value.address,
                    amount: amount.value,
                    ownerAddress: walletAddress.value,
                });

                if (response.error && response.error !== '') {
                    txError.value = response.error;
                    txErrorTitle.value = 'Swap error';
                    return (isLoading.value = false);
                }

                return response;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        const handleOnSwap = async () => {
            isLoading.value = true;
            txError.value = '';

            const { isChanged, btnTitle } = await isCorrectChain(selectedNetwork, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                return (isLoading.value = false);
            }

            opTitle.value = 'tokenOperations.swap';

            if (approveTx.value && isNeedApprove.value) {
                opTitle.value = 'tokenOperations.approve';
                await makeApproveTx();
            }

            if (approveTx.value) {
                return (isLoading.value = false);
            }

            opTitle.value = 'tokenOperations.swap';

            const responseSwap = await makeSwapTx();

            if (!responseSwap) {
                return (isLoading.value = false);
            }
            
            try {
                const responseSendTx = await sendTransaction(responseSwap);

                if (responseSendTx.error) {
                    txError.value = responseSendTx.error;
                    txErrorTitle.value = 'Sign transaction error';
                    return (isLoading.value = false);
                }

                successHash.value = getTxExplorerLink(responseSendTx.transactionHash, currentChainInfo.value);

                store.dispatch('tokens/updateTokenBalances', {
                    net: selectedNetwork.value.net,
                    address: walletAddress.value,
                    info: selectedNetwork.value,
                    update(wallet) {
                        store.dispatch('networks/setSelectedNetwork', wallet);
                    },
                });

                resetAmount.value = true;

                isLoading.value = false;

                balanceUpdated.value = true;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        watch(selectedNetwork, (newValue, oldValue) => {
            if (newValue?.net !== oldValue?.net) {
                resetValues();
                selectedTokenFrom.value = null;
                selectedTokenTo.value = null;
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

        watch(successHash, () => {
            if (!successHash.value) {
                return;
            }

            showNotification({
                key: 'success-send-tx',
                type: 'success',
                title: 'Click to view transaction',
                onClick: () => {
                    window.open(successHash.value, '_blank');
                    closeNotification('success-send-tx');
                    successHash.value = '';
                },
                duration: 4,
                style: {
                    cursor: 'pointer',
                },
            });

            closeNotification('prepare-tx');

            return setTimeout(() => {
                successHash.value = '';
            }, 5000);
        });

        watch(isTokensLoadingForChain, () => setTokenOnChange());

        // =================================================================================================================

        onMounted(async () => {
            selectType.value = TOKEN_SELECT_TYPES.FROM;

            if (!selectedNetwork.value) {
                selectedNetwork.value = currentChainInfo.value;
            }

            setTokenOnChange();
            await makeAllowanceRequest();
        });

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/swap/select-token') {
                selectedTokenFrom.value = null;
                selectedTokenTo.value = null;
                selectedNetwork.value = null;
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

            chainList,

            isBalanceError,
            estimateErrorTitle,
            selectedNetwork,

            resetAmount,
            isUpdateSwapDirectionValue,
            currentChainInfo,

            selectedTokenFrom,
            selectedTokenTo,
            receiveValue,

            txError,
            estimateRate,
            successHash,
            networkFee,
            setReceiveValue,
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

    .accordion__title {
        display: flex;
        align-items: center;

        font-weight: 400;
        color: var(--zmt-accordion-label-color);
        font-size: var(--zmt-default-fs);

        .symbol {
            font-weight: 600;
        }

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
}
</style>
