<template>
    <div class="simple-send">
        <SelectNetwork :items="chainList" :current="selectedNetwork" @select="onSelectNetwork" />

        <SelectAddress
            :selected-network="selectedNetwork"
            :items="[]"
            :value="receiverAddress"
            :error="!!isAddressError"
            class="mt-10"
            :on-reset="clearAddress"
            @setAddress="onSetAddress"
        />

        <SelectAmount
            :value="selectedToken"
            :error="!!isBalanceError"
            :label="$t('tokenOperations.amount')"
            :on-reset="clearAddress"
            :is-token-loading="isTokensLoadingForChain"
            class="mt-10"
            @setAmount="onSetAmount"
            @clickToken="onSetToken"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledSend"
            :loading="isLoading"
            class="simple-send__btn mt-10"
            @click="handleOnSend"
            size="large"
        />
    </div>
</template>
<script>
import { h, ref, computed, onBeforeUnmount, onMounted, watch } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { SettingOutlined } from '@ant-design/icons-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';
import useNotification from '@/compositions/useNotification';
import useTransactions from '../../../Transactions/compositions/useTransactions';

import Button from '@/components/ui/Button';
import SelectNetwork from '@/components/ui/SelectNetwork';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectAmount from '@/components/ui/SelectAmount';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { STATUSES } from '../../../Transactions/shared/constants';

import { isCorrectChain } from '@/shared/utils/operations';

export default {
    name: 'SimpleSend',
    components: {
        SelectNetwork,
        SelectAddress,
        SelectAmount,
        Button,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const { name: module } = router.currentRoute.value;

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        // * Adapter for wallet
        const { walletAddress, connectedWallet, currentChainInfo, validateAddress, chainList, walletAccount, setChain } = useAdapter();

        const { createTransactions, signAndSend, transactionForSign } = useTransactions();

        const isLoading = ref(false);

        const amount = ref('');

        const opTitle = ref('tokenOperations.confirm');

        const clearAddress = ref(false);
        const isAddressError = ref(false);
        const isBalanceError = ref(false);

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

        const { getTokensList } = useTokensList();

        const tokensList = ref([]);

        // =================================================================================================================

        const disabledSend = computed(() => {
            return (
                isLoading.value ||
                isAddressError.value ||
                isBalanceError.value ||
                !+amount.value ||
                !receiverAddress.value?.length ||
                !currentChainInfo.value
            );
        });

        // =================================================================================================================

        const setTokenOnChange = () => {
            tokensList.value = getTokensList({
                srcNet: selectedNetwork.value,
            });

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

            if (!addr) {
                return (isAddressError.value = false);
            }

            const isAddressAllowed = !validateAddress(addr, { chainId: selectedNetwork?.value?.net }) && addr?.length > 0;

            return (isAddressError.value = isAddressAllowed);
        };

        const onSelectNetwork = (network) => {
            clearAddress.value = true;
            selectedNetwork.value = network;

            setTokenOnChange();

            if (currentChainInfo.value.net !== selectedNetwork.value.net) {
                return (opTitle.value = 'tokenOperations.switchNetwork');
            }

            clearAddress.value = false;
            return (opTitle.value = 'tokenOperations.confirm');
        };

        const onSetAmount = (value) => {
            amount.value = value;

            const isBalanceAllowed = +value > +selectedToken.value?.balance;

            isBalanceError.value = isBalanceAllowed;
        };

        // =================================================================================================================

        const handleOnSend = async () => {
            if (disabledSend.value) {
                return;
            }

            clearAddress.value = false;
            isLoading.value = true;

            const dataForPrepare = {
                fromAddress: walletAddress.value,
                toAddress: receiverAddress.value,
                amount: amount.value,
                token: selectedToken.value,
            };

            const { isChanged, btnTitle } = await isCorrectChain(selectedNetwork, currentChainInfo, setChain);

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
                        ecosystem: selectedNetwork.value?.ecosystem,
                        module,
                        status: STATUSES.IN_PROGRESS,
                        parameters: {
                            ...dataForPrepare,
                        },
                        account: walletAccount.value,
                        chainId: `${selectedNetwork.value?.chain_id}`,
                        metaData: {
                            action: 'prepareTransaction',
                            type: 'Transfer',
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

                clearAddress.value = true;

                return (isLoading.value = false);
            } catch (error) {
                closeNotification('prepare-tx');
                isLoading.value = false;
                clearAddress.value = false;
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
            if (!selectedNetwork.value) {
                selectedNetwork.value = currentChainInfo.value;
            }

            store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);
            store.dispatch('tokenOps/setDirection', DIRECTIONS.SOURCE);
            store.dispatch('tokenOps/setOnlyWithBalance', true);
            store.dispatch('txManager/setCurrentRequestID', null);

            setTokenOnChange();
        });

        watch(walletAccount, () => {
            selectedNetwork.value = currentChainInfo.value;
            selectedToken.value = null;
            setTokenOnChange();
        });

        watch(currentChainInfo, () => {
            selectedNetwork.value = currentChainInfo.value;
            setTokenOnChange();
        });

        watch(isTokensLoadingForChain, () => setTokenOnChange());

        return {
            isLoading,
            isTokensLoadingForChain,

            disabledSend,

            clearAddress,

            isAddressError,
            isBalanceError,

            selectedToken,
            receiverAddress,

            onSelectNetwork,
            onSetAddress,
            onSetToken,
            onSetAmount,

            handleOnSend,

            opTitle,

            chainList,
            walletAddress,
            selectedNetwork,
            connectedWallet,
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
