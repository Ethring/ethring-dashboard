<template>
    <div class="simple-swap">
        <SelectNetwork :items="groupTokens" :current="currentChainInfo" @select="onSelectNetwork" />
        <InfoPanel
            v-if="walletAddress && selectedNetwork && currentChainInfo?.citadelNet !== selectedNetwork?.net"
            :title="$t('mmIncorrectNetwork')"
            class="mt-10"
        />
        <div class="simple-swap__switch-wrap">
            <SelectAmount
                v-if="tokensList.length"
                :selected-network="selectedNetwork"
                :items="tokensList"
                :value="selectedTokenFrom"
                :error="!!errorBalance"
                :on-reset="resetAmount"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('simpleSwap.pay')"
                @clickToken="onSetTokenFrom"
                class="mt-10"
                @setAmount="onSetAmount"
            />
            <div class="simple-swap__switch" @click="swapTokensDirection">
                <SwapSvg />
            </div>
            <SelectAmount
                v-if="tokensList.length"
                :selected-network="selectedNetwork"
                :value="selectedTokenTo"
                :items="tokensList"
                :on-reset="resetAmount"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('simpleSwap.receive')"
                :disabled-value="receiveValue"
                :disabled="true"
                hide-max
                class="mt-10"
                @clickToken="onSetTokenTo"
            />
        </div>
        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
        <InfoPanel v-if="successHash" :hash="successHash" :title="$t('tx.txHash')" type="success" class="mt-10" />
        <Accordion
            v-if="receiveValue"
            :title="`Rate: <span style='font-family:Poppins_Semibold;'>1</span> ${selectedTokenFrom.code} = <span  style='font-family:Poppins_Semibold;'>${estimateRate}</span> ${selectedTokenTo.code}`"
            class="mt-10"
        >
            <div class="accordion__content">
                <div class="accordion__item">
                    <div class="accordion__label">Network fee:</div>
                    <div class="accordion__value">
                        <span class="fee">{{ networkFee }}</span> <span class="symbol">{{ selectedNetwork.code }}</span>
                    </div>
                </div>
                <div class="accordion__item">
                    <div class="accordion__label">Bridge:</div>
                    <div class="accordion__value">
                        <img src="https://cryptologos.cc/logos/1inch-1inch-logo.svg?v=025" />
                        <div class="name">1inch</div>
                    </div>
                </div>
            </div>
        </Accordion>
        <Button
            xl
            :title="needApprove ? $t('simpleSwap.approve') : $t('simpleSwap.swap')"
            :disabled="!!disabledSwap"
            :loading="isLoading"
            class="simple-swap__btn mt-10"
            @click="swap"
        />
    </div>
</template>
<script>
import InfoPanel from '@/components/ui/InfoPanel';
import SelectNetwork from '@/components/ui/SelectNetwork';
import SelectAmount from '@/components/ui/SelectAmount';

import Button from '@/components/ui/Button';

import useTokens from '@/compositions/useTokens';
import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { ethers } from 'ethers';
import { useRouter } from 'vue-router';
import { getTxUrl } from '@/helpers/utils';
import { toMantissa } from '@/helpers/numbers';

import SwapSvg from '@/assets/icons/dashboard/swap.svg';
import Accordion from '@/components/ui/Accordion.vue';

