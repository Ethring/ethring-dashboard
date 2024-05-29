<template>
    <a-modal :open="buyCryptoModal" centered :footer="null" class="modal" title="Kado" @cancel="closeModal">
        <LogoLoading :spinning="!isKadoLoaded">
            <template #content>
                <div class="buy-crypto-iframe">
                    <iframe
                        v-if="IFRAME_URL"
                        :src="IFRAME_URL"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        @load="() => (isKadoLoaded = true)"
                    />
                </div>
            </template>
        </LogoLoading>
    </a-modal>
</template>
<script>
import { computed, inject, ref } from 'vue';

import { KADO_EVM_NETWORKS, KADO_COSMOS_NETWORKS, KADO_DEFAULT_COSMOS, KADO_ACTIONS, KADO_URL } from '@/config/kadoConstants';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import LogoLoading from '@/components/ui/LogoLoading.vue';

export default {
    name: 'KadoModal',
    components: {
        LogoLoading,
    },
    setup() {
        const BASE_URL = `${KADO_URL}?apiKey=${process.env.KADO_API_KEY}&product=BUY&onPayCurrency=USD`;
        const router = useRouter();

        const store = useStore();
        const isKadoLoaded = ref(false);

        const useAdapter = inject('useAdapter');
        const { currentChainInfo, walletAddress } = useAdapter();

        const buyCryptoModal = computed({
            get: () => store.getters['app/modal']('buyCrypto'),
            set: () => store.dispatch('app/toggleModal', 'buyCrypto'),
        });

        const URLS = {
            [Ecosystem.EVM]: `${BASE_URL}&onRevCurrency=USDC&onToAddress=${walletAddress.value}&networkList=${KADO_EVM_NETWORKS}&productList=${KADO_ACTIONS}`,
            [Ecosystem.COSMOS]: `${BASE_URL}&onRevCurrency=ATOM&network=${KADO_DEFAULT_COSMOS}&onToAddress=${walletAddress.value}&networkList=${KADO_COSMOS_NETWORKS}&productList=${KADO_ACTIONS}`,
        };

        const IFRAME_URL = computed(() => {
            if (!buyCryptoModal.value) return null;

            return URLS[currentChainInfo.value?.ecosystem] || BASE_URL;
        });

        const closeModal = () => {
            store.dispatch('app/toggleModal', 'buyCrypto');
            store.dispatch('app/setSelectedKey', [router.currentRoute.value?.meta?.key || 'main']);

            isKadoLoaded.value = false;
        };

        return {
            isKadoLoaded,

            buyCryptoModal,
            closeModal,
            IFRAME_URL,
        };
    },
};
</script>
<style lang="scss" scoped>
.buy-crypto-iframe {
    border: 1px solid var(--#{$prefix}border-color);
    display: flex;
    justify-content: center;
    align-items: center;

    &,
    iframe {
        min-height: 300px;
        max-height: 520px;
        height: 520px;
        border-radius: 16px;
    }
}
</style>
