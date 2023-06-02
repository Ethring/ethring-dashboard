<template>
    <div class="simple-send">
        <SelectNetwork :items="zometNetworks" :current="currentChainInfo" @select="onSelectNetwork" />
        <SelectAddress
            :selected-network="currentChainInfo"
            :items="[]"
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
            :value="tokensList[0]"
            :error="!!errorBalance"
            :label="$t('simpleSend.amount')"
            :on-reset="successHash"
            class="mt-10"
            @setAmount="onSetAmount"
            @setToken="onSetToken"
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

import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import * as ethers from 'ethers';

// import { getTxUrl } from '@/helpers/utils';
import useWeb3Onboard from '@/compositions/useWeb3Onboard';

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

        const { walletAddress, connectedWallet, currentChainInfo, setChain } = useWeb3Onboard();

        const isLoading = ref(false);
        const txError = ref('');
        const successHash = ref('');

        const selectedNetwork = ref(currentChainInfo.value);
        const selectedToken = ref(null);
        const amount = ref('');
        const address = ref('');

        const errorAddress = ref('');
        const errorBalance = ref('');

        const { groupTokens } = useTokens();

        // const favouritesList = computed(() => store.getters['tokens/favourites']);
        const zometNetworks = computed(() => store.getters['networks/zometNetworks']);

        const disabledSend = computed(() => {
            return (
                isLoading.value ||
                errorAddress.value ||
                errorBalance.value ||
                !+amount.value ||
                !address.value.length ||
                !selectedNetwork.value ||
                !selectedToken.value
            );
        });

        const networks = computed(() => store.getters['networks/networks']);

        const tokensList = computed(() => {
            if (!selectedNetwork.value) {
                return [];
            }
            const currentNetworkToken = groupTokens.value[0];

            return [currentNetworkToken, ...groupTokens.value[0].list];
        });

        const onSelectNetwork = async (network) => {
            if (network.id || network.chain_id) {
                await setChain({
                    chainId: network.id || network.chain_id,
                });
                selectedNetwork.value = network;
            }
        };

        const onSetToken = (token) => {
            selectedToken.value = token;
        };

        const onSetAddress = (addr) => {
            const reg = new RegExp(networks.value[currentChainInfo.value.citadelNet].validating);
            address.value = addr;

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
            errorBalance.value = '';
        };

        const onRemoveFavourite = (params) => {
            console.log(params);
            store.dispatch('tokens/removeFavourite', params);
        };

        const send = async () => {
            if (disabledSend.value) {
                return;
            }

            const { provider, label } = connectedWallet.value || {};

            if (!provider) {
                alert('Wallet not ready');
            }

            if (provider && label) {
                const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');

                const signer = ethersProvider.getSigner();

                const response = await store.dispatch('tokens/prepareTransfer', {
                    net: selectedToken.value.net || selectedToken.value.network,
                    from: walletAddress.value,
                    toAddress: address.value,
                    amount: amount.value,
                });

                const tx = response.transaction || response;
                tx.gasPrice = await signer.getGasPrice();

                delete tx.gas;

                const txn = await signer.sendTransaction(tx);

                const receipt = await txn.wait();
                console.log(receipt);
            }

            isLoading.value = true;
            txError.value = '';
        };

        onMounted(async () => {
            await store.dispatch('networks/initZometNets');
        });

        return {
            isLoading,
            disabledSend,
            networks,
            groupTokens,
            tokensList,
            errorAddress,
            errorBalance,
            selectedNetwork,

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
