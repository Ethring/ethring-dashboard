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
            :error="!!isBalanceError"
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

        <Accordion v-if="receiveValue || estimateErrorTitle" :hide="!receiveValue" class="mt-10">
            <template #header>
                <div v-if="!estimateErrorTitle" class="accordion__title">
                    <div v-html="setReceiveValue"></div>
                </div>

                <a-tooltip v-else class="accordion__title">
                    <template #title>{{ estimateErrorTitle }}</template>
                    {{ $t('tokenOperations.routeInfo') }}:
                    <span class="route-info-title">{{ estimateErrorTitle }}</span>
                </a-tooltip>
            </template>

            <template #content>
                <div class="accordion__content">
                    <AccordionItem :label="$t('simpleBridge.serviceFee') + ' :'">
                        <span>{{ networkFee }}</span> <span class="symbol">$</span>
                    </AccordionItem>
                    <AccordionItem :label="$t('simpleBridge.title') + ' :'">
                        <img :src="selectedService.icon" alt="service-logo" />
                        <span class="symbol">{{ services[0].name }}</span>
                    </AccordionItem>
                    <AccordionItem :label="$t('tokenOperations.time') + ' :'">
                        {{ estimateTime }}
                    </AccordionItem>
                </div>
            </template>
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
import useTokensList from '@/compositions/useTokensList';
import useNotification from '@/compositions/useNotification';

import { getAllowance, getApproveTx, estimateBridge, getBridgeTx, getDebridgeTxHashForOrder } from '@/api/services';

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

import { getServices, SERVICE_TYPE } from '@/config/services';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { isCorrectChain } from '@/shared/utils/operations';

import { updateWalletBalances } from '@/shared/utils/balances';

export default {
    name: 'SimpleBridge',
    components: {
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
            walletAccount,
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
        const estimateErrorTitle = ref('');

        const successHash = ref('');
        const resetAmount = ref(false);
        const networkFee = ref(0);

        const isEstimating = ref(false);

        const services = getServices(SERVICE_TYPE.BRIDGE);

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
        const isBalanceError = ref(false);

        // =================================================================================================================

        const { getTokensList } = useTokensList();

        const tokensList = ref([]);

        // =================================================================================================================

        const setTokenOnChange = () => {
            tokensList.value = getTokensList({
                srcNet: selectedSrcNetwork.value,
            });

            const [defaultToken = null] = tokensList.value;

            if (!selectedSrcToken.value && defaultToken) {
                selectedSrcToken.value = defaultToken;
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

        const NOT_SUPPORT = ['fantom', 'optimism'];

        const srcNets = computed(() =>
            chainList.value.filter((network) => network.net !== selectedDstNetwork?.value?.net && !NOT_SUPPORT.includes(network.net))
        );
        const dstNets = computed(() =>
            chainList.value.filter((network) => network.net !== selectedSrcNetwork?.value?.net && !NOT_SUPPORT.includes(network.net))
        );

        // =================================================================================================================

        const disabledBtn = computed(() => {
            return (
                isLoading.value ||
                isBalanceError.value ||
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

            isEstimating.value = false;

            resetAmount.value = true;

            estimateErrorTitle.value = '';

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

            if (!validateAddress(addr, { chainId: selectedDstNetwork?.value?.net })) {
                return (errorAddress.value = 'Invalid address');
            }

            return (errorAddress.value = '');
        };

        const onSetAmount = async (value) => {
            amount.value = value;
            txError.value = '';
            errorAddress.value = '';
            receiveValue.value = '';

            if (!selectedSrcToken.value) {
                return;
            }

            if (!allowance.value) {
                await makeAllowanceRequest();
            }

            if (selectedSrcToken.value && selectedSrcToken.value.address) {
                await isEnoughAllowance();
            }

            await makeEstimateBridgeRequest();

            const isBalanceAllowed = +value > selectedSrcToken.value?.balance || +networkFee.value > selectedSrcToken.value.balance;

            isBalanceError.value = isBalanceAllowed;
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

            if (!selectedSrcToken.value && !selectedSrcToken.value.address) {
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
                estimateErrorTitle.value = response.error;
                return (isEstimating.value = false);
            }

            isEstimating.value = false;

            receiveValue.value = response.toTokenAmount;

            estimateErrorTitle.value = '';

            // TODO: add fee
            isEstimating.value = false;

            receiveValue.value = response.toTokenAmount;

            const { native_token } = selectedSrcNetwork.value || {};

            const { price = 0 } = native_token || {};

            networkFee.value = prettyNumber(+response.fee.amount * price, 4);

            estimateTime.value =
                '< ' +
                Math.round(services[0]?.estimatedTime[selectedSrcNetwork?.value?.chain_id || selectedSrcNetwork?.value?.chainId] / 60) +
                ' min';
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

            const { isChanged, btnTitle } = await isCorrectChain(selectedSrcNetwork, currentChainInfo, setChain);

            opTitle.value = btnTitle;

            if (!isChanged) {
                return (isLoading.value = false);
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

                setTimeout(() => {
                    updateWalletBalances(walletAccount.value, walletAddress.value, selectedSrcNetwork.value, (list) => {
                        const fromToken = list.find((elem) => elem.symbol === selectedSrcToken.value.symbol);
                        if (fromToken) {
                            selectedSrcToken.value = fromToken;
                        }
                    });

                    updateWalletBalances(walletAccount.value, walletAddress.value, selectedDstNetwork.value, (list) => {
                        const toToken = list.find((elem) => elem.symbol === selectedDstToken.value.symbol);
                        if (toToken) {
                            selectedDstToken.value = toToken;
                        }
                    });
                }, 7000);
            } catch (error) {
                txError.value = error?.message || error?.error || error;
            }
        };

        // =================================================================================================================

        watch(isAllTokensLoading, () => setTokenOnChange());

        watch(walletAccount, () => {
            selectedSrcNetwork.value = currentChainInfo.value;

            selectedSrcToken.value = null;
            selectedDstToken.value = null;

            setTokenOnChange();
        });

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
            isBalanceError,

            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            amount,
            estimateTime,
            serviceFee,
            txError,
            estimateErrorTitle,
            successHash,
            prettyNumber,
            walletAddress,
            currentChainInfo,
            networkFee,
            setReceiveValue,
            selectedService,

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
                line-height: 26px;
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
        display: flex;
        align-items: center;

        font-weight: 400;
        color: var(--zmt-accordion-label-color);
        font-size: var(--zmt-default-fs);

        .symbol {
            font-weight: 600;
        }

        .service-fee {
            font-weight: 600;
            color: var(--#{$prefix}sub-text);
        }

        .route-info-title {
            color: var(--#{$prefix}warning);
            font-weight: 500;
            line-height: 20px;
            opacity: 0.8;

            display: inline;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            width: 500px;
            margin-left: 4px;
        }
    }

    &__btn {
        height: 64px;
        width: 100%;
    }
}
</style>
