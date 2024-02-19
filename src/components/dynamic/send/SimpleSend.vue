<template>
    <a-form>
        <a-form-item>
            <SelectRecord
                :disabled="isWaitingTxStatusForModule"
                :placeholder="$t('tokenOperations.selectNetwork')"
                :current="selectedSrcNetwork"
                @click="onSelectNetwork"
            />
        </a-form-item>

        <SelectAddressInput
            :on-reset="clearAddress"
            :selected-network="selectedSrcNetwork"
            :disabled="isWaitingTxStatusForModule"
            @error-status="(status) => (isAddressError = status)"
        />

        <SelectAmountInput
            :value="selectedSrcToken"
            :selected-network="selectedSrcNetwork"
            :error="!!isBalanceError"
            :label="$t('tokenOperations.asset')"
            :on-reset="resetAmount"
            :amount-value="srcAmount"
            :disabled-select="isWaitingTxStatusForModule"
            :disabled="isWaitingTxStatusForModule || isTokensLoadingForSrc"
            class="select-amount"
            @setAmount="onSetAmount"
            @clickToken="onSelectToken"
        />

        <a-form-item v-if="selectedSrcNetwork?.ecosystem === ECOSYSTEMS.COSMOS">
            <div class="row mt-8">
                <Checkbox v-model:value="isMemoAllowed" :label="`Memo`" />

                <a-tooltip placement="right" :title="$t('tokenOperations.memoDescription')">
                    <InfoIcon/>
                </a-tooltip>
            </div>

            <MemoInput v-if="isMemoAllowed" class="mt-8"/>
        </a-form-item>

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
import { ref, inject, computed, onMounted, watch } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import useNotification from '@/compositions/useNotification';
import useTransactions from '@/Transactions/compositions/useTransactions';
import useServices from '@/compositions/useServices';

import MemoInput from '@/components/ui/MemoInput.vue';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import SelectRecord from '@/components/ui/Select/SelectRecord';
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import SelectAmountInput from '@/components/ui/Select/SelectAmountInput';

import InfoIcon from '@/assets/icons/platform-icons/info.svg';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { ECOSYSTEMS } from '@/Adapter/config';

import { isCorrectChain } from '@/shared/utils/operations';


export default {
    name: 'SimpleSend',
    components: {
        SelectRecord,
        SelectAddressInput,
        SelectAmountInput,
        Button,
        MemoInput,
        Checkbox,
        InfoIcon,
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

        const isMemoAllowed = ref(false);

        const memo = computed({
            get: () => store.getters['tokenOps/memo'],
            set: (value) => store.dispatch('tokenOps/setMemo', value),
        });

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
                !currentChainInfo.value,
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

            memo.value = '';
            isMemoAllowed.value = false;
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
                duration: 0,
            });

            try {
                if (selectedSrcNetwork.value.ecosystem === ECOSYSTEMS.COSMOS && memo.value.length) {
                    dataForPrepare.memo = memo.value;
                }
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
                            type: TRANSACTION_TYPES.TRANSFER,
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

            isMemoAllowed,

            ECOSYSTEMS
        };
    },
};
</script>
