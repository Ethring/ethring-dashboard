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

import useAdapter from '@/Adapter/compositions/useAdapter';

import UIConfig from '@/config/ui';

import Spinner from '@/components/app/Spinner';
import SimpleBridge from '@/components/dynamic/bridge/SimpleBridge.vue';
import SimpleSwap from '@/components/dynamic/swaps/SimpleSwap.vue';
import SimpleSend from '@/components/dynamic/send/SimpleSend.vue';
import SuperSwap from '@/components/dynamic/superswap/SuperSwap.vue';

export default {
    name: 'AppLayout',
    components: {
        Spinner,
        SimpleBridge,
        SimpleSend,
        SimpleSwap,
        SuperSwap,
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

        const { walletAccount, currentChainInfo } = useAdapter();

        const isTokensLoading = computed(() => store.getters['tokens/loader']);

        const spinnerLoader = computed(() => {
            return !walletAccount.value || !currentChainInfo.value || isTokensLoading.value;
        });

        const layoutComponent = computed(() => {
            const config = UIConfig(currentChainInfo.value?.net, currentChainInfo.value?.ecosystem);

            if (!config) {
                return null;
            }

            if (config[props.component].component) {
                return config[props.component].component;
            }

            return null;
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
