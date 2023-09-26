<template>
    <div class="simple-swap">
        <SelectNetwork :items="chainList" :current="selectedNetwork" @select="onSelectNetwork" />

        <div class="simple-swap__switch-wrap">
            <SelectAmount
                v-if="tokensList.length"
                class="mt-10"
                :value="selectedTokenFrom"
                :error="!!errorBalance"
                :on-reset="resetAmount"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('tokenOperations.pay')"
                @clickToken="onSetTokenFrom"
                @setAmount="onSetAmount"
            />

            <div class="simple-swap__switch" :class="{ disabled: isUpdateSwapDirectionValue }" @click="swapTokensDirection">
                <SwapSvg />
            </div>

            <SelectAmount
                v-if="tokensList.length"
                class="mt-10"
                disabled
                hide-max
                :is-amount-loading="isEstimating"
                :value="selectedTokenTo"
                :on-reset="resetAmount"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('tokenOperations.receive')"
                :disabled-value="receiveValue"
                @clickToken="onSetTokenTo"
            />
        </div>

        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
        <InfoPanel v-if="successHash" :hash="successHash" :title="$t('tx.txHash')" type="success" class="mt-10" />

        <Accordion v-if="receiveValue" :title="setReceiveValue" class="mt-10">
            <div class="accordion__content">
                <AccordionItem :label="$t('tokenOperations.networkFee') + ' : '">
                    <span class="fee">{{ networkFee }}</span> <span class="fee-symbol">$</span>
                </AccordionItem>
                <AccordionItem :label="$t('simpleSwap.service') + ' : '">
                    <img src="https://cryptologos.cc/logos/1inch-1inch-logo.svg?v=025" />
                    <span class="symbol">1inch</span>
                </AccordionItem>
            </div>
        </Accordion>
        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledSwap"
            :loading="isLoading"
            class="simple-swap__btn mt-10"
            @click="swap"
            size="large"
        />
    </div>
</template>
<script>
import { h, ref, watch, computed, onBeforeUnmount, onMounted } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { LoadingOutlined } from '@ant-design/icons-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useNotification from '@/compositions/useNotification';

import Button from '@/components/ui/Button';
import InfoPanel from '@/components/ui/InfoPanel';
import SelectNetwork from '@/components/ui/SelectNetwork';

import SelectAmount from '@/components/ui/SelectAmount';

import Accordion from '@/components/ui/Accordion.vue';
import AccordionItem from '@/components/ui/AccordionItem.vue';

import SwapSvg from '@/assets/icons/dashboard/swap.svg';

import { prettyNumberTooltip } from '@/helpers/prettyNumber';

import { sortByKey } from '@/helpers/utils';
import { toMantissa } from '@/helpers/numbers';
import { checkErrors } from '@/helpers/checkErrors';

import { TOKEN_SELECT_TYPES } from '../../../shared/constants/operations';

