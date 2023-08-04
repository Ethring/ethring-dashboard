<template>
    <div class="simple-swap">
        <SelectNetwork :items="zometNetworks" :current="selectedNetwork || currentChainInfo" @select="onSelectNetwork" />
        <div class="simple-swap__switch-wrap">
            <SelectAmount
                v-if="tokensList.length"
                :selected-network="selectedNetwork"
                :items="tokensList"
                :value="selectedTokenFrom"
                :error="!!errorBalance"
                :on-reset="resetAmount"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('tokenOperations.pay')"
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
                :label="$t('tokenOperations.receive')"
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
        <Accordion v-if="receiveValue" :title="setReceiveValue" class="mt-10">
            <div class="accordion__content">
                <AccordionItem :label="$t('tokenOperations.networkFee') + ' : '">
                    <span class="fee">{{ networkFee }}</span> <span class="fee-symbol">$</span>
                </AccordionItem>
                <AccordionItem :label="$t('simpleSwap.service') + ' : '">
                    <img src="https://cryptologos.cc/logos/1inch-1inch-logo.svg?v=025" />
                    <span class="symbol">1inch</span>
                </AccordionItem>
            </div>
        </Accordion>
        <Button
            xl
            :title="needApprove ? $t('tokenOperations.approve') : $t('tokenOperations.swap')"
            :disabled="!!disabledSwap"
            :loading="isLoading"
            class="simple-swap__btn mt-10"
            @click="swap"
        />
    </div>
</template>
<script>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

import { useStore } from 'vuex';

import { ethers } from 'ethers';

import { useRouter } from 'vue-router';

import useTokens from '@/compositions/useTokens';
import useWeb3Onboard from '@/compositions/useWeb3Onboard';

import Button from '@/components/ui/Button';
import InfoPanel from '@/components/ui/InfoPanel';
import SelectNetwork from '@/components/ui/SelectNetwork';
import SelectAmount from '@/components/ui/SelectAmount';
import Accordion from '@/components/ui/Accordion.vue';
import AccordionItem from '@/components/ui/AccordionItem.vue';

import SwapSvg from '@/assets/icons/dashboard/swap.svg';

