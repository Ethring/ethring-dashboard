<template>
    <AppLayout component="send">
        <div class="send-page-tab">
            <div class="send-page__title__active send-page-tab__active">
                {{ $t('simpleSend.title') }}
                <ArrowUpIcon class="arrow" />
            </div>
            <router-link v-if="!isModuleDisabled('/bridge')" class="send-page__title" to="/bridge">{{
                $t('simpleBridge.title')
            }}</router-link>
        </div>
    </AppLayout>
</template>
<script>
import useAdapter from '@/Adapter/compositions/useAdapter';

import UIConfig from '@/config/ui';

import AppLayout from '@/layouts/AppLayout.vue';

import ArrowUpIcon from '@/assets/icons/dashboard/arrowup.svg';

export default {
    name: 'Send',
    components: {
        AppLayout,
        ArrowUpIcon,
    },
    setup() {
        const { currentChainInfo } = useAdapter();

        const config = UIConfig(currentChainInfo.value?.net, currentChainInfo.value?.ecosystem);

        const isModuleDisabled = (sidebarItem) => {
            const sidebarModule = config.sidebar.find((module) => module.to === sidebarItem);

            if (sidebarModule) {
                return sidebarModule.disabled === true;
            }

            return false;
        };

        return {
            isModuleDisabled,
        };
    },
};
</script>
<style lang="scss" scoped>
.send-page-tab {
    display: flex;
    justify-content: space-around;
    align-items: baseline;
    width: calc(100% - 260px);

    max-width: 685px;

    &__active {
        @include pageFlexColumn;
        color: var(--#{$prefix}black);
    }
}

.send-page__title {
    color: var(--#{$prefix}base-text);
    font-size: var(--#{$prefix}h1-fs);
    font-weight: 600;
    margin-bottom: 30px;
    text-decoration: none;

    &__active {
        font-size: var(--#{$prefix}h1-fs);
        font-weight: 600;
        margin-bottom: 30px;
        text-decoration: none;
        color: var(--#{$prefix}primary-text);
    }
}

.arrow {
    fill: var(--#{$prefix}arrow-color);
    margin-top: 10px;
}
</style>
