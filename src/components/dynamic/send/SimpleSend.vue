<template>
    <a-form>
        <a-form-item>
            <SelectRecord :placeholder="$t('tokenOperations.selectNetwork')" :current="selectedSrcNetwork" @click="onSelectNetwork" />
        </a-form-item>

        <SelectAddressInput
            :on-reset="clearAddress"
            :selected-network="selectedSrcNetwork"
            @error-status="(status) => (isAddressError = status)"
        />

        <SelectAmountInput
            :value="selectedSrcToken"
            :selected-network="selectedSrcNetwork"
            :error="!!isBalanceError"
            :label="$t('tokenOperations.asset')"
            :on-reset="resetAmount"
            :is-token-loading="isTokensLoadingForSrc"
            :amount-value="srcAmount"
            class="select-amount"
            @setAmount="onSetAmount"
            @clickToken="onSelectToken"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledSend"
            :loading="isWaitingTxStatusForModule || isLoading"
            :tip="$t(opTitle)"
            class="module-layout-view-btn"
            data-qa="confirm"
            @click="handleOnSend"
            size="large"
        />
    </a-form>
</template>
<script>
import { h, ref, inject, computed, onMounted, watch } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { SettingOutlined } from '@ant-design/icons-vue';

import useNotification from '@/compositions/useNotification';
import useTransactions from '../../../Transactions/compositions/useTransactions';
import useServices from '../../../compositions/useServices';

import Button from '@/components/ui/Button';
import SelectRecord from '@/components/ui/Select/SelectRecord';
// import SelectAddress from '@/components/ui/SelectAddress';
// import SelectAmount from '@/components/ui/SelectAmount';

import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import SelectAmountInput from '@/components/ui/Select/SelectAmountInput';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { STATUSES } from '../../../Transactions/shared/constants';

import { isCorrectChain } from '@/shared/utils/operations';
import {} from '@/shared/utils/balances';

export default {
    name: 'SimpleSend',
    components: {
        SelectRecord,
        SelectAddressInput,
        SelectAmountInput,
        Button,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const useAdapter = inject('useAdapter');

        const { name: module } = router.currentRoute.value;

        const {
            selectedSrcToken,
            selectedSrcNetwork,

            receiverAddress,
            srcAmount,

            opTitle,

            isBalanceError,
            isTokensLoadingForSrc,
            isWaitingTxStatusForModule,

            handleOnSelectToken,
            handleOnSelectNetwork,
        } = useServices({
            moduleType: 'send',
        });

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        // * Adapter for wallet
        const { walletAddress, connectedWallet, currentChainInfo, chainList, setChain } = useAdapter();

        const { createTransactions, signAndSend, transactionForSign } = useTransactions();

        const isLoading = ref(false);

        const clearAddress = ref(false);
        const resetAmount = ref(false);

        const isAddressError = ref(false);

        // =================================================================================================================

        const disabledSend = computed(
            () =>
                isLoading.value ||
                isAddressError.value ||
                isBalanceError.value ||
                isWaitingTxStatusForModule.value ||
                !+srcAmount.value ||
                !receiverAddress.value?.length ||
                !selectedSrcToken.value ||
                !currentChainInfo.value
        );

        const onSelectToken = () => handleOnSelectToken({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });
        const onSelectNetwork = () => handleOnSelectNetwork({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });
        const onSetAmount = (value) => (srcAmount.value = value);

        const resetAmounts = async (amount) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) {
                return;
            }

            resetAmount.value = amount === null;

            clearAddress.value = receiverAddress.value === null;
        };

        // =================================================================================================================

        const handleOnSend = async () => {
            if (disabledSend.value) {
                return;
            }

            isLoading.value = true;

            const dataForPrepare = {
                fromAddress: null,
                toAddress: receiverAddress.value,
                amount: srcAmount.value,
                token: selectedSrcToken.value,
            };

            const { isChanged, btnTitle } = await isCorrectChain(selectedSrcNetwork, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                return (isLoading.value = false);
            }

            opTitle.value = 'tokenOperations.confirm';

            // Reset values

            showNotification({
                key: 'prepare-tx',
                type: 'info',
                title: `Sending ${dataForPrepare.amount} ${dataForPrepare.token.symbol} ...`,
                description: 'Please wait, transaction is preparing',
                icon: h(SettingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                // TODO: multiple transactions for send module
                const txs = [
                    {
                        index: 0,
                        ecosystem: selectedSrcNetwork.value.ecosystem,
                        module,
                        status: STATUSES.IN_PROGRESS,
                        parameters: {
                            ...dataForPrepare,
                            fromAddress: walletAddress.value,
                        },
                        account: walletAddress.value,
                        chainId: `${selectedSrcNetwork.value?.chain_id}`,
                        metaData: {
                            action: 'prepareTransaction',
                            type: 'Transfer',
                            successCallback: {
                                action: 'CLEAR_AMOUNTS',
                            },
                        },
                    },
                ];

                await createTransactions(txs);

                const resTx = await signAndSend(transactionForSign.value);

                closeNotification('prepare-tx');

                if (resTx.error) {
                    clearAddress.value = false;
                    return (isLoading.value = false);
                }

                return (isLoading.value = false);
            } catch (error) {
                closeNotification('prepare-tx');
                isLoading.value = false;
                clearAddress.value = false;
            }
        };

        // =================================================================================================================

        watch(srcAmount, () => resetAmounts(srcAmount.value));

        watch(resetAmount, () => {
            if (resetAmount.value) {
                onSetAmount(null);
                setTimeout(() => (resetAmount.value = false));
            }
        });

        // =================================================================================================================

        onMounted(() => store.dispatch('txManager/setCurrentRequestID', null));

        return {
            isLoading,
            isTokensLoadingForSrc,
            isWaitingTxStatusForModule,

            disabledSend,

            clearAddress,
            resetAmount,

            isAddressError,
            isBalanceError,

            selectedSrcToken,
            srcAmount,
            receiverAddress,

            onSelectNetwork,
            onSelectToken,
            onSetAmount,

            handleOnSend,

            opTitle,

            chainList,
            walletAddress,
            selectedSrcNetwork,
            connectedWallet,
            currentChainInfo,
        };
    },
};
</script>
