<template>
    <div class="simple-swap">
        <Select :items="groupTokens" @select="onSelectNetwork" />
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
                :on-reset="successHash"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('simpleSwap.pay')"
                @click="onSetTokenFrom"
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
                :on-reset="successHash"
                :is-update="isUpdateSwapDirectionValue"
                :label="$t('simpleSwap.receive')"
                :disabled-value="receiveValue"
                :disabled="true"
                hide-max
                class="mt-10"
                @click="onSetTokenTo"
            />
        </div>
        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
        <InfoPanel v-if="successHash" :hash="successHash" :title="$t('tx.txHash')" type="success" class="mt-10" />
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
import Select from '@/components/ui/Select';
import SelectAmount from '@/components/ui/SelectAmount';

import Button from '@/components/ui/Button';

import useTokens from '@/compositions/useTokens';
import useWeb3Onboard from '@/compositions/useWeb3Onboard';

import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { ethers } from 'ethers';
import { useRouter } from 'vue-router';
import { getTxUrl } from '@/helpers/utils';
import { toMantissa } from '@/helpers/numbers';

import SwapSvg from '@/assets/icons/dashboard/swap.svg';

const NATIVE_CONTRACT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export default {
    name: 'SimpleSwap',
    components: {
        InfoPanel,
        Select,
        SelectAmount,
        Button,
        SwapSvg,
    },
    setup() {
        const store = useStore();
        const isLoading = ref(false);
        const needApprove = ref(false);
        const approveTx = ref(null);
        const txError = ref('');
        const successHash = ref('');

        const selectedNetwork = ref(null);

        const isUpdateSwapDirectionValue = ref(false);
        const router = useRouter();
        const amount = ref('');
        const receiveValue = ref('');

        const errorBalance = ref('');

        const { groupTokens, allTokensFromNetwork } = useTokens();
        const { walletAddress, currentChainInfo, connectedWallet } = useWeb3Onboard();

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
                !selectedTokenTo.value
            );
        });

        const clearApprove = () => {
            needApprove.value = false;
            approveTx.value = null;
            receiveValue.value = '';
        };

        const networks = computed(() => store.getters['networks/networks']);

        const tokensList = computed(() => {
            if (!selectedNetwork.value) {
                return [];
            }

            const list = [
                selectedNetwork.value,
                ...selectedNetwork.value.list,
                ...allTokensFromNetwork(selectedNetwork.value.net).filter((token) => {
                    return token.net !== selectedNetwork.value.net && !selectedNetwork.value.list.find((t) => t.net === token.net);
                }),
            ];

            if (!selectedTokenFrom.value) {
                store.dispatch('tokens/setFromToken', list[0]);
            }
            if (!selectedTokenTo.value) {
                store.dispatch('tokens/setToToken', list[1]);
            }

            return list;
        });

        const onSelectNetwork = (network) => {
            console.log(selectedNetwork.value, network, '--network');
            if (selectedNetwork.value !== network) {
                selectedNetwork.value = network;

                store.dispatch('networks/setSelectedNetwork', network);
            }
        };

        const onSetTokenFrom = () => {
            store.dispatch('tokens/setSelectType', 'from');
            router.push('select-token');

            clearApprove();
        };

        const onSetTokenTo = async () => {
            store.dispatch('tokens/setSelectType', 'to');
            router.push('select-token');
            clearApprove();

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

            await getEstimateInfo();
            await getAllowance();

            errorBalance.value = '';
        };

        const swapTokensDirection = () => {
            amount.value = '';
            clearApprove();

            const from = { ...selectedTokenFrom.value };
            const to = { ...selectedTokenTo.value };

            isUpdateSwapDirectionValue.value = true;
            selectedTokenFrom.value = to;
            selectedTokenTo.value = from;
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
        };

        const getAllowance = async () => {
            approveTx.value = null;
            needApprove.value = false;

            const resAllowance = await store.dispatch('oneInchSwap/getAllowance', {
                net: selectedNetwork.value.net,
                token_address: selectedTokenFrom.value.list ? NATIVE_CONTRACT : selectedTokenFrom.value.address,
                owner: walletAddress.value,
            });

            if (resAllowance.error) {
                return;
            }

            if (resAllowance.allowance >= toMantissa(amount.value, selectedTokenFrom.value.decimals)) {
                needApprove.value = false;
            } else {
                needApprove.value = true;
                await getApproveTx();
            }
        };

        const getApproveTx = async () => {
            const resApproveTx = await store.dispatch('oneInchSwap/getApproveTx', {
                net: selectedNetwork.value.net,
                token_address: selectedTokenFrom.value.list ? NATIVE_CONTRACT : selectedTokenFrom.value.address,
                owner: walletAddress.value,
            });

            if (resApproveTx.error) {
                return;
            }
            approveTx.value = resApproveTx;
        };

        const sendMetamaskTransaction = async (tx) => {
            const { provider, label } = connectedWallet.value || {};
            if (provider && label) {
                console.log(provider);
                // create an ethers provider with the last connected wallet provider
                const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');

                const signer = ethersProvider.getSigner();
                console.log(signer);

                const txn = await signer.sendTransaction(tx);

                const receipt = await txn.wait();
                console.log(receipt, '--receipt');
                return receipt;
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
                console.log(approveTx.value.transaction, '-approveTx.value.transaction');
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
                successHash.value = getTxUrl(selectedNetwork.value.net, resTx.txHash);
                setTimeout(() => {
                    isLoading.value = false;
                    successHash.value = '';
                    isLoading.value = false;
                }, 5000);
                return;
            }
            //------

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
            console.log(resSwap, '---resSwap');

            const resTx = await sendMetamaskTransaction(resSwap.transaction);
            if (resTx.error) {
                txError.value = resTx.error;
                isLoading.value = false;
                setTimeout(() => {
                    txError.value = '';
                }, 2000);
                return;
            }

            successHash.value = getTxUrl(selectedNetwork.value.net, resTx.txHash);

            setTimeout(() => {
                isLoading.value = false;
                successHash.value = '';
                isLoading.value = false;
            }, 5000);
        };

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
            isUpdateSwapDirectionValue,
            swapTokensDirection,
            currentChainInfo,
            selectedTokenFrom,
            selectedTokenTo,
            receiveValue,
            swap,
            txError,
            successHash,
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
</style>
