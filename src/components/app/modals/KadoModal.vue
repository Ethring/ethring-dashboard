<template>
    <a-modal :open="open" centered :footer="null" class="modal" title="Kado" @cancel="closeModal">
        <iframe width="100%" height="520" frameBorder="{0}" :src="IFRAME_URL" class="buy-crypto-iframe" />
    </a-modal>
</template>
<script>
import { ref, onMounted, watch } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import { KADO_EVM_NETWORKS, KADO_COSMOS_NETWORKS, KADO_DEFAULT_COSMOS, KADO_ACTIONS, KADO_URL } from '@/config/kadoConstants';

import { ECOSYSTEMS } from '@/Adapter/config';

export default {
    name: 'KadoModal',
    components: {},
    props: {
        open: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const { currentChainInfo, walletAddress } = useAdapter();

        const currentChain = ref(currentChainInfo.value?.ecosystem || ECOSYSTEMS.EVM);

        const IFRAME_URL = ref('');

        onMounted(() => {
            if (walletAddress) {
                if (currentChain.value === ECOSYSTEMS.EVM) {
                    IFRAME_URL.value = `${KADO_URL}?apiKey=${process.env.VUE_APP_KADO_API_KEY}product=BUY&onPayCurrency=USD&onRevCurrency=USDC&onToAddress=${walletAddress.value}&networkList=${KADO_EVM_NETWORKS}&productList=${KADO_ACTIONS}`;
                } else {
                    IFRAME_URL.value = `${KADO_URL}?apiKey=${process.env.VUE_APP_KADO_API_KEY}&product=BUY&onPayCurrency=USD&onRevCurrency=ATOM&network=COSMOS HUB&onToAddress=${walletAddress.value}&networkList=${KADO_COSMOS_NETWORKS}&productList=${KADO_ACTIONS}`;
                }
            }
        });

        const closeModal = () => {
            if (props.open) {
                emit('close:modal', false);
            }
        };

        watch(walletAddress, () => {
            currentChain.value = currentChainInfo.value.ecosystem;

            if (currentChain.value === ECOSYSTEMS.EVM) {
                IFRAME_URL.value = `${KADO_URL}?apiKey=${KADO_URL}&product=BUY&onPayCurrency=USD&onRevCurrency=USDC&onToAddress=${walletAddress.value}&networkList=${KADO_EVM_NETWORKS}&productList=${KADO_ACTIONS}`;
            } else {
                IFRAME_URL.value = `${KADO_URL}?apiKey=${KADO_URL}&product=BUY&onPayCurrency=USD&onRevCurrency=ATOM&network=${KADO_DEFAULT_COSMOS}&onToAddress=${walletAddress.value}&networkList=${KADO_COSMOS_NETWORKS}&productList=${KADO_ACTIONS}`;
            }
        });
        return {
            closeModal,
            IFRAME_URL,
        };
    },
};
</script>
<style lang="scss" scoped>
</style>
