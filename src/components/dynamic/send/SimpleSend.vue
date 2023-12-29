<template>
    <div class="simple-send">
        <SelectNetwork
            :items="chainList"
            :label="$t('tokenOperations.selectNetwork')"
            :current="selectedSrcNetwork"
            @select="onSelectNetwork"
        />

        <SelectAddress
            :selected-network="selectedSrcNetwork"
            :items="[]"
            :value="receiverAddress"
            :error="!!isAddressError"
            class="mt-8"
            :on-reset="clearAddress"
            @setAddress="onSetAddress"
        />

        <SelectAmount
            :value="selectedSrcToken"
            :selected-network="selectedSrcNetwork"
            :error="!!isBalanceError"
            :label="$t('tokenOperations.asset')"
            :on-reset="resetAmount"
            :is-token-loading="isTokensLoadingForChain"
            :amount-value="srcAmount"
            class="mt-8"
            @setAmount="onSetAmount"
            @clickToken="onSetToken"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledSend"
            :loading="isWaitingTxStatusForModule || isLoading"
            class="simple-send__btn mt-16"
            data-qa="confirm"
            @click="handleOnSend"
            size="large"
        />
    </div>
</template>
<script>
import { h, ref, inject, computed, onBeforeUnmount, onMounted, watch } from 'vue';

import BigNumber from 'bignumber.js';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { SettingOutlined } from '@ant-design/icons-vue';

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
import { updateWalletBalances } from '@/shared/utils/balances';

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
        const useAdapter = inject('useAdapter');

        const { name: module } = router.currentRoute.value;

        const {
            //
            selectedSrcToken,
            selectedSrcNetwork,

            receiverAddress,
            srcAmount,

            opTitle,

            onlyWithBalance,
            selectType,
            targetDirection,

            resetTokensForModules,
        } = useServices({
            module,
            moduleType: 'send',
        });

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        // * Adapter for wallet
        const { walletAccount, walletAddress, connectedWallet, currentChainInfo, validateAddress, chainList, setChain } =
            useAdapter();

        const { createTransactions, signAndSend, transactionForSign } = useTransactions();

        const isLoading = ref(false);
        const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](module));

        const clearAddress = ref(false);
        const resetAmount = ref(false);
        const isAddressError = ref(false);
        const isBalanceError = ref(false);

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](selectedSrcNetwork.value?.net));

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
            targetDirection.value = DIRECTIONS.SOURCE;
            selectType.value = TOKEN_SELECT_TYPES.FROM;

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
            if (!network.net) {
                return;
            }
            if (selectedSrcNetwork.value?.net === network?.net) {
                return;
            }

            selectedSrcToken.value = null;
            selectedSrcNetwork.value = network;

            onSetAmount(null);

            onSetAddress(receiverAddress.value);
        };

        const onSetAmount = (value) => {
            srcAmount.value = value;

            const isBalanceAllowed = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance);

            isBalanceError.value = isBalanceAllowed;
        };

        const resetAmounts = async (amount) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) {
                return;
            }

            resetAmount.value = amount === null;

            clearAddress.value = receiverAddress.value === null;
        };

        // =================================================================================================================

        const updateTokens = (list) => {
            if (!selectedSrcToken.value) {
                return;
            }

            const fromToken = list.find((elem) => elem.symbol === selectedSrcToken.value.symbol);

            if (fromToken) {
                selectedSrcToken.value = fromToken;
            }
        };

        const handleUpdateBalance = async () => {
            await updateWalletBalances(walletAccount.value, walletAddress.value, selectedSrcNetwork.value, (list) => {
                updateTokens(list);
            });
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

                handleUpdateBalance();

                return (isLoading.value = false);
            } catch (error) {
                closeNotification('prepare-tx');
                isLoading.value = false;
                clearAddress.value = false;
            }
        };

        // =================================================================================================================

        watch(srcAmount, () => resetAmounts(srcAmount.value));

        watch(clearAddress, () => {
            if (clearAddress.value) {
                setTimeout(() => (clearAddress.value = false));
            }
        });

        watch(resetAmount, () => {
            if (resetAmount.value) {
                onSetAmount(null);
                setTimeout(() => (resetAmount.value = false));
            }
        });

        watch(selectedSrcToken, () => {
            isBalanceError.value = BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance);
        });

        watch(currentChainInfo, () => {
            if (!currentChainInfo.value) {
                return;
            }

            if (currentChainInfo.value?.net === selectedSrcNetwork.value?.net) {
                return;
            }

            selectedSrcNetwork.value = currentChainInfo.value;

            if (selectedSrcNetwork.value?.net !== currentChainInfo.value?.net) {
                resetTokensForModules();
            }
        });

        watch(receiverAddress, () => (clearAddress.value = receiverAddress.value === null));

        watch(isTokensLoadingForChain, () => resetTokensForModules());

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
            onlyWithBalance.value = true;

            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
            }

            if (!selectedSrcToken.value) {
                resetTokensForModules();
            }

            store.dispatch('txManager/setCurrentRequestID', null);
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
            srcAmount,
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
    width: 524px;

    &__btn {
        width: 100%;
    }
}
</style>
