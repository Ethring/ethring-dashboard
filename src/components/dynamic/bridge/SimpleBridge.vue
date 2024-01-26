<template>
    <a-form class="simple-bridge">
        <a-form-item>
            <div class="select-network-group">
                <SelectNetwork
                    :current="selectedSrcNetwork"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    @click="() => onSelectNetwork(DIRECTIONS.SOURCE)"
                />

                <SwitchDirection :disabled="!isUpdateSwapDirection || !selectedDstNetwork" @click="() => swapDirections(true)" />

                <SelectNetwork
                    :current="selectedDstNetwork"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    class="select-group-to"
                    @click="() => onSelectNetwork(DIRECTIONS.DESTINATION)"
                />
            </div>
        </a-form-item>

        <SelectAmountInput
            :value="selectedSrcToken"
            :error="!!isBalanceError"
            :on-reset="resetSrcAmount"
            :disabled="!selectedSrcToken"
            :label="$t('tokenOperations.transferFrom')"
            :is-token-loading="isTokensLoadingForSrc"
            :is-update="isUpdateSwapDirection"
            :amount-value="srcAmount"
            class="mt-8"
            @setAmount="onSetAmount"
            @clickToken="onSelectToken(true, DIRECTIONS.SOURCE)"
        />

        <SelectAmountInput
            v-if="selectedDstNetwork"
            hide-max
            disabled
            :value="selectedDstToken"
            :is-amount-loading="isEstimating"
            :is-token-loading="isTokensLoadingForDst"
            :is-update="isUpdateSwapDirection"
            :label="$t('tokenOperations.transferTo')"
            :disabled-value="dstAmount"
            :on-reset="resetDstAmount"
            :amount-value="dstAmount"
            class="mt-8"
            @clickToken="onSelectToken(false, DIRECTIONS.DESTINATION)"
        />

        <Checkbox
            v-if="selectedDstToken && selectedDstNetwork"
            id="isSendToAnotherAddress"
            v-model:value="isSendToAnotherAddress"
            :label="`Receive ${selectedDstToken?.symbol} to another wallet`"
            class="mt-8"
        />

        <SelectAddressInput
            v-if="isSendToAnotherAddress && selectedDstNetwork && selectedDstToken"
            class="mt-8"
            :selected-network="selectedDstNetwork"
            :on-reset="isSendToAnotherAddress"
            @error-status="(status) => (isAddressError = status)"
        />

        <EstimateInfo
            v-if="isShowEstimateInfo"
            :loading="isEstimating"
            :service="selectedService"
            :title="$t('tokenOperations.routeInfo')"
            :main-fee="rateFeeInfo"
            :fees="[protocolFeeInfo, baseFeeInfo, estimateTimeInfo]"
            :error="estimateErrorTitle"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledBtn"
            :loading="isWaitingTxStatusForModule || isLoading"
            :tip="$t(opTitle)"
            class="module-layout-view-btn"
            @click="handleOnConfirm"
            size="large"
        />
    </a-form>
</template>
<script>
import { h, ref, inject, watch, computed } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { SettingOutlined } from '@ant-design/icons-vue';

// Notification
import useNotification from '@/compositions/useNotification';
import useServices from '../../../compositions/useServices';

// Transaction Management
import useTransactions from '../../../Transactions/compositions/useTransactions';
import { STATUSES } from '../../../Transactions/shared/constants';

import {
    getBridgeTx,
    cancelRequestByMethod,
    // getDebridgeTxHashForOrder
} from '@/api/services';

// import SelectAmount from '@/components/ui/SelectAmount';
import SelectNetwork from '@/components/ui/Select/SelectNetwork';

import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import SelectAmountInput from '@/components/ui/Select/SelectAmountInput';

import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import EstimateInfo from '@/components/ui/EstimateInfo.vue';

import SwitchDirection from '@/components/ui/SwitchDirection.vue';

import { formatNumber } from '@/helpers/prettyNumber';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { isCorrectChain } from '@/shared/utils/operations';

import { updateWalletBalances } from '@/shared/utils/balances';