const NATIVE_CONTRACT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export default {
    name: 'SimpleSwap',
    components: {
        InfoPanel,
        SelectNetwork,
        SelectAmount,
        Button,
        SwapSvg,
        Accordion,
    },
    setup() {
        const store = useStore();
        const isLoading = ref(false);
        const needApprove = ref(false);
        const balanceUpdated = ref(false);
        const approveTx = ref(null);
        const txError = ref('');
        const successHash = ref('');
        const estimateRate = ref(0);
        const networkFee = ref(0);
        const gasPrice = ref(0);
        const resetAmount = ref(false);
        const selectedNetwork = computed(() => store.getters['networks/selectedNetwork']);
        const isUpdateSwapDirectionValue = ref(false);
        const router = useRouter();
        const amount = ref('');
        const receiveValue = ref('');
        const errorBalance = ref('');
        const allowance = ref(null);
        const { groupTokens, allTokensFromNetwork, getTokenList } = useTokens();
        const { walletAddress, currentChainInfo, connectedWallet, setChain } = useWeb3Onboard();
        const favouritesList = computed(() => store.getters['tokens/favourites']);
        const selectedTokenFrom = computed(() => store.getters['tokens/fromToken']);
        const selectedTokenTo = computed(() => store.getters['tokens/toToken']);

        const disabledSwap = computed(() => {
            return (
                isLoading.value ||
                errorBalance.value ||
                !+amount.value ||
                !selectedNetwork.value ||
                !selectedTokenFrom.value ||
                !selectedTokenTo.value ||
                currentChainInfo.value?.citadelNet !== selectedNetwork.value?.net
            );
        });

        const clearApprove = () => {
            needApprove.value = false;
            approveTx.value = null;
            receiveValue.value = '';
            allowance.value = null;
        };

        const networks = computed(() => store.getters['networks/networks']);

        const tokensList = computed(() => {
            if (!selectedNetwork.value) {
                return [];
            }
            let listWithBalances = getTokenList(selectedNetwork.value);

            const list = [
                ...listWithBalances,
                ...allTokensFromNetwork(selectedNetwork.value.net).filter((token) => {
                    return token.net !== selectedNetwork.value.net && !groupTokens.value[0].list.find((t) => t.net === token.net);
                }),
            ];
            if (!selectedTokenFrom.value || !list.find((elem) => elem.net === selectedTokenFrom.value.net)) {
                if (list[0].code !== 'USDC') {
                    store.dispatch('tokens/setFromToken', list[0]);
                } else {
                    store.dispatch('tokens/setFromToken', list[1]);
                }
            } else if (balanceUpdated.value) {
                let tokenFrom = list.find((elem) => elem.code === selectedTokenFrom.value.code);
                if (tokenFrom) {
                    store.dispatch('tokens/setFromToken', tokenFrom);
                }
            }
            if (!selectedTokenTo.value || !list.find((elem) => elem.net === selectedTokenTo.value.net)) {
                store.dispatch(
                    'tokens/setToToken',
                    list.find((elem) => elem.code === 'USDC')
                );
            } else if (balanceUpdated.value) {
                let tokenTo = list.find((elem) => elem.code === selectedTokenTo.value.code);
                if (tokenTo) {
                    store.dispatch('tokens/setToToken', tokenTo);
                }
            }
            return list;
        });

        const onSelectNetwork = async (network) => {
            if (selectedNetwork.value !== network) {
                txError.value = '';
                if (network.id || network.chain_id) {
                    await setChain({
                        chainId: network.id || network.chain_id,
                    });
                }
            }
        };

        const onSetTokenFrom = () => {
            store.dispatch('tokens/setSelectType', 'from');
            router.push('/swap/select-token');
            balanceUpdated.value = false;
            clearApprove();
        };

        const onSetTokenTo = async () => {
            store.dispatch('tokens/setSelectType', 'to');
            router.push('/swap/select-token');
            balanceUpdated.value = false;
            onSetAmount(amount.value);
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
            if (+value > selectedTokenFrom.value.balance?.amount || +value > selectedTokenFrom.value.balance?.mainBalance) {
                errorBalance.value = 'Insufficient balance';
            } else {
                errorBalance.value = '';
            }
            await getEstimateInfo();
            if (!allowance.value) {
                await getAllowance();
            }
            await checkAllowance();
        };

        const checkAllowance = async () => {
            if (allowance.value >= toMantissa(amount.value, selectedTokenFrom.value?.decimals)) {
                needApprove.value = false;
            } else {
                needApprove.value = true;
                if (!approveTx.value) {
                    await getApproveTx();
                }
            }
        };

        const swapTokensDirection = () => {
            amount.value = '';
            clearApprove();

            const from = { ...selectedTokenFrom.value };
            const to = { ...selectedTokenTo.value };

            isUpdateSwapDirectionValue.value = true;

            store.dispatch('tokens/setFromToken', to);
            store.dispatch('tokens/setToToken', from);
            setTimeout(() => {
                isUpdateSwapDirectionValue.value = false;
            }, 300);
        };

        const getEstimateInfo = async () => {
            if (!selectedNetwork.value || !selectedTokenFrom.value || !selectedTokenTo.value || !+amount.value) {
                return;
            }

            const resEstimate = await store.dispatch('oneInchSwap/estimateSwap', {
                net: selectedNetwork.value.net,
                from_token_address: selectedTokenFrom.value.list ? NATIVE_CONTRACT : selectedTokenFrom.value.address,
                to_token_address: selectedTokenTo.value.list ? NATIVE_CONTRACT : selectedTokenTo.value.address,
                amount: amount.value,
            });

            if (resEstimate.error) {
                txError.value = resEstimate.error;
                return;
            }
            txError.value = '';
            receiveValue.value = resEstimate.toTokenAmount;
            networkFee.value = prettyNumberTooltip(gasPrice.value * +resEstimate.estimatedGas, 4);
            estimateRate.value = prettyNumberTooltip(resEstimate.toTokenAmount / resEstimate.fromTokenAmount, 6);
        };

        const getAllowance = async () => {
            approveTx.value = null;
            needApprove.value = false;

            const resAllowance = await store.dispatch('oneInchSwap/getAllowance', {
                net: currentChainInfo.value.citadelNet,
                token_address: selectedTokenFrom.value.list ? NATIVE_CONTRACT : selectedTokenFrom.value.address,
                owner: walletAddress.value,
            });

            if (resAllowance.error) {
                return;
            }
            allowance.value = resAllowance.allowance;
        };

        const getApproveTx = async () => {
            const resApproveTx = await store.dispatch('oneInchSwap/getApproveTx', {
                net: currentChainInfo.value.citadelNet,
                token_address: selectedTokenFrom.value.list ? NATIVE_CONTRACT : selectedTokenFrom.value.address,
                owner: walletAddress.value,
            });
            if (resApproveTx.error) {
                return;
            }
            approveTx.value = resApproveTx;
        };

        const getProvider = () => {
            const { provider } = connectedWallet.value || {};
            if (provider) {
                // create an ethers provider with the last connected wallet provider
                const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
                return ethersProvider;
            }
        };

        const sendTransaction = async (transaction) => {
            const ethersProvider = getProvider();
            const tx = {
                data: transaction.data,
                from: transaction.from,
                to: transaction.to,
                chainId: `0x${transaction.chainId.toString(16)}`,
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
                return { error: e.message };
            }
        };

        const swap = async () => {
            if (disabledSwap.value) {
                return;
            }

            isLoading.value = true;
            txError.value = '';

            // APPROVE
            if (approveTx.value) {
                const resTx = await sendTransaction({ ...approveTx.value, from: walletAddress.value });
                if (resTx.error) {
                    txError.value = resTx.error;
                    isLoading.value = false;
                    setTimeout(() => {
                        txError.value = '';
                    }, 2000);
                    return;
                }

                approveTx.value = null;
                successHash.value = getTxUrl(currentChainInfo.value.citadelNet, resTx.transactionHash);
                await getAllowance();
                await checkAllowance();
                resetAmount.value = false;
                setTimeout(() => {
                    isLoading.value = false;
                    successHash.value = '';
                }, 5000);
                return;
            }

            const resSwap = await store.dispatch('oneInchSwap/getSwapTx', {
                net: selectedNetwork.value.net,
                from_token_address: selectedTokenFrom.value.list ? NATIVE_CONTRACT : selectedTokenFrom.value.address,
                to_token_address: selectedTokenTo.value.list ? NATIVE_CONTRACT : selectedTokenTo.value.address,
                amount: amount.value,
                owner: walletAddress.value,
                slippage: 0.5,
            });

            if (resSwap.error) {
                txError.value = resSwap.error;
                isLoading.value = false;
                return;
            }
            const resTx = await sendTransaction(resSwap);
            if (resTx.error) {
                txError.value = resTx.error;
                isLoading.value = false;
                setTimeout(() => {
                    txError.value = '';
                }, 2000);
                return;
            }

            successHash.value = getTxUrl(selectedNetwork.value.net, resTx.transactionHash);
            isLoading.value = false;
            resetAmount.value = true;
            setTimeout(() => {
                successHash.value = '';
            }, 5000);
            store.dispatch('tokens/updateTokenBalances', {
                net: selectedNetwork.value.net,
                address: walletAddress.value,
                info: selectedNetwork.value,
                update(wallet) {
                    store.dispatch('networks/setSelectedNetwork', wallet);
                },
            });
            balanceUpdated.value = true;
        };
        const loadGasPrice = async () => {
            const ethersProvider = getProvider();
            const res = await ethersProvider.getGasPrice();
            let formatted = ethers.utils.formatUnits(
                ethers.BigNumber.from(res).toString(),
                ethers.BigNumber.from(currentChainInfo.value.nativeCurrency?.decimals)
            );
            gasPrice.value = +formatted;
        };
        onMounted(async () => {
            store.dispatch(
                'networks/setSelectedNetwork',
                groupTokens.value.find((elem) => elem.net === currentChainInfo.value.citadelNet)
            );
            await loadGasPrice();
        });

        return {
            isLoading,
            needApprove,
            disabledSwap,
            walletAddress,
            networks,
            groupTokens,
            tokensList,
            favouritesList,
            errorBalance,
            selectedNetwork,
            onSelectNetwork,
            onSetTokenFrom,
            onSetTokenTo,
            onSetAmount,
            resetAmount,
            isUpdateSwapDirectionValue,
            swapTokensDirection,
            currentChainInfo,
            selectedTokenFrom,
            selectedTokenTo,
            receiveValue,
            swap,
            txError,
            estimateRate,
            successHash,
            networkFee,
        };
    },
};
</script>
<style lang="scss" scoped>
.simple-swap {
    width: 660px;

    &__switch-wrap {
        position: relative;
    }

    &__switch {
        cursor: pointer;
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 48px;
        height: 48px;
        z-index: 10;
        border-radius: 50%;
        left: calc(50% - 24px);
        bottom: 138px;
        background: $colorGray;
        border: 4px solid $colorWhite;
        @include animateEasy;

        svg {
            @include animateEasy;
        }

        &:hover {
            background: #97ffd0;

            svg {
                fill: $colorDarkPanel;
            }
        }

        svg {
            fill: $colorPl;
        }
    }

    .mt-10 {
        margin-top: 10px;
    }

    &__btn {
        height: 64px;
        width: 100%;
    }
}

body.dark {
    .simple-swap {
        &__switch {
            background: $colorDarkPanel;
            border: 4px solid #0c0d18;

            svg {
                fill: $colorBrightGreen;
            }

            &:hover {
                background: $colorBrightGreen;

                svg {
                    fill: $colorBlack;
                }
            }
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

        .fee {
            color: $colorBaseGreen;
            margin-right: 4px;
        }

        .symbol {
            color: $colorPl;
            font-weight: 300;
            font-family: 'Poppins_Regular';
        }
    }
}
</style>
