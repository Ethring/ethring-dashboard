<template>
    <a-modal :open="open" centered :footer="null" class="modal" title="Kado" @cancel="closeModal">
        <iframe width="100%" height="520" frameBorder="0" :src="IFRAME_URL" class="buy-crypto-iframe" />
    </a-modal>
</template>
<script>
import { computed, inject } from 'vue';

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
        const useAdapter = inject('useAdapter');

        const { currentChainInfo, walletAddress } = useAdapter();
        const BASE_URL = `${KADO_URL}?apiKey=${process.env.VUE_APP_KADO_API_KEY}&product=BUY&onPayCurrency=USD`;

        const IFRAME_URL = computed(() => {
            switch (currentChainInfo.value?.ecosystem) {
                case ECOSYSTEMS.EVM:
                    return `${BASE_URL}&onRevCurrency=USDC&onToAddress=${walletAddress.value}&networkList=${KADO_EVM_NETWORKS}&productList=${KADO_ACTIONS}`;
                case ECOSYSTEMS.COSMOS:
                    return `${BASE_URL}&onRevCurrency=ATOM&network=${KADO_DEFAULT_COSMOS}&onToAddress=${walletAddress.value}&networkList=${KADO_COSMOS_NETWORKS}&productList=${KADO_ACTIONS}`;
                default:
                    return `${BASE_URL}&onRevCurrency=USDC`;
            }
        });

        const closeModal = () => {
            if (props.open) {
                emit('close:modal', false);
            }
        };

        return {
            closeModal,
            IFRAME_URL,
        };
    },
};
</script>
<style lang="scss" scoped>
.buy-crypto-iframe {
    border-radius: 16px;
}

.loader-container {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