export default {
    name: 'SimpleBridge',
    components: {
        SelectNetwork,
        SelectAmountInput,
        SelectAddressInput,
        Button,
        Checkbox,
        EstimateInfo,
        SwitchDirection,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const useAdapter = inject('useAdapter');

        const { name: module } = router.currentRoute.value;

        const isAddressError = ref(false);

        // * Notification
        const { showNotification, closeNotification } = useNotification();

        const { walletAccount, walletAddress, currentChainInfo, chainList, setChain } = useAdapter();

        // * Transaction Manager
        const { currentRequestID, transactionForSign, createTransactions, signAndSend, addTransactionToRequestID } = useTransactions();

        // =================================================================================================================

        const selectedService = computed({
            get: () => store.getters['bridge/service'],
            set: (value) => store.dispatch('bridge/setService', value),
        });

        // =================================================================================================================
        // * Module values
        const {
            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,
            selectedDstNetwork,

            onlyWithBalance,
            isUpdateSwapDirection,

            srcAmount,
            dstAmount,

            srcTokenApprove,

            receiverAddress,
            addressesByChains,

            txError,
            txErrorTitle,
            estimateErrorTitle,
            isBalanceError,

            opTitle,

            baseFeeInfo,
            rateFeeInfo,
            estimateTimeInfo,
            protocolFeeInfo,

            isNeedApprove,
            isEstimating,
            isLoading,
            isShowEstimateInfo,

            swapDirections,

            clearApproveForService,

            handleOnSelectToken,
            handleOnSelectNetwork,

            makeApproveRequest,
            makeEstimateRequest,
        } = useServices({
            selectedService: selectedService.value,
            module,
            moduleType: 'bridge',
        });

        // =================================================================================================================
        // Loaders

        const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](module));

        const clearAddress = ref(false);
        const balanceUpdated = ref(false);
        const isSendToAnotherAddress = ref(false);

        const resetSrcAmount = ref(false);
        const resetDstAmount = ref(false);

        // =================================================================================================================

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);
        const isTokensLoadingForSrc = computed(() => store.getters['tokens/loadingByChain'](selectedSrcNetwork.value?.net));
        const isTokensLoadingForDst = computed(() => store.getters['tokens/loadingByChain'](selectedDstNetwork.value?.net));

        // =================================================================================================================

        const disabledBtn = computed(
            () =>
                isLoading.value ||
                isBalanceError.value ||
                isWaitingTxStatusForModule.value ||
                !+srcAmount.value ||
                !dstAmount.value ||
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstNetwork.value ||
                !selectedDstToken.value ||
                (isSendToAnotherAddress.value && (isAddressError.value || !receiverAddress.value))
        );

        // =================================================================================================================

        const onSelectNetwork = (direction) => {
            return handleOnSelectNetwork({
                direction: DIRECTIONS[direction],
            });
        };

        // =================================================================================================================

        const onSelectToken = (withBalance = false, direction = DIRECTIONS.SOURCE) => {
            onlyWithBalance.value = withBalance;

            handleOnSelectToken({
                direction: DIRECTIONS[direction],
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

            clearAddress.value = receiverAddress.value === null;

            if (clearAddress.value) {
                setTimeout(() => (clearAddress.value = false));
            }
        };

        const onSetAmount = async (value) => {
            srcAmount.value = value;
            txError.value = '';
            dstAmount.value = '';

            return await makeEstimateRequest();
        };

        // =================================================================================================================
        const makeBridgeTx = async () => {
            if (cancelRequestByMethod) {
                await cancelRequestByMethod('getBridgeTx');
            }

            showNotification({
                key: 'prepare-tx',
                type: 'info',
                title: `Bridge ${srcAmount.value} ${selectedSrcToken.value.symbol} to ~${dstAmount.value} ${selectedDstToken.value.symbol}`,
                description: 'Please wait, transaction is preparing',
                icon: h(SettingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const params = {
                    url: selectedService.value.url,
                    fromNet: selectedSrcNetwork.value.net,
                    fromTokenAddress: selectedSrcToken.value.address,
                    amount: srcAmount.value,
                    toNet: selectedDstNetwork.value.net,
                    toTokenAddress: selectedDstToken.value.address,
                };

                const addresses = JSON.parse(JSON.stringify(addressesByChains.value || {}));

                if (receiverAddress.value && receiverAddress.value !== '' && isSendToAnotherAddress.value) {
                    params.recipientAddress = receiverAddress.value;
                    addresses[selectedDstNetwork.value?.net] = receiverAddress.value;
                }

                if (selectedService.value.id === 'bridge-skip') {
                    params.ownerAddresses = JSON.stringify(addresses);
                } else {
                    params.ownerAddress = walletAddress.value;
                    params.recipientAddress = receiverAddress.value || walletAddress.value;
                    params.fallbackAddress = walletAddress.value;
                }

                const response = await getBridgeTx(params);

                if (response.error) {
                    txError.value = response?.error || response;
                    txErrorTitle.value = 'Bridge transaction error';
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
            opTitle.value = 'tokenOperations.approve';

            await makeApproveRequest(selectedService.value);

            if (!srcTokenApprove.value) {
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
                            url: selectedService.value.url,
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

        // =================================================================================================================

        const handleBridge = async () => {
            opTitle.value = 'tokenOperations.confirm';

            const responseBridge = await makeBridgeTx();

            if (!responseBridge) {
                return (isLoading.value = false);
            }

            const txToSave = {
                ecosystem: selectedSrcNetwork.value.ecosystem,
                module,
                status: STATUSES.IN_PROGRESS,
                parameters: responseBridge,
                account: walletAddress.value,
                chainId: `${selectedSrcNetwork.value?.chain_id}`,
                metaData: {
                    action: 'formatTransactionForSign',
                    type: 'BRIDGE',
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

        const handleUpdateBalance = (network, targetDirection = 'SrcNetwork') => {
            const isSrc = targetDirection === 'SrcNetwork';

            const selectedToken = isSrc ? selectedSrcToken.value : selectedDstToken.value;

            const targetAddress = addressesByChains.value[network.net] || walletAddress.value;

            updateWalletBalances(walletAccount.value, targetAddress, network, (list) => {
                const token = list.find((elem) => elem.symbol === selectedToken.symbol);
                if (!token) {
                    return;
                }

                if (isSrc && selectedSrcToken.value?.id === token.id) {
                    selectedSrcToken.value = token;
                }

                if (!isSrc && selectedDstToken.value?.id === token.id) {
                    selectedDstToken.value = token;
                }
            });
        };

        // =================================================================================================================

        const handleOnConfirm = async () => {
            isLoading.value = true;
            txError.value = '';

            const { isChanged, btnTitle } = await isCorrectChain(selectedSrcNetwork, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                return (isLoading.value = false);
            }

            opTitle.value = 'tokenOperations.confirm';

            if (isNeedApprove.value) {
                await handleApprove();
            } else {
                await handleBridge();
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
                    return (isLoading.value = false);
                }

                // if (selectedService.value.id === 'bridge-debridge') {
                //     await delay(1000);
                //     const hash = await getDebridgeTxHashForOrder(responseSendTx.transactionHash);

                //     if (hash) {
                //         // successHash.value = getTxExplorerLink(hash.dstHash, selectedDstNetwork.value);
                //     }
                // }

                isLoading.value = false;
                balanceUpdated.value = true;

                handleUpdateBalance(selectedSrcNetwork.value, 'SrcNetwork');
                handleUpdateBalance(selectedDstNetwork.value, 'DstNetwork');

                balanceUpdated.value = true;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        watch(txError, (err) => {
            if (!err) {
                return;
            }

            isLoading.value = false;

            showNotification({
                key: 'error-tx',
                type: 'error',
                title: txErrorTitle.value,
                description: JSON.stringify(txError.value || 'Unknown error'),
                duration: 5,
            });

            closeNotification('prepare-tx');
        });

        watch(srcAmount, () => resetAmounts(DIRECTIONS.SOURCE, srcAmount.value));

        watch(dstAmount, () => resetAmounts(DIRECTIONS.DESTINATION, dstAmount.value));

        watch(isWaitingTxStatusForModule, () => {
            if (!isWaitingTxStatusForModule.value) {
                selectedSrcNetwork.value && handleUpdateBalance(selectedSrcNetwork.value, 'SrcNetwork');
                selectedDstNetwork.value && handleUpdateBalance(selectedDstNetwork.value, 'DstNetwork');
            }
        });

        return {
            // Loading
            isLoading,
            isEstimating,
            isAllTokensLoading,
            isTokensLoadingForSrc,
            isTokensLoadingForDst,
            isWaitingTxStatusForModule,

            disabledBtn,

            resetSrcAmount,
            resetDstAmount,

            isSendToAnotherAddress,
            isUpdateSwapDirection,

            chainList,

            DIRECTIONS,
            opTitle,

            srcAmount,
            dstAmount,

            isAddressError,
            isBalanceError,

            receiverAddress,
            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            isShowEstimateInfo,

            // Information for accordion
            protocolFeeInfo,
            baseFeeInfo,
            rateFeeInfo,
            estimateTimeInfo,

            txError,
            estimateErrorTitle,
            clearAddress,

            formatNumber,
            walletAddress,
            currentChainInfo,
            selectedService,

            // Handlers
            onSelectToken,
            onSelectNetwork,

            onSetAmount,
            handleOnConfirm,
            swapDirections,
        };
    },
};
</script>
