<template>
    <div class="simple-send">
        <SelectNetwork :items="chainList" @select="onSelectNetwork" />

        <SelectAddress
            :selected-network="currentChainInfo"
            :items="[]"
            :value="address"
            :error="!!errorAddress"
            class="mt-10"
            :on-reset="successHash || clearAddress"
            @setAddress="onSetAddress"
        />

        <InfoPanel v-if="errorAddress" :title="errorAddress" class="mt-10" />

        <SelectAmount
            v-if="tokensList.length"
            :selected-network="currentChainInfo"
            :items="tokensList"
            :value="selectedToken"
            :error="!!errorBalance"
            :label="$t('tokenOperations.amount')"
            :on-reset="successHash || clearAddress"
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
import { h, ref, computed, onBeforeUnmount, watch } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { LoadingOutlined } from '@ant-design/icons-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useTokens from '@/compositions/useTokens';
import useNotification from '@/compositions/useNotification';

import Button from '@/components/ui/Button';
import InfoPanel from '@/components/ui/InfoPanel';
import SelectNetwork from '@/components/ui/SelectNetwork';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectAmount from '@/components/ui/SelectAmount';

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

        const { showNotification, closeNotification } = useNotification();

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

        const { groupTokens } = useTokens();

        const isLoading = ref(false);
        const txError = ref('');
        const successHash = ref('');

        const amount = ref('');

        const address = computed({
            get() {
                return store.getters['tokens/address'];
            },
            set(addr) {
                store.dispatch('tokens/setAddress', addr);
            },
        });

        const clearAddress = ref(false);
        const errorAddress = ref('');
        const errorBalance = ref('');

        const selectedToken = computed(() => store.getters['tokens/fromToken']);

        const disabledSend = computed(() => {
            return (
                isLoading.value ||
                errorAddress.value ||
                errorBalance.value ||
                !+amount.value ||
                !address.value.length ||
                !currentChainInfo.value
            );
        });

        const tokensList = computed(() => {
            if (!currentChainInfo.value || !groupTokens.value?.length) {
                return [];
            }

            if (groupTokens.value.length === 0) {
                return [];
            }

            const [chainTokens = []] = groupTokens.value;

            const [tokenWithMaxBalance = {}] = chainTokens.list || [];

            if (!selectedToken.value) {
                store.dispatch('tokens/setFromToken', tokenWithMaxBalance);
                return chainTokens.list || [];
            }

            const token = chainTokens.list.find((tkn) => tkn.code === selectedToken.value.code);

            store.dispatch('tokens/setFromToken', token);

            return chainTokens.list || [];
        });

        const onSetToken = () => {
            clearAddress.value = true;
            router.push('/send/select-token');
            clearAddress.value = false;
        };

        const onSetAddress = (addr) => {
            address.value = addr;

            if (!addr.length) {
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

        const send = async () => {
            if (disabledSend.value) {
                return;
            }

            const dataForPrepare = {
                fromAddress: walletAddress.value,
                toAddress: address.value,
                amount: amount.value,
                token: selectedToken.value,
            };

            // reset values for next send
            clearAddress.value = true;

            amount.value = '';
            address.value = '';

            clearAddress.value = false;

            try {
                showNotification({
                    key: 'prepare-send-tx',
                    type: 'info',
                    title: `Sending ${dataForPrepare.amount} ${dataForPrepare.token.code} ...`,
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

                    return showNotification({
                        key: 'error-send-tx',
                        type: 'error',
                        title: 'Transaction error',
                        description: tx.error,
                        duration: 4,
                    });
                }

                const resTx = await signSend(tx);

                if (resTx.error) {
                    closeNotification('prepare-send-tx');

                    return showNotification({
                        key: 'error-send-tx',
                        type: 'error',
                        title: 'Transaction error',
                        description: resTx.error,
                        duration: 4,
                    });
                }

                successHash.value = getTxExplorerLink(resTx.transactionHash, currentChainInfo.value);
                isLoading.value = false;

                closeNotification('prepare-send-tx');

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

                setTimeout(() => {
                    successHash.value = '';
                }, 5000);
            } catch (error) {
                closeNotification('prepare-send-tx');

                showNotification({
                    key: 'error-send-tx',
                    type: 'error',
                    title: 'Transaction error',
                    description: error.message,
                    duration: 4,
                });
            }
        };

        watch(currentChainInfo, async () => {
            const [chainTokens = []] = groupTokens.value;

            const [tokenWithMaxBalance = {}] = chainTokens.list || [];

            store.dispatch('tokens/setFromToken', tokenWithMaxBalance);
        });

        onBeforeUnmount(() => {
            if (!clearAddress.value) {
                store.dispatch('tokens/setAddress', '');
            }
            if (router.options.history.state.current !== '/send/select-token') {
                store.dispatch('tokens/setFromToken', null);
            }
        });

        return {
            isLoading,
            disabledSend,

            clearAddress,
            groupTokens,
            tokensList,
            errorAddress,
            errorBalance,
            selectedToken,
            address,

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
