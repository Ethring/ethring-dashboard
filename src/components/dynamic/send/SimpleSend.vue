<template>
    <div class="simple-send">
        <SelectNetwork :items="zometNetworks" @select="onSelectNetwork" />

        <SelectAddress
            :selected-network="currentChainInfo"
            :items="[]"
            :value="address"
            :error="!!errorAddress"
            class="mt-10"
            :on-reset="successHash"
            @removeAddress="onRemoveFavourite"
            @setAddress="onSetAddress"
        />

        <InfoPanel v-if="errorAddress" :title="errorAddress" class="mt-10" />

        <SelectAmount
            v-if="tokensList.length"
            :selected-network="currentChainInfo"
            :items="tokensList"
            :value="selectedToken || tokensList[0]"
            :error="!!errorBalance"
            :label="$t('simpleSend.amount')"
            :on-reset="successHash"
            class="mt-10"
            @setAmount="onSetAmount"
            @clickToken="onSetToken"
        />

        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
        <InfoPanel v-if="successHash" :hash="successHash" :title="$t('tx.txHash')" type="success" class="mt-10" />

        <Button
            xl
            :title="$t('simpleSend.confirm').toUpperCase()"
            :disabled="!!disabledSend"
            :loading="isLoading"
            class="simple-send__btn mt-10"
            @click="send"
        />
    </div>
</template>
<script>
import InfoPanel from '@/components/ui/InfoPanel';
import SelectNetwork from '@/components/ui/SelectNetwork';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectAmount from '@/components/ui/SelectAmount';

import Button from '@/components/ui/Button';

import useTokens from '@/compositions/useTokens';

import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import * as ethers from 'ethers';
import { useRouter } from 'vue-router';

// import { getTxUrl } from '@/helpers/utils';
import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import { onSelectNetwork } from '../../../helpers/chains';

import { getTxUrl } from '@/helpers/utils';

export default {
    name: 'SimpleSend',
    components: {
        InfoPanel,
        SelectNetwork,
        SelectAddress,
        SelectAmount,
        Button,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { walletAddress, connectedWallet, currentChainInfo } = useWeb3Onboard();

        const isLoading = ref(false);
        const txError = ref('');
        const successHash = ref('');

        const amount = ref('');
        const address = ref(store.getters['tokens/address']);
        const clearAddress = ref(false);
        const errorAddress = ref('');
        const errorBalance = ref('');

        const { groupTokens } = useTokens();

        // const favouritesList = computed(() => store.getters['tokens/favourites']);
        const zometNetworks = computed(() => store.getters['networks/zometNetworksList']);
        const selectedToken = computed(() => store.getters['tokens/fromToken']);

        const disabledSend = computed(() => {
            return (
                isLoading.value ||
                errorAddress.value ||
                errorBalance.value ||
                !+amount.value ||
                !address.value.length ||
                !currentChainInfo.value
            );
        });

        const networks = computed(() => store.getters['networks/networks']);

        const tokensList = computed(() => {
            if (!currentChainInfo.value) {
                return [];
            }
            const currentNetworkToken = groupTokens.value[0];
            if (!selectedToken.value) {
                store.dispatch('tokens/setFromToken', currentNetworkToken);
            }
            return [currentNetworkToken, ...groupTokens.value[0].list];
        });

        const onSetToken = () => {
            clearAddress.value = true;
            router.push('/send/select-token');
        };

        const onSetAddress = (addr) => {
            const reg = new RegExp(networks.value[currentChainInfo.value.net].validating);
            address.value = addr;
            store.dispatch('tokens/setAddress', addr);

            if (address.value.length && !reg.test(addr)) {
                errorAddress.value = 'Invalid address';
                return;
            }

            errorAddress.value = '';
        };

        const onSetAmount = (value) => {
            amount.value = value;

            if (isNaN(amount.value)) {
                errorBalance.value = 'Incorrect amount';
                return;
            }
            if (+value > selectedToken.value?.balance?.amount || +value > selectedToken.value?.balance?.mainBalance) {
                errorBalance.value = 'Insufficient balance';
            } else {
                errorBalance.value = '';
            }
        };

        const onRemoveFavourite = (params) => {
            store.dispatch('tokens/removeFavourite', params);
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

        const send = async () => {
            if (disabledSend.value) {
                return;
            }

            isLoading.value = true;

            const response = await store.dispatch('tokens/prepareTransfer', {
                net: selectedToken.value.net || selectedToken.value.network,
                from: walletAddress.value,
                toAddress: address.value,
                amount: amount.value,
            });

            if (response.error) {
                txError.value = response.error;
                isLoading.value = false;
                setTimeout(() => {
                    txError.value = '';
                }, 3000);
                return;
            }

            const tx = response.transaction || response;
            const resTx = await sendTransaction(tx);

            if (resTx.error) {
                txError.value = resTx.error;
                isLoading.value = false;
                setTimeout(() => {
                    txError.value = '';
                }, 3000);
                return;
            }
            successHash.value = getTxUrl(currentChainInfo.value.net, resTx.transactionHash);
            isLoading.value = false;

            setTimeout(() => {
                successHash.value = '';
            }, 4000);
        };

        onMounted(async () => {
            if (!zometNetworks.value.length) {
                await store.dispatch('networks/initZometNets');
            }
        });

        onUnmounted(() => {
            store.dispatch('tokens/setFromToken', null);
            if (!clearAddress.value) {
                store.dispatch('tokens/setAddress', '');
            }
        });

        return {
            isLoading,
            disabledSend,
            networks,
            groupTokens,
            tokensList,
            errorAddress,
            errorBalance,
            selectedToken,
            address,

            onRemoveFavourite,

            onSelectNetwork,
            onSetAddress,
            onSetToken,
            onSetAmount,
            send,
            txError,
            successHash,
            walletAddress,
            connectedWallet,
            zometNetworks,
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
