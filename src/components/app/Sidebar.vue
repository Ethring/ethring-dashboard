<template>
    <div class="sidebar">
        <div class="sidebar-items">
            <div class="sidebar-items-list">
                <div class="sidebar__logo-item">
                    <Logo class="sidebar__logo" />
                    <div class="sidebar__logo-type">{{ $t('sidebar.type') }}</div>
                </div>
                <SidebarList v-if="walletAddress" />
            </div>
            <div class="sidebar__settings" v-if="walletAddress">
                <div class="sidebar__settings-icon">
                    <SettingsSvg />
                </div>
                <div class="sidebar__settings-title" :data-qa="`sidebar-item-settings`">
                    {{ $t(`sidebar.settings`) }}
                </div>
            </div>
            <Socials class="sidebar__socials" />
        </div>
    </div>
</template>
<script>
import Logo from './Logo';
import Socials from './Socials';
import SidebarList from './SidebarList';

import useAdapter from '@/Adapter/compositions/useAdapter';

import SettingsSvg from '@/assets/icons/dashboard/settings.svg';

export default {
    name: 'Sidebar',
    components: {
        Logo,
        SidebarList,
        Socials,
        SettingsSvg,
    },
    setup() {
        const { walletAddress } = useAdapter();

        return {
            walletAddress,
        };
    },
};
</script>
<style lang="scss" scoped>
.sidebar {
    position: fixed;
    left: 0;

    z-index: 999;

    max-width: 260px;
    width: 100%;
    height: 100vh;
    background: var(--#{$prefix}primary);
    padding: 30px 25px;

    box-sizing: border-box;

    &-items {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        max-width: 184px;
        margin: 0 auto;
    }

    &__socials {
        width: 100%;
    }

    &__settings {
        display: flex;
        align-self: flex-start;
        align-items: center;
        color: var(--#{$prefix}sidebar-text);
        cursor: not-allowed;
        opacity: 0.5;

        @include animateEasy;

        &-icon {
            display: flex;
            justify-content: center;
            width: 32px;
        }

        svg {
            fill: var(--#{$prefix}sidebar-text);
        }

        &-title {
            font-size: var(--#{$prefix}h5-fs);
            font-weight: 300;
            color: var(--zmt-sidebar-text);
            margin-left: 10px;
        }
    }

    &__logo {
        margin-bottom: 70px;

        &-item {
            display: flex;
            align-items: flex-start;
        }

        &-type {
            color: var(--#{$prefix}sidebar-active-color);
            font-size: 12px;
            font-weight: 700;
        }
    }
}
</style>
