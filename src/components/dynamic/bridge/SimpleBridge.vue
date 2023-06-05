<template>
    <div class="simple-bridge">
        <div class="select-group">
            <SelectNetwork
                :items="filteredSupportedChains"
                :current="selectedSrcNetwork"
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
            :selected-network="selectedSrcNetwork"
            :items="tokensSrcListResolved"
            :value="selectedSrcToken"
            :error="!!errorBalance"
            :label="$t('simpleBridge.send')"
            :on-reset="successHash"
            class="mt-10"
            @setAmount="onSetAmount"
            @click="onSetSrcToken"
        />
        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <SelectAmount
            v-if="selectedDstNetwork"
            :selected-netwoFrk="selectedDstNetwork"
            :items="tokensDstListResolved"
            :value="selectedDstToken"
            :error="!!errorBalance"
            :label="$t('simpleBridge.receive')"
            :disabled-value="prettyNumber(receiveValue)"
            :disabled="true"
            :on-reset="successHash"
            class="mt-10"
            @click="onSetDstToken"
        />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
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
            v-if="receiveValue"
            :title="`Fee : <span style='font-family:Poppins_Semibold; color: #0D7E71;'>${prettyNumber(
                networkFee
            )}</span> <span  style='font-family:Poppins_Semibold;'>${selectedSrcToken?.code}</span>`"
            class="mt-10"
        >
            <div class="accordion__content">
                <div class="accordion__item">
                    <div class="accordion__label">Bridge:</div>
                    <div class="accordion__value">
                        <img src="https://app.debridge.finance/assets/images/bridge.svg" />
                        <div class="name">{{ services[0].name }}</div>
                    </div>
                </div>
                <div class="accordion__item">
                    <div class="accordion__label">Time:</div>
                    <div class="accordion__value">{{ estimateTime }}</div>
                </div>
            </div>
        </Accordion>
        <Button
            xl
            :title="needApprove ? $t('simpleBridge.approve') : $t('simpleBridge.confirm').toUpperCase()"
            :disabled="!!disabledBtn"
            :loading="isLoading"
            class="simple-bridge__btn mt-10"
            @click="swap"
        />
    </div>
</template>
<script>
import InfoPanel from '@/components/ui/InfoPanel';
import SelectAmount from '@/components/ui/SelectAmount';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectNetwork from '@/components/ui/SelectNetwork';
import Accordion from '@/components/ui/Accordion';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';

import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ethers } from 'ethers';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

import { toMantissa } from '@/helpers/numbers';
import { prettyNumber } from '@/helpers/prettyNumber';
import { services } from '@/config/bridgeServices';
import { getTxUrl } from '@/helpers/utils';

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
        Checkbox,
    },
    setup() {
        const { walletAddress, currentChainInfo, connectedWallet, setChain } = useWeb3Onboard();
        const { groupTokens } = useTokens();

        const store = useStore();
        const isLoading = ref(false);
        const needApprove = ref(false);
        const receiveToken = ref(false);
        const approveTx = ref(null);
        const txError = ref('');
        const successHash = ref('');
        const router = useRouter();
        const networkFee = ref(0);

        const selectedSrcNetwork = computed(() => store.getters['bridge/selectedSrcNetwork']);
        const selectedDstNetwork = computed(() => store.getters['bridge/selectedDstNetwork']);

        const selectedSrcToken = computed(() => store.getters['tokens/fromToken']);
        const selectedDstToken = computed(() => store.getters['tokens/toToken']);

        const amount = ref('');
        const receiveValue = ref('');
        const address = ref('');
        const estimateTime = ref('');

        const errorAddress = ref('');
        const errorBalance = ref('');

        const tokensSrcListResolved = ref([]);
        const tokensDstListResolved = ref([]);

        onMounted(async () => {
            await store.dispatch('bridge/getSupportedChains');
        });

        const networks = computed(() => store.getters['networks/networks']);

        const getSupportedChains = computed(() => store.getters['bridge/supportedChains']);
        const filteredSupportedChains = computed(() => {
            return groupTokens?.value.filter((item) => {
                return getSupportedChains?.value?.some((network) => network.net === item.net);
            });
        });

        const activeSupportedChains = computed(() => {
            return filteredSupportedChains?.value.filter((token) => token.net !== currentChainInfo?.value?.citadelNet);
        });

        const disabledBtn = computed(() => {
            return (
                isLoading.value ||
                errorBalance.value ||
                !+amount.value ||
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value ||
                !selectedSrcToken.value ||
                txError.value
            );
        });

        const clearApprove = () => {
            needApprove.value = false;
            approveTx.value = null;
            receiveValue.value = '';
        };

        const tokensList = async (network, chainId) => {
            if (!network) {
                return [];
            }
            return await store.dispatch('bridge/getTokensByChain', {
                chainId: chainId,
            });
        };

        const onSelectSrcNetwork = async (network) => {
            if (selectedSrcNetwork.value !== network) {
                txError.value = '';
                if (network?.id || network?.chain_id) {
                    await setChain({
                        chainId: network.id || network.chain_id,
                    });
                }
            }

            store.dispatch('bridge/setSelectedSrcNetwork', network);

            tokensList(network, network?.chain_id).then((tokens) => {
                tokensSrcListResolved.value = tokens;
                if (!selectedSrcToken.value) {
                    store.dispatch('tokens/setFromToken', tokens[0]);
                }
            });
        };

        const onSelectDstNetwork = async (network) => {
            store.dispatch('bridge/setSelectedDstNetwork', network);

            tokensList(network, network?.chain_id).then((tokens) => {
                tokensDstListResolved.value = tokens;
                if (!selectedDstToken.value) {
                    store.dispatch('tokens/setToToken', tokens[0]);
                }
            });
        };

        const onSetSrcToken = () => {
            store.dispatch('tokens/setSelectType', 'from');
            router.push('/bridge/select-token');

            clearApprove();
        };

        const onSetDstToken = async () => {
            store.dispatch('tokens/setSelectType', 'to');
            router.push('/bridge/select-token');

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
            if (+value > +selectedSrcToken?.value?.balance?.amount) {
                errorBalance.value = 'Insufficient balance';
            }

            if (!+value) {
                return;
            }

            receiveValue.value = '';
            amount.value = value;

            await getEstimateInfo();
            await getAllowance();

            errorBalance.value = '';
        };

        const getAllowance = async () => {
            approveTx.value = null;
            needApprove.value = false;

            if (!selectedSrcToken.value.chain_id) {
                const resAllowance = await store.dispatch('bridge/getAllowance', {
                    net: selectedSrcNetwork.value.net,
                    tokenAddress: selectedSrcToken.value.address,
                    owner: walletAddress.value,
                });

                if (resAllowance.error) {
                    return;
                }

                if (resAllowance >= toMantissa(amount.value, selectedSrcToken.value.decimals)) {
                    needApprove.value = false;
                } else {
                    needApprove.value = true;
                    await getApproveTx();
                }
            }
        };

        const getApproveTx = async () => {
            const resApproveTx = await store.dispatch('bridge/getApproveTx', {
                net: selectedSrcNetwork.value.net,
                tokenAddress: selectedSrcToken.value.address,
                owner: walletAddress.value,
            });

            if (resApproveTx.error) {
                return;
            }
            approveTx.value = resApproveTx;
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

            const resEstimate = await store.dispatch('bridge/estimateBridge', {
                srcNet: selectedSrcNetwork.value.net,
                srcTokenAddress: selectedSrcToken.value.address || NATIVE_CONTRACT,
                srcTokenAmount: amount.value,
                dstNet: selectedDstNetwork.value.net,
                dstTokenAddress: selectedDstToken.value.address || NATIVE_CONTRACT,
            });

            if (resEstimate.error) {
                txError.value = resEstimate.error;
                return;
            }
            txError.value = '';
            receiveValue.value = resEstimate.dstTokenAmount;
            networkFee.value = +resEstimate.estimatedGas;
            estimateTime.value =
                services[0]?.etimatedTime[selectedSrcNetwork?.value?.code] || services[0]?.etimatedTime[selectedSrcNetwork?.value?.chain];
        };

        const getProvider = () => {
            const { provider } = connectedWallet.value || {};
            if (provider) {
                const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
                return ethersProvider;
            }
        };

        const sendMetamaskTransaction = async (transaction) => {
            const ethersProvider = getProvider();
            const tx = {
                data: transaction.data,
                from: transaction.from,
                to: transaction.to,
                chainId: `0x${transaction.chainId.toString(16)}`,
                value: transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0',
            };
            if (ethersProvider) {
                const signer = ethersProvider.getSigner();
                const txn = await signer.sendTransaction(tx);

                const receipt = await txn.wait();
                console.log(receipt, '---receipt');
                return receipt;
            }
        };

        const swap = async () => {
            if (disabledBtn.value) {
                return;
            }

            isLoading.value = true;
            txError.value = '';

            // APPROVE
            if (approveTx.value) {
                const resTx = await sendMetamaskTransaction({ ...approveTx.value.transaction, from: walletAddress.value });
                if (resTx.error) {
                    txError.value = resTx.error;
                    isLoading.value = false;
                    setTimeout(() => {
                        txError.value = '';
                    }, 2000);
                    return;
                }

                approveTx.value = null;
                successHash.value = getTxUrl(selectedSrcNetwork.value.net, resTx.txHash);
                await getAllowance();
                setTimeout(() => {
                    isLoading.value = false;
                    successHash.value = '';
                    isLoading.value = false;
                }, 5000);
                return;
            }

            const resSwap = await store.dispatch('bridge/getBridgeTx', {
                srcNet: selectedSrcNetwork.value.net,
                srcTokenAddress: selectedSrcToken.value.address || NATIVE_CONTRACT,
                srcTokenAmount: amount.value,
                dstNet: selectedDstNetwork.value.net,
                dstTokenAddress: selectedDstToken.value.address || NATIVE_CONTRACT,
                dstChainRecipientAddress: address.value || walletAddress.value,
                dstChainFallbackAddress: walletAddress.value || NATIVE_CONTRACT,
                owner: walletAddress.value,
                slippage: 1,
            });

            if (resSwap.error) {
                txError.value = resSwap.error;
                isLoading.value = false;
                return;
            }

            const resTx = await sendMetamaskTransaction(resSwap.transaction);
            if (resTx.error) {
                txError.value = resTx.error;
                isLoading.value = false;
                setTimeout(() => {
                    txError.value = '';
                }, 2000);
                return;
            }

            successHash.value = getTxUrl(selectedSrcNetwork.value.net, resTx.txHash);

            setTimeout(() => {
                isLoading.value = false;
                successHash.value = '';
                isLoading.value = false;
            }, 5000);
        };

        return {
            isLoading,
            disabledBtn,
            needApprove,
            receiveToken,
            receiveValue,

            networks,
            groupTokens,
            getSupportedChains,
            filteredSupportedChains,
            activeSupportedChains,
            tokensSrcListResolved,
            tokensDstListResolved,
            services,
            tokensList,

            errorAddress,
            errorBalance,

            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            onSelectSrcNetwork,
            onSelectDstNetwork,
            onSetAddress,
            onSetSrcToken,
            onSetDstToken,
            onSetAmount,
            estimateTime,
            swap,
            txError,
            successHash,
            prettyNumber,
            walletAddress,
            currentChainInfo,
            networkFee,
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
                font-size: 18px;
                line-height: 16px;
            }
        }
    }

    .accordion {
        &__item {
            display: flex;
            align-items: center;
        }

        &__label {
            color: #494c56;
            font-size: 16px;
            font-family: 'Poppins_Regular';
        }

        &__value {
            display: flex;
            align-items: center;
            font-size: 16px;
            font-family: 'Poppins_SemiBold';
            color: #1c1f2c;
            margin-left: 6px;

            img {
                width: 16px;
                height: 16px;
                margin-right: 6px;
            }
        }
    }

    &__btn {
        height: 64px;
        width: 100%;
    }
}
</style>
