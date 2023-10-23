<template>
    <div class="simple-send">
        <SelectNetwork :items="chainList" :current="selectedSrcNetwork" @select="onSelectNetwork" />

        <SelectAddress
            :selected-network="selectedSrcNetwork"
            :items="[]"
            :value="receiverAddress"
            :error="!!isAddressError"
            class="mt-10"
            :on-reset="clearAddress"
            @setAddress="onSetAddress"
        />

        <SelectAmount
            :value="selectedSrcToken"
            :error="!!isBalanceError"
            :label="$t('tokenOperations.amount')"
            :on-reset="clearAddress || resetAmount"
            :is-token-loading="isTokensLoadingForChain"
            class="mt-10"
            @setAmount="onSetAmount"
            @clickToken="onSetToken"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledSend"
            :loading="isWaitingTxStatusForModule || isLoading"
            class="simple-send__btn mt-10"
            data-qa="confirm"
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
import useNotification from '@/compositions/useNotification';
import useTransactions from '../../../Transactions/compositions/useTransactions';
import useServices from '../../../compositions/useServices';

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

        const {
            //
            selectedSrcToken,
            selectedSrcNetwork,
            receiverAddress,
            srcAmount,
            opTitle,
            setTokenOnChange,
        } = useServices({
            module,
            moduleType: 'send',
        });

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        // * Adapter for wallet
        const { walletAddress, connectedWallet, currentChainInfo, validateAddress, chainList, setChain } = useAdapter();

        const { createTransactions, signAndSend, transactionForSign } = useTransactions();

        const isLoading = ref(false);
        const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](module));

        const clearAddress = ref(false);
        const resetAmount = ref(false);
        const isAddressError = ref(false);
        const isBalanceError = ref(false);

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](currentChainInfo.value?.net));

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

        const onSetToken = () => {
            clearAddress.value = true;
            router.push('/send/select-token');
        };

        const onSetAddress = (addr = '') => {
            receiverAddress.value = addr;

            if (!addr) {
                return (isAddressError.value = false);
            }

            const isAddressAllowed = !validateAddress(addr, { chainId: selectedSrcNetwork?.value?.net }) && addr?.length > 0;

            return (isAddressError.value = isAddressAllowed);
        };

        const onSelectNetwork = (network) => {
            clearAddress.value = true;
            selectedSrcToken.value = null;
            selectedSrcToken.value = null;
            selectedSrcNetwork.value = network;
        };

        const onSetAmount = (value) => {
            srcAmount.value = value;

            const isBalanceAllowed = +value > +selectedSrcToken.value?.balance;

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

        watch(srcAmount, () => {
            if (srcAmount.value === 0) {
                resetAmount.value = true;
            }
        });

        watch(receiverAddress, () => {
            if (receiverAddress.value === null) {
                clearAddress.value = true;
            }
        });

        watch(isTokensLoadingForChain, () => setTokenOnChange());

        // =================================================================================================================

        // * Reset Values before leave page
        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/send/select-token') {
                selectedSrcToken.value = null;
                selectedSrcNetwork.value = null;
                receiverAddress.value = '';
            }

            srcAmount.value = null;
        });

        onMounted(() => {
            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
            }

            store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);
            store.dispatch('tokenOps/setDirection', DIRECTIONS.SOURCE);
            store.dispatch('tokenOps/setOnlyWithBalance', true);
            store.dispatch('txManager/setCurrentRequestID', null);

            setTokenOnChange();
        });

        return {
            isLoading,
            isTokensLoadingForChain,
            isWaitingTxStatusForModule,

            disabledSend,

            clearAddress,
            resetAmount,

            isAddressError,
            isBalanceError,

            selectedSrcToken,
            receiverAddress,

            onSelectNetwork,
            onSetAddress,
            onSetToken,
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
