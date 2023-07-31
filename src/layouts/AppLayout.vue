<template>
    <div class="layout">
        <div class="layout-page">
            <Spinner v-if="spinnerLoader" />
            <template v-else>
                <slot />
                <div class="layout-page__content">
                    <component v-if="layoutComponent" :is="layoutComponent" />
                </div>
            </template>
        </div>
    </div>
</template>
<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

import { UIConfig } from '@/config/ui';

import Spinner from '@/components/app/Spinner';
import SimpleBridge from '@/components/dynamic/bridge/SimpleBridge.vue';
import SimpleSwap from '@/components/dynamic/swaps/SimpleSwap.vue';
import SimpleSend from '@/components/dynamic/send/SimpleSend.vue';
import SuperSwap from '@/components/dynamic/superswap/SuperSwap.vue';
import arrowupSvg from '@/assets/icons/dashboard/arrowup.svg';

export default {
    name: 'AppLayout',
    components: {
        Spinner,
        SimpleBridge,
        SimpleSend,
        SimpleSwap,
        SuperSwap,
        arrowupSvg,
    },
    props: {
        component: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const store = useStore();
        const router = useRouter();

        const { groupTokens } = useTokens();
        const { walletAddress, currentChainInfo } = useWeb3Onboard();

        const loader = computed(() => store.getters['tokens/loader']);

        const spinnerLoader = computed(() => {
            return loader.value || !groupTokens.value[0]?.name || !walletAddress.value;
        });

        const layoutComponent = computed(() => {
            return UIConfig[currentChainInfo.value.net]?.[props.component].component;
        });

        watch(
            () => layoutComponent.value,
            (newV) => {
                if (!newV) {
                    router.push('/main');
                }
            }
        );

        return {
            loader,
            groupTokens,
            walletAddress,
            layoutComponent,
            spinnerLoader,
        };
    },
};
</script>
<style lang="scss" scoped>
.layout {
    @include pageStructure;

    .layout-page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);
    }
}
</style>