import { prettyNumberTooltip } from '@/helpers/prettyNumber';
import { getTxUrl } from '@/helpers/utils';
import { toMantissa } from '@/helpers/numbers';

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
        AccordionItem,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { groupTokens, allTokensFromNetwork, getTokenList } = useTokens();
        const { walletAddress, currentChainInfo, connectedWallet, setChain } = useWeb3Onboard();

        const isLoading = ref(false);
        const needApprove = ref(false);
        const balanceUpdated = ref(false);
        const approveTx = ref(null);
        const txError = ref('');
        const successHash = ref('');
        const estimateRate = ref(0);
        const networkFee = ref(0);
        const resetAmount = ref(false);
        const isUpdateSwapDirectionValue = ref(false);
        const amount = ref('');
        const receiveValue = ref('');
        const errorBalance = ref('');
        const allowance = ref(null);
        const setReceiveValue = ref('');

        const selectedNetwork = computed(() => store.getters['networks/selectedNetwork']);
        const favouritesList = computed(() => store.getters['tokens/favourites']);
        const selectedTokenFrom = computed(() => store.getters['tokens/fromToken']);
        const selectedTokenTo = computed(() => store.getters['tokens/toToken']);
        const zometNetworks = computed(() => store.getters['networks/zometNetworksList']);
        const disabledSwap = computed(() => {
            return (
                isLoading.value ||
                errorBalance.value ||
                !+amount.value ||
                !receiveValue.value ||
                !selectedNetwork.value ||
                !selectedTokenFrom.value ||
                !selectedTokenTo.value ||
                currentChainInfo.value?.net !== selectedNetwork.value?.net
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
                store.dispatch('networks/setSelectedNetwork', network);
            }

            store.dispatch('networks/setSelectedNetwork', {
                ...network,
                logo: zometNetworks.value?.find((elem) => network?.net === elem?.net)?.logo,
            });
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
            if (!allowance.value) {
                await getAllowance();
            }
            await getEstimateInfo();

            if (selectedTokenFrom.value.address) {
                await checkAllowance();
            }
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
            getAllowance();
            setTimeout(() => {
                isUpdateSwapDirectionValue.value = false;
            }, 300);
        };

        const getEstimateInfo = async () => {
            if (!selectedNetwork.value || !selectedTokenFrom.value || !selectedTokenTo.value || !+amount.value) {
                return;
            }

            const resEstimate = await store.dispatch('swap/estimateSwap', {
                net: selectedNetwork.value.net,
                fromTokenAddress: selectedTokenFrom.value.address || NATIVE_CONTRACT,
                toTokenAddress: selectedTokenTo.value.address || NATIVE_CONTRACT,
                amount: amount.value,
            });

            if (resEstimate.error) {
                txError.value = resEstimate.error;
                return;
            }
            txError.value = '';
            receiveValue.value = resEstimate.toTokenAmount;
            networkFee.value = prettyNumberTooltip(+resEstimate.fee.amount * selectedNetwork.value.price.USD, 4);
            estimateRate.value = prettyNumberTooltip(resEstimate.toTokenAmount / resEstimate.fromTokenAmount, 6);
            setReceiveValue.value = `Rate: <span class='symbol'>1</span> ${selectedTokenFrom.value.code} = <span class='symbol'>${estimateRate.value}</span> ${selectedTokenTo.value.code}`;
        };

        const getAllowance = async () => {
            approveTx.value = null;
            needApprove.value = false;

            if (selectedTokenFrom.value?.address) {
                const resAllowance = await store.dispatch('swap/getAllowance', {
                    net: currentChainInfo.value.net,
                    tokenAddress: selectedTokenFrom.value.address,
                    ownerAddress: walletAddress.value,
                });

                if (resAllowance.error) {
                    return;
                }
                allowance.value = resAllowance.allowance;
            }
        };

        const getApproveTx = async () => {
            if (selectedTokenFrom.value?.address) {
                const resApproveTx = await store.dispatch('swap/getApproveTx', {
                    net: currentChainInfo.value.net,
                    tokenAddress: selectedTokenFrom.value.address,
                    ownerAddress: walletAddress.value,
                });
                if (resApproveTx.error) {
                    return;
                }
                approveTx.value = resApproveTx;
            }
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
                    }, 3000);
                    return;
                }

                approveTx.value = null;
                successHash.value = getTxUrl(currentChainInfo.value.net, resTx.transactionHash);
                await getAllowance();
                await checkAllowance();
                resetAmount.value = false;
                setTimeout(() => {
                    isLoading.value = false;
                    successHash.value = '';
                }, 5000);
                return;
            }

            const resSwap = await store.dispatch('swap/getSwapTx', {
                net: selectedNetwork.value.net,
                fromTokenAddress: selectedTokenFrom.value.address || NATIVE_CONTRACT,
                toTokenAddress: selectedTokenTo.value.address || NATIVE_CONTRACT,
                amount: amount.value,
                ownerAddress: walletAddress.value,
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
                }, 3000);
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

        onMounted(async () => {
            if (!selectedNetwork.value) {
                store.dispatch('networks/setSelectedNetwork', {
                    ...groupTokens.value.find((elem) => elem.net === currentChainInfo.value.net),
                    logo: zometNetworks.value?.find((elem) => currentChainInfo?.net === elem?.net)?.logo,
                });
            }

            await getAllowance();
        });

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/swap/select-token') {
                store.dispatch('tokens/setFromToken', null);
                store.dispatch('tokens/setToToken', null);
            }
        });

        return {
            isLoading,
            needApprove,
            disabledSwap,
            walletAddress,
            networks,
            groupTokens,
            zometNetworks,
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
            setReceiveValue,
        };
    },
};
</script>
<style lang="scss">
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

    .accordion__content {
        img {
            width: 16px;
            height: 16px;
        }
        .symbol {
            margin-left: 5px;
        }
        .fee {
            color: $colorBaseGreen;
            margin-right: 4px;
        }

        .fee-symbol {
            color: $colorPl;
            font-weight: 300;
            font-family: 'Poppins_Regular';
        }
    }

    .accordion__title {
        .symbol {
            font-family: 'Poppins_SemiBold';
        }
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

// .accordion {

//         .fee {
//             color: $colorBaseGreen;
//             margin-right: 4px;
//         }

//         .symbol {
//             color: $colorPl;
//             font-weight: 300;
//             font-family: 'Poppins_Regular';
//         }
//     }
// }
</style>
