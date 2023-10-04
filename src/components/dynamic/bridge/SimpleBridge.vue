<template>
    <div class="simple-bridge">
        <div class="select-group">
            <SelectNetwork
                label="From"
                placeholder="Select network"
                :items="srcNets"
                :current="selectedSrcNetwork"
                @select="(network) => handleOnSelectNetwork(network, DIRECTIONS.SOURCE)"
            />
            <SelectNetwork
                label="To"
                placeholder="Select network"
                :items="dstNets"
                :current="selectedDstNetwork"
                @select="(network) => handleOnSelectNetwork(network, DIRECTIONS.DESTINATION)"
            />
        </div>

        <SelectAmount
            v-if="selectedSrcNetwork"
            :value="selectedSrcToken"
            :error="!!errorBalance"
            :on-reset="resetAmount"
            :disabled="!selectedSrcToken"
            :label="$t('tokenOperations.send')"
            :is-token-loading="isTokensLoadingForSrc"
            class="mt-10"
            @setAmount="onSetAmount"
            @clickToken="onSetSrcToken"
        />

        <SelectAmount
            v-if="selectedDstNetwork"
            hide-max
            disabled
            :value="selectedDstToken"
            :is-amount-loading="isEstimating"
            :is-token-loading="isTokensLoadingForDst"
            :label="$t('tokenOperations.receive')"
            :disabled-value="prettyNumber(receiveValue)"
            :on-reset="resetAmount"
            class="mt-10"
            @clickToken="onSetDstToken"
        />

        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
        <InfoPanel v-if="successHash" :hash="successHash" :title="$t('tx.txHash')" type="success" class="mt-10" />

        <Checkbox
            v-if="selectedDstToken"
            id="receiveToken"
            v-model:value="receiveToken"
            :label="`Receive ${selectedDstToken?.symbol} to another wallet`"
            class="mt-10"
        />

        <SelectAddress
            v-if="receiveToken"
            :selected-network="selectedDstNetwork"
            :error="!!errorAddress"
            placeholder="0x..."
            class="mt-10"
            :on-reset="successHash"
            @setAddress="onSetAddress"
        />

        <Accordion
            v-if="selectedDstNetwork"
            :title="setReceiveValue"
            :hide="!receiveValue"
            :class="serviceFee ? 'mt-10' : 'mt-10 skeleton__content'"
        >
            <div v-if="receiveValue" class="accordion__content">
                <AccordionItem :label="$t('simpleBridge.serviceFee') + ' :'">
                    <span>{{ prettyNumber(networkFee * +selectedSrcToken?.price) }}</span> <span class="symbol">$</span>
                </AccordionItem>
                <AccordionItem :label="$t('simpleBridge.title') + ' :'">
                    <img src="https://app.debridge.finance/assets/images/bridge.svg" alt="service-logo" />
                    <span class="symbol">{{ services[0].name }}</span>
                </AccordionItem>
                <AccordionItem :label="$t('tokenOperations.time') + ' :'">
                    {{ estimateTime }}
                </AccordionItem>
            </div>
        </Accordion>

        <Button
            :title="$t(opTitle)"
            :disabled="!!disabledBtn"
            :loading="isLoading"
            class="simple-bridge__btn mt-10"
            @click="handleOnConfirm"
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

import { getAllowance, getApproveTx, estimateBridge, getBridgeTx, getDebridgeTxHashForOrder } from '@/api/services';

import InfoPanel from '@/components/ui/InfoPanel';

import SelectAmount from '@/components/ui/SelectAmount';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectNetwork from '@/components/ui/SelectNetwork';

import Accordion from '@/components/ui/Accordion';
import AccordionItem from '@/components/ui/AccordionItem';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';

import { toMantissa } from '@/helpers/numbers';
import { prettyNumber } from '@/helpers/prettyNumber';
import { checkErrors } from '@/helpers/checkErrors';

import { services } from '@/config/bridgeServices';
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';

