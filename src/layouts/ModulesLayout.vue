<template>
    <div class="layout-page">
        <div class="layout-page__content">
            <UnsupportedResult v-if="!component" />
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
                <component :is="component" />
                <!-- <Transition>
                    <SearchSelectToken
                        v-show="isOpenSearchSelect"
                        class="search-select-token"
                        :class="{ open: isOpenSearchSelect, close: !isOpenSearchSelect }"
                    />
                </Transition> -->
            </template>
        </div>
    </div>
</template>
<script>
import { onBeforeUnmount, onMounted, watch, ref, inject, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import redirectOrStay from '@/shared/utils/routes';

// import { useStore } from 'vuex';

// import useServices from '@/compositions/useServices';

import SimpleBridge from '@/components/dynamic/bridge/SimpleBridge.vue';
import SimpleSwap from '@/components/dynamic/swaps/SimpleSwap.vue';
import SimpleSend from '@/components/dynamic/send/SimpleSend.vue';
import SuperSwap from '@/components/dynamic/super-swap/SuperSwap.vue';
import UnsupportedResult from '@/components/ui/UnsupportedResult';
import ArrowUpIcon from '@/assets/icons/dashboard/arrowup.svg';

import SearchSelectToken from '../components/dynamic/SearchSelectToken.vue';

export default {
    name: 'ModulesLayout',
    components: {
        SimpleBridge,
        SimpleSend,
        SimpleSwap,
        SuperSwap,
        UnsupportedResult,
        ArrowUpIcon,
        SearchSelectToken,
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
        const useAdapter = inject('useAdapter');
        const { currentChainInfo, isConnecting } = useAdapter();
        // const store = useStore();
        const router = useRouter();
        const route = useRoute();

        // const isOpenSearchSelect = computed({
        //     get: () => store.getters['tokenOps/isOpenSelectSearch'],
        //     set: (value) => store.dispatch('tokenOps/setOpenSelectSearch', value),
        // });

        // * Module type
        const moduleType = ref('');

        // * Module values
        // const { resetToDefaultValues } = useServices({
        //     moduleType: moduleType.value,
        // });

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
            // isOpenSearchSelect.value = false;
        };

        const callRedirectOrStay = async () => {
            if (isConnecting.value) {
                return;
            }

            const isStay = await redirectOrStay(route.path, currentChainInfo.value);

            if (!currentChainInfo.value) {
                return router.push('/main');
            }
            if (!isStay) {
                return router.push('/main');
            }

            const { net = null } = currentChainInfo.value || {};

            if (!net) {
                return router.push('/main');
            }
        };

        const unWatchRedirect = watchEffect(async () => await callRedirectOrStay());

        onMounted(async () => {
            // isOpenSearchSelect.value = false;
            callResetToDefaultValues();
            await callRedirectOrStay();
        });

        const unWatchCurrRoute = watch(
            () => router.currentRoute.value,
            () => callResetToDefaultValues()
        );

        const unWatchIsConnecting = watch(
            () => isConnecting,
            () => callRedirectOrStay()
        );

        onBeforeUnmount(() => {
            unWatchRedirect();
            unWatchCurrRoute();
            unWatchIsConnecting();
            callResetToDefaultValues();
        });
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
        margin-bottom: 30px;

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
        bottom: -15px;
        right: 0;
        left: 0;
        margin: 0 auto;
    }
}
</style>
