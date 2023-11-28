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
import { computed } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import UIConfig from '@/config/ui';

import Spinner from '@/components/app/Spinner';
import SimpleBridge from '@/components/dynamic/bridge/SimpleBridge.vue';
import SimpleSwap from '@/components/dynamic/swaps/SimpleSwap.vue';
import SimpleSend from '@/components/dynamic/send/SimpleSend.vue';
import SuperSwap from '@/components/dynamic/super-swap/SuperSwap.vue';

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
        const { walletAccount, currentChainInfo } = useAdapter();

        const spinnerLoader = computed(() => !walletAccount.value);

        const layoutComponent = computed(() => {
            const { net = null, ecosystem = null } = currentChainInfo.value || {};

            if (!net || !ecosystem) {
                return null;
            }

            const config = UIConfig(net, ecosystem);

            if (!config) {
                return null;
            }

            if (config[props.component]?.component) {
                return config[props.component]?.component;
            }

            return null;
        });

        return {
            layoutComponent,
            spinnerLoader,
        };
    },
};
</script>
<style lang="scss" scoped>
.layout {
    .layout-page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);
    }
}
</style>