export default {
    name: 'SimpleBridge',
    components: {
        InfoPanel,
        SelectAmount,
        SelectNetwork,
        SelectAddress,
        Button,
        Accordion,
        AccordionItem,
        Checkbox,
    },
    setup() {
        const {
            walletAddress,
            currentChainInfo,
            chainList,
            validateAddress,
            formatTransactionForSign,
            getTxExplorerLink,
            signSend,
            setChain,
        } = useAdapter();

        const { showNotification, closeNotification } = useNotification();

        const store = useStore();
        const router = useRouter();

        const opTitle = ref('tokenOperations.confirm');

        const isLoading = ref(false);
        const isNeedApprove = ref(false);
        const balanceUpdated = ref(false);
        const receiveToken = ref(false);
        const approveTx = ref(null);

        const txError = ref('');
        const txErrorTitle = ref('Transaction error');

        const successHash = ref('');
        const resetAmount = ref(false);
        const networkFee = ref(0);

        const isEstimating = ref(false);

        // =================================================================================================================

        const selectedService = computed({
            get: () => store.getters['bridge/service'],
            set: (value) => store.dispatch('bridge/setService', value),
        });

        // =================================================================================================================

        const selectType = computed({
            get: () => store.getters['tokenOps/selectType'],
            set: (value) => store.dispatch('tokenOps/setSelectType', value),
        });

        // =================================================================================================================

        const selectedSrcToken = computed({
            get: () => store.getters['tokenOps/srcToken'],
            set: (value) => store.dispatch('tokenOps/setSrcToken', value),
        });

        const selectedDstToken = computed({
            get: () => store.getters['tokenOps/dstToken'],
            set: (value) => store.dispatch('tokenOps/setDstToken', value),
        });

        const selectedSrcNetwork = computed({
            get: () => store.getters['tokenOps/srcNetwork'],
            set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
        });

        const selectedDstNetwork = computed({
            get: () => store.getters['tokenOps/dstNetwork'],
            set: (value) => store.dispatch('tokenOps/setDstNetwork', value),
        });

        // =================================================================================================================

        const targetDirection = computed({
            get: () => store.getters['tokenOps/direction'],
            set: (value) => store.dispatch('tokenOps/setDirection', value),
        });

        const onlyWithBalance = computed({
            get: () => store.getters['tokenOps/onlyWithBalance'],
            set: (value) => store.dispatch('tokenOps/setOnlyWithBalance', value),
        });

        // =================================================================================================================

        const receiverAddress = computed({
            get: () => store.getters['tokenOps/receiverAddress'],
            set: (value) => store.dispatch('tokenOps/setReceiverAddress', value),
        });

        // =================================================================================================================

        const amount = ref('');
        const receiveValue = ref('');
        const estimateTime = ref('');

        // =================================================================================================================

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);
        const isTokensLoadingForSrc = computed(() => store.getters['tokens/loadingByChain'](selectedSrcNetwork.value?.net));
        const isTokensLoadingForDst = computed(() => store.getters['tokens/loadingByChain'](selectedDstNetwork.value?.net));

        // =================================================================================================================

        const serviceFee = computed(() => {
            const { protocolFee = null } = selectedService.value || {};

            if (!protocolFee) {
                return;
            }

            const { chain_id } = selectedSrcNetwork.value || {};

            const fee = protocolFee[chain_id];

            if (!chain_id || !fee) {
                return;
            }

            return fee;
        });

        const setReceiveValue = computed(() => {
            const { native_token = null } = selectedSrcNetwork.value;

            if (!native_token) {
                return;
            }

            const { symbol = null } = native_token;

            const msg = () => `
                <span>Protocol Fee</span> :
                <span class='service-fee'>${serviceFee.value}</span>
                <span class='symbol'> ${symbol} ~
                    <span class='service-fee'>
                        ${prettyNumber(serviceFee.value * +selectedSrcNetwork.value.price)}
                        </span> $
                    </span>`;

            return serviceFee.value ? msg() : '';
        });

        // =================================================================================================================

        const allowance = ref(null);

        const errorAddress = ref('');
        const errorBalance = ref('');

        // =================================================================================================================

        const tokensList = computed(() => {
            const { net } = selectedSrcNetwork.value || {};

            const listFromStore = store.getters['tokens/getTokensListForChain'](net);

            return listFromStore || [];
        });

        // =================================================================================================================

        const setTokenOnChange = () => {
            const [defaultToken = null] = tokensList.value;

            if (!selectedSrcToken.value && defaultToken) {
                selectedSrcToken.value = defaultToken;
            }

            const { symbol: targetSymbol } = selectedSrcToken.value || {};

            const searchTokens = [targetSymbol];

            const updatedList = tokensList.value?.filter((tkn) => searchTokens.includes(tkn.symbol)) || [];

            if (!updatedList.length) {
                return;
            }

            const [token = null] = updatedList;

            if (token) {
                return (selectedSrcToken.value = token);
            }
        };

        // =================================================================================================================

        const setServiceFee = () => {};

        onMounted(() => {
            onlyWithBalance.value = true;

            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
            }

            if (selectedSrcNetwork.value) {
                setServiceFee();
            }

            setTokenOnChange();
        });

        // =================================================================================================================

        const srcNets = computed(() => chainList.value.filter((network) => network.net !== selectedDstNetwork?.value?.net));
        const dstNets = computed(() => chainList.value.filter((network) => network.net !== selectedSrcNetwork?.value?.net));

        // =================================================================================================================

        const disabledBtn = computed(() => {
            return (
                isLoading.value ||
                errorBalance.value ||
                !+amount.value ||
                !receiveValue.value ||
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value ||
                !selectedSrcToken.value ||
                txError.value
            );
        });

        // =================================================================================================================

        const clearApprove = () => {
            isNeedApprove.value = false;
            approveTx.value = null;
            receiveValue.value = '';
            allowance.value = null;
        };

        // =================================================================================================================

        const handleOnSelectNetwork = (network, direction) => {
            if (currentChainInfo.value.net !== selectedSrcNetwork.value.net) {
                opTitle.value = 'tokenOperations.switchNetwork';
            }

            if (direction === DIRECTIONS.SOURCE) {
                selectedSrcNetwork.value = network;
                return clearApprove();
            }

            selectedDstNetwork.value = network;

            selectedDstToken.value = null;

            return (opTitle.value = 'tokenOperations.swap');
        };

        // =================================================================================================================

        const onSetSrcToken = () => {
            onlyWithBalance.value = true;
            targetDirection.value = DIRECTIONS.SOURCE;
            selectType.value = TOKEN_SELECT_TYPES.FROM;

            router.push('/bridge/select-token');

            balanceUpdated.value = false;

            return clearApprove();
        };

        const onSetDstToken = () => {
            targetDirection.value = DIRECTIONS.DESTINATION;
            selectType.value = TOKEN_SELECT_TYPES.TO;
            onlyWithBalance.value = false;

            router.push('/bridge/select-token');

            return (balanceUpdated.value = false);
        };

        const onSetAddress = (addr) => {
            receiverAddress.value = addr;

            if (!addr.length) {
                return (errorAddress.value = '');
            }

            if (!validateAddress(addr)) {
                return (errorAddress.value = 'Invalid address');
            }

            return (errorAddress.value = '');
        };

        const onSetAmount = async (value) => {
            amount.value = value;
            txError.value = '';
            errorAddress.value = '';
            errorBalance.value = '';
            receiveValue.value = '';

            if (isNaN(amount.value)) {
                return (errorBalance.value = 'Incorrect amount');
            }

            if (!allowance.value) {
                await makeAllowanceRequest();
            }

            if (selectedSrcToken.value.address) {
                await isEnoughAllowance();
            }

            await makeEstimateBridgeRequest();

            if (+value > selectedSrcToken.value.balance || +networkFee.value > selectedSrcToken.value.balance) {
                return (errorBalance.value = 'Insufficient balance');
            }

            return (errorBalance.value = '');
        };

        // =================================================================================================================

        const isEnoughAllowance = async () => {
            if (!selectedSrcNetwork.value || !selectedSrcToken.value || !walletAddress.value) {
                return;
            }

            isLoading.value = true;

            if (allowance.value >= toMantissa(amount.value, selectedSrcToken.value?.decimals)) {
                isLoading.value = false;
                return (isNeedApprove.value = false);
            }

            isLoading.value = false;
            isNeedApprove.value = true;

            if (approveTx.value) {
                return;
            }

            return await makeApproveRequest();
        };

        // =================================================================================================================

        const makeAllowanceRequest = async () => {
            approveTx.value = null;

            isNeedApprove.value = false;

            if (!selectedSrcNetwork.value || !selectedSrcToken.value || !walletAddress.value) {
                return;
            }

            if (!selectedSrcToken.value.address) {
                return;
            }

            const response = await getAllowance({
                url: selectedService.value.url,
                net: selectedSrcNetwork.value.net,
                tokenAddress: selectedSrcToken.value.address,
                ownerAddress: walletAddress.value,
            });

            if (response.error) {
                return;
            }

            return (allowance.value = response.allowance);
        };

        // =================================================================================================================

        const makeApproveRequest = async () => {
            if (!selectedSrcNetwork.value || !selectedSrcToken.value || !walletAddress.value) {
                return;
            }

            if (!selectedSrcToken.value.address) {
                return;
            }

            const response = await getApproveTx({
                url: selectedService.value.url,
                net: selectedSrcNetwork.value.net,
                tokenAddress: selectedSrcToken.value.address,
                ownerAddress: walletAddress.value,
            });

            // opTitle.value = 'tokenOperations.approve';

            if (response.error) {
                return;
            }

            approveTx.value = response;

            isLoading.value = false;

            return (isNeedApprove.value = true);
        };

        // =================================================================================================================

        const makeEstimateBridgeRequest = async () => {
            if (
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstToken.value ||
                !+amount.value
            ) {
                return;
            }

            isEstimating.value = true;

            const response = await estimateBridge({
                url: selectedService.value.url,
                fromNet: selectedSrcNetwork.value.net,
                toNet: selectedDstNetwork.value.net,
                fromTokenAddress: selectedSrcToken.value.address,
                toTokenAddress: selectedDstToken.value.address,
                amount: amount.value,
                ownerAddress: walletAddress.value,
            });

            if (response.error) {
                isEstimating.value = false;
                txError.value = response.error;
                txErrorTitle.value = 'Estimate error';
                return (isEstimating.value = false);
            }

            isEstimating.value = false;

            receiveValue.value = response.toTokenAmount;

            // TODO: add fee
            isEstimating.value = false;

            receiveValue.value = response.toTokenAmount;

            networkFee.value = +response.fee.amount;

            estimateTime.value =
                '< ' +
                Math.round(services[0]?.estimatedTime[selectedSrcNetwork?.value?.chain_id || selectedSrcNetwork?.value?.chainId] / 60) +
                ' min';
        };

        // =================================================================================================================

        const isCorrectChain = async () => {
            if (currentChainInfo.value.net === selectedSrcNetwork.value.net) {
                opTitle.value = 'tokenOperations.confirm';
                return true;
            }

            opTitle.value = 'tokenOperations.switchNetwork';

            showNotification({
                key: 'switch-network',
                type: 'info',
                title: `Switch network to ${selectedSrcNetwork.value.name}`,
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                await setChain(selectedSrcNetwork.value);
                closeNotification('switch-network');
                return true;
            } catch (error) {
                txError.value = error.message || error.error || error;
                opTitle.value = 'tokenOperations.switchNetwork';
                closeNotification('switch-network');
                return false;
            }
        };

        // =================================================================================================================

        const sendTransaction = async (transaction) => {
            try {
                const tx = formatTransactionForSign(transaction);

                const signedTx = await signSend(tx);

                return signedTx;
            } catch (e) {
                return checkErrors(e);
            }
        };

        // =================================================================================================================

        const makeApproveTx = async () => {
            showNotification({
                key: 'approve-tx',
                type: 'info',
                title: `Getting Approve for ${selectedSrcToken.value.symbol}`,
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const responseSendTx = await sendTransaction({ ...approveTx.value, from: walletAddress.value });

                if (responseSendTx.error) {
                    txErrorTitle.value = 'Approve transaction error';
                    txError.value = responseSendTx.error;
                    closeNotification('approve-tx');
                    return (isLoading.value = false);
                }

                approveTx.value = null;

                isNeedApprove.value = false;

                successHash.value = getTxExplorerLink(responseSendTx.transactionHash, currentChainInfo.value);

                closeNotification('approve-tx');

                await makeAllowanceRequest();
                await isEnoughAllowance();

                return (resetAmount.value = false);
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================
        const makeBridgeTx = async () => {
            showNotification({
                key: 'prepare-tx',
                type: 'info',
                title: `Bridge ${amount.value} ${selectedSrcToken.value.symbol} to ~${receiveValue.value} ${selectedDstToken.value.symbol}`,
                description: 'Please wait, transaction is preparing',
                icon: h(LoadingOutlined, {
                    spin: true,
                }),
                duration: 0,
            });

            try {
                const response = await getBridgeTx({
                    url: selectedService.value.url,
                    fromNet: selectedSrcNetwork.value.net,
                    fromTokenAddress: selectedSrcToken.value.address,
                    amount: amount.value,
                    toNet: selectedDstNetwork.value.net,
                    toTokenAddress: selectedDstToken.value.address,
                    recipientAddress: receiverAddress.value || walletAddress.value,
                    fallbackAddress: walletAddress.value,
                    ownerAddress: walletAddress.value,
                });

                if (response.error) {
                    txError.value = response.error;
                    txErrorTitle.value = 'Bridge transaction error';
                    return (isLoading.value = false);
                }

                return response;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        const handleOnConfirm = async () => {
            if (disabledBtn.value) {
                return;
            }

            isLoading.value = true;

            const isCorrect = await isCorrectChain();

            if (!isCorrect) {
                isLoading.value = false;

                closeNotification('switch-network');

                return (opTitle.value = 'tokenOperations.switchNetwork');
            }

            if (approveTx.value) {
                opTitle.value = 'tokenOperations.approve';
                await makeApproveTx();
            }

            if (approveTx.value) {
                return (isLoading.value = false);
            }

            opTitle.value = 'tokenOperations.confirm';

            const responseBridge = await makeBridgeTx();

            if (!responseBridge) {
                return (isLoading.value = false);
            }

            try {
                const responseSendTx = await sendTransaction(responseBridge);

                if (responseSendTx.error) {
                    txError.value = responseSendTx.error;
                    txErrorTitle.value = 'Sign transaction error';
                    return (isLoading.value = false);
                }

                successHash.value = getTxExplorerLink(responseSendTx.transactionHash, currentChainInfo.value);

                if (selectedService.value.id === 'bridge-debridge') {
                    const hash = await getDebridgeTxHashForOrder(responseSendTx.transactionHash);

                    if (hash) {
                        successHash.value = getTxExplorerLink(hash.dstHash, selectedDstNetwork.value);
                    }
                }

                isLoading.value = false;
                resetAmount.value = true;

                store.dispatch('tokens/updateTokenBalances', {
                    net: selectedSrcNetwork.value.net,
                    address: walletAddress.value,
                    info: selectedSrcNetwork.value,
                    update(wallet) {
                        selectedSrcNetwork.value = wallet;
                    },
                });

                store.dispatch('tokens/updateTokenBalances', {
                    net: selectedDstNetwork.value.net,
                    address: walletAddress.value,
                    info: selectedDstNetwork.value,
                    update(wallet) {
                        selectedDstNetwork.value = wallet;
                    },
                });

                balanceUpdated.value = true;
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        watch(isAllTokensLoading, () => setTokenOnChange());
        watch(isTokensLoadingForSrc, () => setTokenOnChange());

        watch(selectedSrcNetwork, (newValue, oldValue) => {
            if (newValue?.net !== oldValue?.net) {
                selectedSrcToken.value = null;
                setTokenOnChange();
            }
        });

        watch(selectedSrcToken, async () => {
            if (!selectedSrcToken.value) {
                return;
            }

            await makeAllowanceRequest();
        });

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

        // =================================================================================================================

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/bridge/select-token') {
                targetDirection.value = DIRECTIONS.SOURCE;
                selectedSrcNetwork.value = null;
                selectedSrcToken.value = null;
                selectedDstNetwork.value = null;
                selectedDstToken.value = null;
                receiverAddress.value = '';
            }
        });

        return {
            // Loading
            isLoading,
            isEstimating,
            isAllTokensLoading,
            isTokensLoadingForSrc,
            isTokensLoadingForDst,

            disabledBtn,
            isNeedApprove,
            resetAmount,
            receiveToken,
            receiveValue,

            chainList,

            DIRECTIONS,
            opTitle,

            srcNets,
            dstNets,

            services,

            errorAddress,
            errorBalance,

            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            amount,
            estimateTime,
            serviceFee,
            txError,
            successHash,
            prettyNumber,
            walletAddress,
            currentChainInfo,
            networkFee,
            setReceiveValue,

            // Handlers
            handleOnSelectNetwork,
            onSetAddress,
            onSetSrcToken,
            onSetDstToken,
            onSetAmount,
            handleOnConfirm,
        };
    },
};
</script>
<style lang="scss">
.simple-bridge {
    width: 660px;

    .mt-10 {
        margin-top: 10px;
    }

    .select-group {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .select {
            width: 48%;

            .name {
                font-size: var(--#{$prefix}h6-fs);
                line-height: 16px;
            }
        }
    }

    .accordion__content {
        img {
            width: 16px;
            height: 16px;
        }
        .symbol {
            margin-left: 5px;
        }
    }

    .accordion__title {
        .service-fee {
            font-weight: 600;
            color: var(--#{$prefix}sub-text);
        }
        .symbol {
            font-weight: 600;
        }
    }

    &__btn {
        height: 64px;
        width: 100%;
    }

    .skeleton {
        animation: skeleton-loading 1s linear infinite alternate;

        &__content {
            .accordion__title {
                display: flex;
                width: 100%;
            }
        }

        &__text {
            width: 80%;
            height: 0.5rem;
            margin: 8px 0 0 8px;
            border-radius: 2px;
        }
    }

    @keyframes skeleton-loading {
        0% {
            background-color: hsl(200, 20%, 80%);
        }

        100% {
            background-color: hsl(200, 20%, 95%);
        }
    }
}
</style>
