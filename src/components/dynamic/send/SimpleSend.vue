<template>
    <div class="simple-send">
        <SelectNetwork :items="chainList" :current="currentChainInfo" @select="onSelectNetwork" />

        <SelectAddress
            :selected-network="currentChainInfo"
            :items="[]"
            :value="receiverAddress"
            :error="!!errorAddress"
            class="mt-10"
            :on-reset="successHash || clearAddress"
            @setAddress="onSetAddress"
        />

        <InfoPanel v-if="errorAddress" :title="errorAddress" class="mt-10" />

        <SelectAmount
            :value="selectedToken"
            :error="!!errorBalance"
            :label="$t('tokenOperations.amount')"
            :on-reset="successHash || clearAddress"
            :is-token-loading="isTokensLoadingForChain"
            class="mt-10"
            @setAmount="onSetAmount"
            @clickToken="onSetToken"
        />

        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
        <InfoPanel v-if="successHash" :hash="successHash" :title="$t('tx.txHash')" type="success" class="mt-10" />

        <Button
            :title="$t('tokenOperations.confirm')"
            :disabled="!!disabledSend"
            :loading="isLoading"
            class="simple-send__btn mt-10"
            @click="send"
            size="large"
        />
    </div>
</template>
<script>
import { h, ref, computed, onBeforeUnmount, onMounted, onUpdated, watch } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { LoadingOutlined } from '@ant-design/icons-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useNotification from '@/compositions/useNotification';

import Button from '@/components/ui/Button';
import InfoPanel from '@/components/ui/InfoPanel';
import SelectNetwork from '@/components/ui/SelectNetwork';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectAmount from '@/components/ui/SelectAmount';
import { sortByKey } from '@/helpers/utils';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '../../../shared/constants/operations';

