<template>
    <div class="layout-page">
        <div class="layout-page__content">
            <UnsupportedResult v-if="currentChainInfo && !currentChainInfo.net" />
            <template v-else>
                <div class="layout-page-tab">
                    <router-link
                        v-for="tab in tabs"
                        v-bind:key="tab"
                        class="layout-page-tab__title"
                        :class="{ 'layout-page-tab__active': tab.active }"
                        :to="tab.to"
                    >
                        {{ $t(tab.title) }}
                        <ArrowUpIcon v-if="tab.active && tabs.length > 1" class="arrow" />
                    </router-link>
                </div>
                <component :is="component" class="module-layout-view" />
                <OperationResult v-if="operationResult?.title" v-bind="operationResult" :module="currentModule" />
                <SelectModal />
            </template>
        </div>
    </div>
</template>
<script>
import { onBeforeUnmount, onMounted, watch, ref, computed, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';

import SimpleBridge from '@/components/dynamic/bridge/SimpleBridge.vue';
import SimpleSwap from '@/components/dynamic/swaps/SimpleSwap.vue';
import SimpleSend from '@/components/dynamic/send/SimpleSend.vue';
import SuperSwap from '@/components/dynamic/super-swap/SuperSwap.vue';

import SelectModal from '@/components/app/modals/SelectModal.vue';

import UnsupportedResult from '@/components/ui/UnsupportedResult';
import OperationResult from '@/components/ui/Result';
import ArrowUpIcon from '@/assets/icons/module-icons/pointer-up.svg';

import redirectOrStay from '@/shared/utils/routes';
import useAdapter from '@/Adapter/compositions/useAdapter';

export default {
    name: 'ModulesLayout',
    components: {
        SimpleBridge,
        SimpleSend,
        SimpleSwap,
        SuperSwap,
        OperationResult,
        UnsupportedResult,
        ArrowUpIcon,
        SelectModal,
    },
    props: {
        component: {
            type: String,
            required: true,
        },
        tabs: {
            type: Array,
            required: true,
        },
    },

    setup() {
        const store = useStore();

        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        const { currentChainInfo, isConnecting, walletAccount } = useAdapter();

        const router = useRouter();
        const route = useRoute();

        const currentModule = computed(() => {
            const { name, meta } = router.currentRoute.value;
            const { key } = meta || {};

            return key || name;
        });

        const operationResult = computed(() => store.getters['tokenOps/getOperationResultByModule'](currentModule.value));

        // * Module type
        const moduleType = ref('');

        const setModuleType = () => {
            const { meta, params } = router.currentRoute.value || {};
            const module = meta?.key || params?.module || null;

            return (moduleType.value = module);
        };

        const callResetToDefaultValues = () => {
            setModuleType();

            if (!moduleType.value) {
                return;
            }

            const { back } = router.options.history.state || {};

            if (back && back.includes(moduleType.value)) {
                return;
            }

            // resetToDefaultValues();
        };

        const callRedirectOrStay = async () => {
            if (isConnecting.value) {
                return;
            }

            if (isConfigLoading.value) {
                return;
            }

            const isStay = await redirectOrStay(route.path, currentChainInfo.value);

            if (!isStay || !walletAccount.value) {
                return router.push('/main');
            }

            return;
        };

        const unWatchRedirect = watchEffect(async () => await callRedirectOrStay());

        onMounted(async () => {
            callResetToDefaultValues();
            await callRedirectOrStay();

            store.dispatch('tokenOps/resetOperationResult', currentModule.value);
        });

        const unWatchCurrRoute = watch(
            () => router.currentRoute.value,
            () => callResetToDefaultValues(),
        );

        const unWatchIsConnecting = watch(
            () => isConnecting,
            async () => await callRedirectOrStay(),
        );

        onBeforeUnmount(() => {
            unWatchRedirect();
            unWatchCurrRoute();
            unWatchIsConnecting();
            callResetToDefaultValues();
        });

        return {
            currentChainInfo,
            operationResult,
            currentModule,
        };
    },
};
</script>
<style lang="scss" scoped>
.layout-page {
    @include pageFlexColumn;
    position: relative;

    &-tab {
        display: flex;
        justify-content: space-around;
        align-items: center;
        max-width: 685px;
        margin-bottom: 24px;

        &__title {
            position: relative;

            color: var(--#{$prefix}base-text);

            font-size: var(--#{$prefix}h3-fs);
            font-weight: 400;
        }

        &__active {
            color: var(--#{$prefix}primary-text);
            font-weight: 500;
        }
    }

    .arrow {
        fill: var(--#{$prefix}arrow-color);
        position: absolute;
        bottom: -14px;
        right: 0;
        left: 0;
        margin: 0 auto;
    }
}
</style>