const NATIVE_CONTRACT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export default {
    name: 'SimpleSwap',

    components: {
        InfoPanel,
        SelectNetwork,
        SelectAmount,
        Button,
        SwapSvg,
        Accordion,
        AccordionItem,
    },

    setup() {
        const store = useStore();
        const router = useRouter();

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        const { walletAddress, currentChainInfo, chainList, getTxExplorerLink, signSend, setChain } = useAdapter();

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
        const errorBalance = ref('');

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
            set: (value) => {
                store.dispatch('tokenOps/setSrcNetwork', value);
            },
        });

        const selectedTokenFrom = computed({
            get: () => store.getters['tokenOps/srcToken'],
            set: (value) => {
                store.dispatch('tokenOps/setSrcToken', value);
            },
        });

        const selectedTokenTo = computed({
            get: () => store.getters['tokenOps/dstToken'],
            set: (value) => {
                store.dispatch('tokenOps/setDstToken', value);
            },
        });

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

            const { code: fromCode } = selectedTokenFrom.value || {};
            const { code: toCode } = selectedTokenFrom.value || {};

            const searchTokens = [fromCode, toCode];

            const updatedList = tokensList.value.filter((tkn) => searchTokens.includes(tkn.code)) || [];

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
                errorBalance.value ||
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
            amount.value = '';
            receiveValue.value = '';
            setReceiveValue.value = '';
            estimateRate.value = 0;
            networkFee.value = 0;
            resetAmount.value = false;
            clearApprove();
        };

        // =================================================================================================================
        // * Handlers

        const onSelectNetwork = (network) => (selectedNetwork.value = network);

        const onSetTokenFrom = () => {
            selectType.value = TOKEN_SELECT_TYPES.FROM;
            onlyWithBalance.value = true;
            router.push('/swap/select-token');
            balanceUpdated.value = false;
            clearApprove();
        };

        const onSetTokenTo = async () => {
            selectType.value = TOKEN_SELECT_TYPES.TO;
            onlyWithBalance.value = false;
            router.push('/swap/select-token');
            balanceUpdated.value = false;
            await onSetAmount(amount.value);
        };

        const onSetAmount = async (value) => {
            amount.value = value;

            errorBalance.value = '';
            txError.value = '';
            receiveValue.value = '';

            if (isNaN(+value)) {
                return (errorBalance.value = 'Incorrect amount');
            }

            if (!+value) {
                return;
            }

            if (+value > selectedTokenFrom.value.balance) {
                return (errorBalance.value = 'Insufficient balance');
            }

            if (!allowance.value) {
                await getAllowance();
            }

            await getEstimateInfo();

            if (selectedTokenFrom.value.address) {
                await checkAllowance();
            }
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
                await getAllowance();
            }

            await getEstimateInfo();

            setTimeout(() => {
                isUpdateSwapDirectionValue.value = false;
            }, 1000);
        };

        // =================================================================================================================
        // * Check chain for swap and switch if need
        const isCorrectChain = async () => {
            if (currentChainInfo.value.net === selectedNetwork.value.net) {
                return true;
            }

            opTitle.value = 'tokenOperations.switchNetwork';

            try {
                showNotification({
                    key: 'switch-network',
                    type: 'info',
                    title: `Switch network to ${selectedNetwork.value.name}`,
                    icon: h(LoadingOutlined, {
                        spin: true,
                    }),
                    duration: 0,
                });

                await setChain(selectedNetwork.value);

                closeNotification('switch-network');

                return true;
            } catch (error) {
                isLoading.value = false;
                txError.value = error.message || error.error || error;

                return false;
            }
        };

        // =================================================================================================================
        // * Send transaction
        const sendTransaction = async (transaction) => {
            const tx = {
                data: transaction.data,
                from: transaction.from,
                to: transaction.to,
                chainId: `0x${transaction.chainId.toString(16)}`,
                value: transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0',
            };

            try {
                const signedTx = await signSend(tx);

                const receipt = await signedTx.wait();

                return receipt;
            } catch (e) {
                return checkErrors(e);
            }
        };

        // =================================================================================================================
        const checkAllowance = async () => {
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

            return await getApproveTx();
        };

        // * Get allowance from service
        const getAllowance = async () => {
            approveTx.value = null;
            isNeedApprove.value = false;

            if (!selectedNetwork.value || !selectedTokenFrom.value || !walletAddress.value) {
                return;
            }

            if (!selectedTokenFrom.value.address) {
                return;
            }

            const resAllowance = await store.dispatch('swap/getAllowance', {
                net: selectedNetwork.value.net,
                tokenAddress: selectedTokenFrom.value.address,
                ownerAddress: walletAddress.value,
            });

            if (resAllowance.error) {
                return (txError.value = resAllowance.error);
            }

            return (allowance.value = resAllowance.allowance);
        };

        // =================================================================================================================
        // * Get estimate info from service
        const getEstimateInfo = async () => {
            if (!selectedNetwork.value || !selectedTokenFrom.value || !selectedTokenTo.value || !+amount.value) {
                return;
            }

            if (amount.value > selectedTokenFrom.value.balance) {
                return;
            }

            isEstimating.value = true;

            const resEstimate = await store.dispatch('swap/estimateSwap', {
                net: selectedNetwork.value.net,
                fromTokenAddress: selectedTokenFrom.value.address || NATIVE_CONTRACT,
                toTokenAddress: selectedTokenTo.value.address || NATIVE_CONTRACT,
                amount: amount.value,
                ownerAddress: walletAddress.value,
            });

            if (resEstimate.error) {
                isEstimating.value = false;
                txError.value = resEstimate.error;

                return showNotification({
                    type: 'error',
                    title: 'Estimate error',
                    description: resEstimate.error || resEstimate.message,
                    duration: 4,
                });
            }

            isEstimating.value = false;

            txError.value = '';
            receiveValue.value = resEstimate.toTokenAmount;
            networkFee.value = prettyNumberTooltip(+resEstimate.fee.amount * selectedNetwork.value.latest_price, 4);
            estimateRate.value = prettyNumberTooltip(resEstimate.toTokenAmount / resEstimate.fromTokenAmount, 6);
            setReceiveValue.value = `Rate: <span class='symbol'>1</span> ${selectedTokenFrom.value.code} = <span class='symbol'>${estimateRate.value}</span> ${selectedTokenTo.value.code}`;
        };

        // =================================================================================================================
        // * Get approve tx from service
        const getApproveTx = async () => {
            if (!selectedNetwork.value || !selectedTokenFrom.value || !walletAddress.value) {
                return;
            }

            if (!selectedTokenFrom.value.address) {
                return;
            }

            const resApproveTx = await store.dispatch('swap/getApproveTx', {
                net: selectedNetwork.value.net,
                tokenAddress: selectedTokenFrom.value.address,
                ownerAddress: walletAddress.value,
            });

            opTitle.value = 'tokenOperations.approve';

            if (resApproveTx.error) {
                return (txError.value = resApproveTx.error);
            }

            approveTx.value = resApproveTx;

            isLoading.value = false;

            return (isNeedApprove.value = true);
        };

        // * Approve tx
        const makeApproveTx = async () => {
            showNotification({
                key: 'approve-swap-tx',
                type: 'info',
                title: `Getting Approve for ${selectedTokenFrom.value.code}`,
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            const resTx = await sendTransaction({ ...approveTx.value, from: walletAddress.value });

            if (resTx.error) {
                closeNotification('approve-swap-tx');

                showNotification({
                    key: 'error-approve-tx',
                    type: 'error',
                    title: 'Approve transaction error',
                    description: resTx.message || resTx.error,
                    duration: 2,
                });

                txError.value = resTx.error;
                return (isLoading.value = false);
            }

            approveTx.value = null;

            successHash.value = getTxExplorerLink(resTx.transactionHash, currentChainInfo.value);

            closeNotification('approve-swap-tx');

            showNotification({
                key: 'success-approve-tx',
                type: 'success',
                title: 'Approve transaction success',
                description: 'You can swap now',
                duration: 2,
            });

            await getAllowance();
            await checkAllowance();

            return (resetAmount.value = false);
        };

        // =================================================================================================================
        // * Swap tx handler
        const swap = async () => {
            if (disabledSwap.value) {
                return;
            }

            isLoading.value = true;
            txError.value = '';

            if (!(await isCorrectChain())) {
                return;
            }

            // SENDING APPROVE TX
            if (approveTx.value) {
                await makeApproveTx();
            }

            opTitle.value = 'tokenOperations.swap';

            showNotification({
                key: 'prepare-swap-tx',
                type: 'info',
                title: `Swap ${amount.value} ${selectedTokenFrom.value.code} to ~${receiveValue.value} ${selectedTokenTo.value.code}`,
                description: 'Please wait, transaction is preparing',
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            const resSwap = await store.dispatch('swap/getSwapTx', {
                net: selectedNetwork.value.net,
                fromTokenAddress: selectedTokenFrom.value.address || NATIVE_CONTRACT,
                toTokenAddress: selectedTokenTo.value.address || NATIVE_CONTRACT,
                amount: amount.value,
                ownerAddress: walletAddress.value,
                slippage: 0.5,
            });

            if (resSwap.error) {
                txError.value = resSwap.error;
                isLoading.value = false;

                closeNotification('prepare-swap-tx');

                return showNotification({
                    key: 'error-swap-tx',
                    type: 'error',
                    title: 'Swap transaction error',
                    description: resSwap.message || resSwap.error,
                    duration: 2,
                });
            }

            const resTx = await sendTransaction(resSwap);

            if (resTx.error) {
                txError.value = resTx.error;

                closeNotification('prepare-swap-tx');

                return showNotification({
                    key: 'error-swap-tx',
                    type: 'error',
                    title: 'Sign transaction error',
                    description: resTx.message || resTx.error,
                    duration: 2,
                });
            }

            successHash.value = getTxExplorerLink(selectedNetwork.value.net, resTx.transactionHash);

            isLoading.value = false;
            resetAmount.value = true;

            store.dispatch('tokens/updateTokenBalances', {
                net: selectedNetwork.value.net,
                address: walletAddress.value,
                info: selectedNetwork.value,
                update(wallet) {
                    store.dispatch('networks/setSelectedNetwork', wallet);
                },
            });

            balanceUpdated.value = true;
        };

        // =================================================================================================================
        // * Watchers
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

            closeNotification('prepare-swap-tx');
            isLoading.value = false;

            return setTimeout(() => {
                txError.value = '';
            }, 10000);
        });

        watch(successHash, (hash) => {
            if (!hash) {
                return;
            }

            closeNotification('prepare-swap-tx');

            return setTimeout(() => {
                successHash.value = '';
            }, 5000);
        });

        // =================================================================================================================

        onMounted(async () => {
            selectType.value = TOKEN_SELECT_TYPES.FROM;

            if (!selectedNetwork.value) {
                selectedNetwork.value = currentChainInfo.value;
            }

            setTokenOnChange();
            await getAllowance();
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

            opTitle,

            disabledSwap,
            walletAddress,

            chainList,
            tokensList,

            errorBalance,
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

            onSelectNetwork,
            onSetTokenFrom,
            onSetTokenTo,
            onSetAmount,
            swapTokensDirection,
            swap,
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
        .symbol {
            font-weight: 600;
        }
    }
}
</style>
