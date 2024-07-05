<template>
    <div class="layout-page">
        <div class="layout-page__content">
            <UnsupportedResult v-if="!component" />
            <template v-else>
                <div class="layout-page-tab">
                    <router-link
                        v-for="tab in tabs"
                        :key="tab"
                        class="layout-page-tab__title"
                        :class="{ 'layout-page-tab__active': tab.active, 'layout-page-tab__default': tabs.length <= 1 }"
                        :to="tab.to"
                    >
                        {{ $t(tab.title) }}
                        <ArrowUpIcon v-if="tab.active && tabs.length > 1" class="arrow" />
                    </router-link>
                </div>
                <component :is="component" class="module-layout-view" />
                <OperationResult v-if="operationResult?.title" v-bind="operationResult" :module="currentModule" />
            </template>
        </div>
    </div>
</template>
<script>
import { onBeforeUnmount, onMounted, watch, ref, computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

import SimpleSend from '@/pages/dynamic-modules/SimpleSend.vue';
import SuperSwap from '@/pages/dynamic-modules/SuperSwap.vue';

import UnsupportedResult from '@/components/ui/UnsupportedResult.vue';
import OperationResult from '@/components/ui/Result.vue';
import ArrowUpIcon from '@/assets/icons/module-icons/pointer-up.svg';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

export default {
    name: 'ModulesLayout',
    components: {
        SimpleSend,
        SuperSwap,
        OperationResult,
        UnsupportedResult,
        ArrowUpIcon,
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

        const { currentChainInfo, isConnecting } = useAdapter();

        const router = useRouter();

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

            if (!moduleType.value) return;

            const { back } = router.options.history.state || {};

            if (back && back.includes(moduleType.value)) return;

            // resetToDefaultValues();
        };

        const callRedirectOrStay = async () => {
            if (isConnecting.value) return;

            if (isConfigLoading.value) return;

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

        watch(operationResult, () => {
            store.dispatch('app/toggleModal', 'txResultModal');
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
            font-weight: 700;
        }

        &__default {
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
