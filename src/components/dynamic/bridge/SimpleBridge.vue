<template>
    <div class="simple-bridge">
        <div class="select-group">
            <SelectNetwork
                :items="zometNetworks"
                :current="selectedSrcNetwork || currentChainInfo"
                @select="onSelectSrcNetwork"
                label="From"
                placeholder="Select network"
            />
            <SelectNetwork
                :items="activeSupportedChains"
                :current="selectedDstNetwork"
                @select="onSelectDstNetwork"
                label="To"
                placeholder="Select network"
            />
        </div>

        <SelectAmount
            v-if="selectedSrcNetwork"
            :value="selectedSrcToken"
            :error="!!errorBalance"
            :label="$t('tokenOperations.send')"
            :on-reset="resetAmount"
            :disabled="!selectedSrcToken"
            class="mt-10"
            @setAmount="onSetAmount"
            @clickToken="onSetSrcToken"
        />

        <SelectAmount
            v-if="selectedDstNetwork"
            :value="selectedDstToken"
            :label="$t('tokenOperations.receive')"
            :disabled-value="prettyNumber(receiveValue)"
            :disabled="true"
            :on-reset="resetAmount"
            class="mt-10"
            @clickToken="onSetDstToken"
            hide-max
        />

        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
        <InfoPanel v-if="networkError" :title="$t('tokenOperations.changeNetwork')" class="mt-10" />
        <InfoPanel v-if="successHash" :hash="successHash" :title="$t('tx.txHash')" type="success" class="mt-10" />

        <Checkbox
            v-if="selectedDstToken"
            id="receiveToken"
            v-model:value="receiveToken"
            :label="`Receive ${selectedDstToken?.code} to another wallet`"
            class="mt-10"
        >
        </Checkbox>

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
                    <span>{{ prettyNumber(networkFee * +selectedSrcToken?.latest_price) }}</span> <span class="symbol">$</span>
                </AccordionItem>
                <AccordionItem :label="$t('simpleBridge.title') + ' :'">
                    <img src="https://app.debridge.finance/assets/images/bridge.svg" />
                    <span class="symbol">{{ services[0].name }}</span>
                </AccordionItem>
                <AccordionItem :label="$t('tokenOperations.time') + ' :'">
                    {{ estimateTime }}
                </AccordionItem>
            </div>
        </Accordion>
        <Button
            :title="needApprove ? $t('tokenOperations.approve') : $t('tokenOperations.confirm').toUpperCase()"
            :disabled="!!disabledBtn"
            :loading="isLoading"
            class="simple-bridge__btn mt-10"
            @click="swap"
            size="large"
        />
    </div>
</template>
<script>
import axios from 'axios';

import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ethers } from 'ethers';

import useAdapter from '@/Adapter/compositions/useAdapter';

import InfoPanel from '@/components/ui/InfoPanel';
import SelectAmount from '@/components/ui/SelectAmount';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectNetwork from '@/components/dynamic/bridge/SelectNetwork';
import Accordion from '@/components/ui/Accordion';
import AccordionItem from '@/components/ui/AccordionItem';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';

import { toMantissa } from '@/helpers/numbers';
import { prettyNumber } from '@/helpers/prettyNumber';
import { getTxUrl, delay } from '@/helpers/utils';
import { checkErrors } from '@/helpers/checkErrors';

import { services } from '@/config/bridgeServices';
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '../../../shared/constants/operations';