export default {
    name: 'SimpleSend',
    components: {
        InfoPanel,
        SelectNetwork,
        SelectAddress,
        SelectAmount,
        Button,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        // * Adapter for wallet
        const {
            walletAddress,
            connectedWallet,
            currentChainInfo,
            validateAddress,
            chainList,
            prepareTransaction,
            signSend,
            setChain,
            getTxExplorerLink,
        } = useAdapter();

        const txError = ref('');
        const isLoading = ref(false);
        const successHash = ref('');

        const amount = ref('');

        const clearAddress = ref(false);
        const errorAddress = ref('');
        const errorBalance = ref('');

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](currentChainInfo.value?.net));

        // =================================================================================================================

        const selectedToken = computed({
            get: () => store.getters['tokenOps/srcToken'],
            set: (value) => store.dispatch('tokenOps/setSrcToken', value),
        });

        const selectedNetwork = computed({
            get: () => store.getters['tokenOps/srcNetwork'],
            set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
        });

        // =================================================================================================================

        const receiverAddress = computed({
            get: () => store.getters['tokenOps/receiverAddress'],
            set: (value) => store.dispatch('tokenOps/setReceiverAddress', value),
        });

        // =================================================================================================================

        const tokensList = computed(() => {
            const { net } = currentChainInfo.value;
            const listFromStore = store.getters['tokens/getTokensListForChain'](net);
            return sortByKey(listFromStore, 'balanceUsd');
        });

        // =================================================================================================================

        const disabledSend = computed(() => {
            return (
                isLoading.value ||
                errorAddress.value ||
                errorBalance.value ||
                !+amount.value ||
                !receiverAddress.value.length ||
                !currentChainInfo.value
            );
        });

        // =================================================================================================================

        const setTokenOnChange = () => {
            selectedNetwork.value = currentChainInfo.value;

            const [defaultToken = null] = tokensList.value || [];

            if (!selectedToken.value && defaultToken) {
                return (selectedToken.value = defaultToken);
            }

            const { symbol } = selectedToken.value || {};

            const token = tokensList.value.find((tkn) => tkn.symbol === symbol);

            return (selectedToken.value = token || null);
        };

        // =================================================================================================================

        const onSetToken = () => {
            clearAddress.value = true;
            router.push('/send/select-token');
            clearAddress.value = false;
        };

        const onSetAddress = (addr = '') => {
            receiverAddress.value = addr;
            errorAddress.value = '';

            if (!addr?.length) {
                return (errorAddress.value = '');
            }

            if (!validateAddress(addr)) {
                return (errorAddress.value = 'Invalid address');
            }

            return (errorAddress.value = '');
        };

        const onSelectNetwork = async (network) => {
            clearAddress.value = true;
            await setChain(network);
            clearAddress.value = false;
        };

        const onSetAmount = (value) => {
            amount.value = value;

            if (isNaN(amount.value)) {
                return (errorBalance.value = 'Incorrect amount');
            }

            if (+value > selectedToken.value?.balance) {
                return (errorBalance.value = 'Insufficient balance');
            }

            return (errorBalance.value = '');
        };

        // =================================================================================================================

        const send = async () => {
            if (disabledSend.value) {
                return;
            }

            const dataForPrepare = {
                fromAddress: walletAddress.value,
                toAddress: receiverAddress.value,
                amount: amount.value,
                token: selectedToken.value,
            };

            // reset values for next send
            clearAddress.value = true;

            amount.value = '';
            receiverAddress.value = '';

            clearAddress.value = false;

            try {
                showNotification({
                    key: 'prepare-send-tx',
                    type: 'info',
                    title: `Sending ${dataForPrepare.amount} ${dataForPrepare.token.symbol} ...`,
                    description: 'Please wait, transaction is preparing',
                    icon: h(LoadingOutlined, {
                        spin: true,
                    }),
                    duration: 0,
                });

                const tx = await prepareTransaction(
                    dataForPrepare.fromAddress,
                    dataForPrepare.toAddress,
                    dataForPrepare.amount,
                    dataForPrepare.token
                );

                if (tx.error) {
                    closeNotification('prepare-send-tx');
                    return (txError.value = tx.error);
                }

                const resTx = await signSend(tx);

                if (resTx.error) {
                    closeNotification('prepare-send-tx');
                    return (txError.value = resTx.error);
                }

                successHash.value = getTxExplorerLink(resTx.transactionHash, currentChainInfo.value);
                isLoading.value = false;
            } catch (error) {
                closeNotification('prepare-send-tx');
            }
        };

        // =================================================================================================================

        // * Reset Values before leave page
        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/send/select-token') {
                selectedToken.value = null;
                selectedNetwork.value = null;
                receiverAddress.value = '';
            }

            amount.value = null;
        });

        onMounted(() => {
            store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);
            store.dispatch('tokenOps/setDirection', DIRECTIONS.SOURCE);
            store.dispatch('tokenOps/setOnlyWithBalance', true);
            setTokenOnChange();
        });

        onUpdated(() => setTokenOnChange());

        watch(txError, (err) => {
            if (!err) {
                return;
            }

            showNotification({
                key: 'error-tx',
                type: 'error',
                title: 'Transaction error',
                description: JSON.stringify(txError.value || 'Unknown error'),
                duration: 5,
            });

            closeNotification('prepare-send-tx');

            isLoading.value = false;
        });

        watch(currentChainInfo, () => {
            selectedNetwork.value = currentChainInfo.value;
        });

        watch(isTokensLoadingForChain, () => setTokenOnChange());

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

        return {
            isLoading,
            isTokensLoadingForChain,

            disabledSend,

            clearAddress,

            errorAddress,
            errorBalance,
            selectedToken,
            receiverAddress,

            onSelectNetwork,
            onSetAddress,
            onSetToken,
            onSetAmount,
            send,

            txError,
            successHash,
            walletAddress,
            connectedWallet,
            chainList,
            currentChainInfo,
        };
    },
};
</script>
<style lang="scss" scoped>
.simple-send {
    width: 660px;

    .mt-10 {
        margin-top: 10px;
    }

    &__btn {
        height: 64px;
        width: 100%;
    }
}
</style>
