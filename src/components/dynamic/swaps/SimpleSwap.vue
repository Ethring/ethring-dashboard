<template>
    <a-form>
        <a-form-item>
            <SelectRecord :current="selectedSrcNetwork" :placeholder="$t('tokenOperations.selectNetwork')" @click="onSelectNetwork" />
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
                :disabled="!selectedDstToken || !isUpdateSwapDirection"
                :on-click-switch="() => swapDirections(false)"
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

        <EstimatePreviewInfo
            v-if="(selectedDstToken && srcAmount) || isShowEstimateInfo"
            :is-loading="isEstimating"
            :service="selectedService"
            :title="$t('tokenOperations.routeInfo')"
            :main-rate="rateFeeInfo"
            :fees="[baseFeeInfo]"
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

import { SettingOutlined } from '@ant-design/icons-vue';

import { getBridgeTx, getSwapTx } from '@/api/services';

// Notification
import useNotification from '@/compositions/useNotification';
import useServices from '../../../compositions/useServices';

// Transaction Management
import useTransactions from '../../../Transactions/compositions/useTransactions';
import { STATUSES } from '../../../Transactions/shared/constants';

// Components
import Button from '@/components/ui/Button';

import SelectRecord from '@/components/ui/Select/SelectRecord';
import SelectAmountInput from '@/components/ui/Select/SelectAmountInput';

import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';

import SwitchDirection from '@/components/ui/SwitchDirection.vue';

import { isCorrectChain } from '@/shared/utils/operations';

import { errorRegister } from '@/shared/utils/errors';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';

export default {
    name: 'SimpleSwap',

    components: {
        SelectRecord,
        SelectAmountInput,
        Button,
        EstimatePreviewInfo,
        SwitchDirection,
    },

    setup() {
        const store = useStore();
        const router = useRouter();

        const useAdapter = inject('useAdapter');

        const { name: module } = router.currentRoute.value;

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        const { walletAddress, currentChainInfo, walletAccount, setChain } = useAdapter();

        // * Module values
        const {
            selectedService,
            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,

            onlyWithBalance,

            srcAmount,
            dstAmount,

            srcTokenApprove,
            isNeedApprove,

            txError,
            txErrorTitle,
            estimateErrorTitle,

            isEstimating,
            isLoading,

            opTitle,

            baseFeeInfo,
            rateFeeInfo,

            isBalanceError,
            isShowEstimateInfo,

            addressesByChains,

            clearApproveForService,

            makeApproveRequest,

            isUpdateSwapDirection,
            swapDirections,

            handleOnSelectToken,
            handleOnSelectNetwork,
            makeEstimateRequest,
        } = useServices({
            module,
            moduleType: 'swap',
        });

        // =================================================================================================================

        // * Transaction Manager
        const { currentRequestID, transactionForSign, createTransactions, signAndSend, addTransactionToRequestID } = useTransactions();

        const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](module));

        const balanceUpdated = ref(false);

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

            return await makeEstimateRequest();
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
                    url: selectedService.value?.url,
                    net: selectedSrcNetwork.value.net,
                    fromTokenAddress: selectedSrcToken.value.address,
                    toTokenAddress: selectedDstToken.value.address,
                    amount: srcAmount.value,
                    ownerAddress: walletAddress.value,
                };

                let response = null;

                if (selectedService.value?.id === 'swap-skip') {
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
            await makeApproveRequest(selectedService.value);

            if (!srcTokenApprove.value) {
                store.dispatch('txManager/setTransactionForSign', null);
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
                    ...srcTokenApprove.value,
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
                            url: selectedService.value?.url,
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
                store.dispatch('txManager/setTransactionForSign', null);
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

        const handleOnSwap = async () => {
            isLoading.value = true;
            txError.value = '';

            const { isChanged, btnTitle } = await isCorrectChain(selectedSrcNetwork, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                return (isLoading.value = false);
            }

            if (isNeedApprove.value) {
                opTitle.value = 'tokenOperations.approve';
                await handleApprove();
            } else {
                opTitle.value = 'tokenOperations.swap';
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

                    txError.value = errorRegister(responseSendTx.error).error;

                    return (isLoading.value = false);
                }

                isLoading.value = false;
                balanceUpdated.value = true;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        watch(srcAmount, () => resetAmounts(DIRECTIONS.SOURCE, srcAmount.value));

        watch(dstAmount, () => resetAmounts(DIRECTIONS.DESTINATION, dstAmount.value));

        watch(walletAccount, () => {
            isEstimating.value = false;
            isLoading.value = false;
        });

        // =================================================================================================================

        onMounted(() => store.dispatch('txManager/setCurrentRequestID', null));

        return {
            isLoading,
            isEstimating,
            isTokensLoadingForChain,
            isWaitingTxStatusForModule,

            opTitle,

            disabledSwap,
            walletAddress,

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

            baseFeeInfo,
            rateFeeInfo,
            isShowEstimateInfo,

            selectedService,

            onSelectToken,
            onSelectNetwork,

            onSetAmount,

            handleOnSwap,
            swapDirections,
        };
    },
};
</script>