const NATIVE_CONTRACT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

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
            connectedWallet,
            // setChain
        } = useAdapter();

        const store = useStore();
        const router = useRouter();

        const isLoading = ref(false);
        const needApprove = ref(false);
        const balanceUpdated = ref(false);
        const receiveToken = ref(false);
        const approveTx = ref(null);
        const txError = ref('');
        const successHash = ref('');
        const networkError = ref(false);
        const resetAmount = ref(false);
        const networkFee = ref(0);

        const zometNetworks = computed(() => store.getters['networks/zometNetworksList']);

        // =================================================================================================================

        const selectType = computed({
            get: () => store.getters['tokenOps/selectType'],
            set: (value) => store.dispatch('tokenOps/setSelectType', value),
        });

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

        const targetDirection = computed({
            get: () => store.getters['tokenOps/direction'],
            set: (value) => store.dispatch('tokenOps/setDirection', value),
        });

        const onlyWithBalance = computed({
            get: () => store.getters['tokenOps/onlyWithBalance'],
            set: (value) => store.dispatch('tokenOps/setOnlyWithBalance', value),
        });

        // =================================================================================================================

        const amount = ref('');
        const receiveValue = ref('');
        const address = ref('');
        const estimateTime = ref('');
        const serviceFee = ref('');
        const allowance = ref(null);
        const setReceiveValue = ref('');

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
            console.log('setTokenOnChange', tokensList.value, selectedSrcToken.value);
            const [defaultToken = null] = tokensList.value || [];

            if (!selectedSrcToken.value && defaultToken) {
                selectedSrcToken.value = defaultToken;
            }
            const { code: targetCode } = selectedSrcToken.value || {};

            const searchTokens = [targetCode];

            const updatedList = tokensList.value?.filter((tkn) => searchTokens.includes(tkn.code)) || [];

            if (!updatedList.length) {
                return;
            }

            const [token = null] = updatedList;

            if (token) {
                return (selectedSrcToken.value = token);
            }
        };

        // =================================================================================================================

        onMounted(() => {
            onlyWithBalance.value = true;

            if (!selectedSrcNetwork.value) {
                selectedSrcNetwork.value = currentChainInfo.value;
            }

            if (selectedSrcNetwork.value) {
                serviceFee.value = services[0]?.protocolFee[selectedSrcNetwork?.value?.chain_id || selectedSrcNetwork?.value?.chainId];
                setReceiveValue.value = selectedSrcNetwork.value
                    ? `<span>Protocol Fee</span> : ${
                          serviceFee.value
                              ? `<span class='service-fee'>${serviceFee.value}</span>
                        <span class='symbol'> ${selectedSrcNetwork.value.code || selectedSrcNetwork.value?.nativeCurrency?.symbol} ~
                        <span class='service-fee'> ${prettyNumber(
                            serviceFee.value * +selectedSrcNetwork.value.latest_price
                        )}</span> $ </span>`
                              : `<div class='skeleton skeleton__text'></div>`
                      }`
                    : `<div class='skeleton skeleton__text'></div>`;
            }

            setTokenOnChange();
        });

        watch(selectedSrcToken, async () => {
            if (selectedSrcToken.value) {
                await getAllowance();
            }
        });

        // =================================================================================================================

        const activeSupportedChains = computed(() => {
            return zometNetworks.value.filter((token) => token.net !== selectedSrcNetwork?.value?.net);
        });

        const disabledBtn = computed(() => {
            return (
                isLoading.value ||
                errorBalance.value ||
                !+amount.value ||
                !receiveValue.value ||
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value ||
                !selectedSrcToken.value ||
                txError.value ||
                networkError.value
            );
        });

        const clearApprove = () => {
            needApprove.value = false;
            approveTx.value = null;
            receiveValue.value = '';
            allowance.value = null;
        };

        // =================================================================================================================

        const onSelectSrcNetwork = (network) => {
            selectedSrcNetwork.value = network;
            clearApprove();
        };

        const onSelectDstNetwork = (network) => {
            selectedDstNetwork.value = network;
        };

        const onSetSrcToken = () => {
            onlyWithBalance.value = true;
            targetDirection.value = DIRECTIONS.SOURCE;
            selectType.value = TOKEN_SELECT_TYPES.FROM;

            router.push('/bridge/select-token');

            balanceUpdated.value = false;

            clearApprove();
        };

        const onSetDstToken = () => {
            targetDirection.value = DIRECTIONS.DESTINATION;
            selectType.value = TOKEN_SELECT_TYPES.TO;
            onlyWithBalance.value = false;

            router.push('/bridge/select-token');

            balanceUpdated.value = false;

            clearApprove();

            onSetAmount(amount.value);
        };

        const onSetAddress = (addr) => {
            const reg = new RegExp(selectedDstNetwork.value.validating);
            address.value = addr;

            if (address.value.length && !reg.test(addr)) {
                errorAddress.value = 'Invalid address';
                return;
            }
            errorAddress.value = '';
        };

        const onSetAmount = async (value) => {
            if (isNaN(+value)) {
                errorBalance.value = 'Incorrect amount';
                return;
            }

            if (!+value) {
                return;
            }

            receiveValue.value = '';
            amount.value = value;

            if (
                +value > selectedSrcToken.value.balance ||
                +networkFee.value > selectedSrcToken.value.balance ||
                !Object.prototype.hasOwnProperty.call(selectedSrcToken.value, 'balance')
            ) {
                errorBalance.value = 'Insufficient balance';
            } else {
                errorBalance.value = '';
            }
            if (!allowance.value) {
                await getAllowance();
            }
            await getEstimateInfo();
            await checkAllowance();
        };

        // =================================================================================================================

        const checkAllowance = async () => {
            if (allowance.value >= toMantissa(amount.value, selectedSrcToken.value?.decimals)) {
                needApprove.value = false;
            } else {
                if (!approveTx.value && !selectedSrcToken.value?.chain_id) {
                    needApprove.value = true;
                    await getApproveTx();
                }
            }
        };

        const getAllowance = async () => {
            approveTx.value = null;
            needApprove.value = false;

            if (selectedSrcToken.value?.address) {
                const resAllowance = await store.dispatch('bridge/getAllowance', {
                    net: selectedSrcNetwork.value.net,
                    tokenAddress: selectedSrcToken.value.address,
                    ownerAddress: walletAddress.value,
                });

                if (resAllowance.error) {
                    return;
                }

                allowance.value = resAllowance.allowance;
            }
        };

        const getApproveTx = async () => {
            if (selectedSrcToken.value?.address) {
                const resApproveTx = await store.dispatch('bridge/getApproveTx', {
                    net: selectedSrcNetwork.value.net,
                    tokenAddress: selectedSrcToken.value.address,
                    ownerAddress: walletAddress.value,
                });

                if (resApproveTx.error) {
                    return;
                }
                approveTx.value = resApproveTx;
            }
        };

        const getEstimateInfo = async () => {
            if (
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstNetwork.value ||
                !selectedDstToken.value ||
                !+amount.value
            ) {
                return;
            }

            if (selectedSrcNetwork.value.net !== currentChainInfo.value.net) {
                networkError.value = true;
            }
            const resEstimate = await store.dispatch('bridge/estimateBridge', {
                fromNet: selectedSrcNetwork.value.net,
                fromTokenAddress: selectedSrcToken.value.address || NATIVE_CONTRACT,
                amount: amount.value,
                toNet: selectedDstNetwork.value.net,
                toTokenAddress: selectedDstToken.value.address || NATIVE_CONTRACT,
                ownerAddress: walletAddress.value,
            });

            if (resEstimate.error) {
                txError.value = resEstimate.error;
                return;
            }

            txError.value = '';
            receiveValue.value = resEstimate.toTokenAmount;
            networkFee.value = +resEstimate.fee.amount;
            estimateTime.value =
                '< ' +
                Math.round(services[0]?.estimatedTime[selectedSrcNetwork?.value?.chain_id || selectedSrcNetwork?.value?.chainId] / 60) +
                ' min';
        };

        const getProvider = () => {
            const { provider } = connectedWallet.value || {};
            if (provider) {
                const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
                return ethersProvider;
            }
        };
        // =================================================================================================================

        const sendMetamaskTransaction = async (transaction) => {
            const ethersProvider = getProvider();
            const tx = {
                data: transaction.data,
                from: transaction.from,
                to: transaction.to,
                chainId: `0x${transaction?.chainId?.toString(16)}`,
                value: transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0',
            };
            try {
                if (ethersProvider) {
                    const signer = ethersProvider.getSigner();
                    const txn = await signer.sendTransaction(tx);

                    const receipt = await txn.wait();

                    return receipt;
                }
            } catch (e) {
                return checkErrors(e);
            }
        };

        const getOrderIds = async (txHash) => {
            await delay(3000); // Fix after integrating
            const response = await axios.get(`https://api.dln.trade/v1.0/dln/tx/${txHash}/order-ids`);

            if (response.status === 200) {
                const { data = {} } = response;
                const { orderIds = [] } = data;
                return orderIds;
            }

            return [];
        };

        const getTransactionHash = async (txHash) => {
            let orderIds = await getOrderIds(txHash);

            if (!orderIds.length) {
                orderIds = await getOrderIds(txHash);
            }

            const responseHash = await axios.get(`https://dln-api.debridge.finance/api/Orders/${orderIds[0]}`);

            const hash = {
                srcHash: null,
                dstHash: null,
            };

            if (responseHash.status === 200) {
                const { data = {} } = responseHash;

                const { createdSrcEventMetadata = {}, fulfilledDstEventMetadata = {} } = data;

                hash.srcHash = createdSrcEventMetadata?.transactionHash?.stringValue || null;
                hash.dstHash = fulfilledDstEventMetadata?.transactionHash?.stringValue || null;
            }

            return hash;
        };

        const swap = async () => {
            if (disabledBtn.value) {
                return;
            }

            isLoading.value = true;
            txError.value = '';

            // APPROVE
            if (approveTx.value) {
                const resTx = await sendMetamaskTransaction({ ...approveTx.value, from: walletAddress.value });
                if (resTx.error) {
                    txError.value = resTx.error;
                    isLoading.value = false;
                    setTimeout(() => {
                        txError.value = '';
                    }, 2000);
                    return;
                }

                approveTx.value = null;
                successHash.value = getTxUrl(selectedSrcNetwork.value.net, resTx.transactionHash);
                await getAllowance();
                await checkAllowance();
                resetAmount.value = false;
                setTimeout(() => {
                    isLoading.value = false;
                    successHash.value = '';
                }, 5000);
                return;
            }

            const resSwap = await store.dispatch('bridge/getBridgeTx', {
                fromNet: selectedSrcNetwork.value.net,
                fromTokenAddress: selectedSrcToken.value.address || NATIVE_CONTRACT,
                amount: amount.value,
                toNet: selectedDstNetwork.value.net,
                toTokenAddress: selectedDstToken.value.address || NATIVE_CONTRACT,
                recipientAddress: address.value || walletAddress.value,
                fallbackAddress: walletAddress.value || NATIVE_CONTRACT,
                ownerAddress: walletAddress.value,
                slippage: 1,
            });

            if (resSwap.error) {
                txError.value = resSwap.error;
                isLoading.value = false;
                return;
            }

            const resTx = await sendMetamaskTransaction(resSwap);

            if (resTx.error) {
                txError.value = resTx.error;
                isLoading.value = false;
                setTimeout(() => {
                    txError.value = '';
                }, 2000);
                return;
            }

            const hash = await getTransactionHash(resTx.transactionHash);

            if (hash) {
                successHash.value = getTxUrl(selectedDstNetwork.value.net, hash.dstHash);
            } else {
                successHash.value = getTxUrl(selectedDstNetwork.value.net, resTx.transactionHash);
            }
            isLoading.value = false;
            resetAmount.value = true;

            setTimeout(() => {
                successHash.value = '';
            }, 5000);

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
        };

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/bridge/select-token') {
                targetDirection.value = DIRECTIONS.SOURCE;
                selectedSrcNetwork.value = null;
                selectedSrcToken.value = null;
                selectedDstNetwork.value = null;
                selectedDstToken.value = null;
            }
        });

        return {
            isLoading,
            disabledBtn,
            needApprove,
            resetAmount,
            receiveToken,
            receiveValue,

            zometNetworks,
            activeSupportedChains,

            services,

            errorAddress,
            errorBalance,
            networkError,

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

            onSelectSrcNetwork,
            onSelectDstNetwork,
            onSetAddress,
            onSetSrcToken,
            onSetDstToken,
            onSetAmount,
            swap,
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
