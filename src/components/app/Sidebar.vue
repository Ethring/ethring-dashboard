<template>
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
        <div class="sidebar-items">
            <div class="sidebar-items__list">
                <div v-if="!isCollapsed" class="sidebar__logo-item">
                    <Logo class="sidebar__logo" />
                    <div class="sidebar__logo-type">{{ $t('sidebar.type') }}</div>
                </div>
                <LogoIcon v-else class="logo" />
                <SidebarList v-if="walletAddress" :collapsed="isCollapsed" />
            </div>
            <div class="sidebar-items__list">
                <div class="sidebar__settings" v-if="walletAddress">
                    <div class="sidebar__settings-icon">
                        <SettingsIcon />
                    </div>
                    <div v-if="!isCollapsed" class="sidebar__settings-title" :data-qa="`sidebar-item-settings`">
                        {{ $t(`sidebar.settings`) }}
                    </div>
                </div>
                <Socials class="sidebar__socials" :collapsed="isCollapsed" />
            </div>
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import Logo from './Logo';
import Socials from './Socials';
import SidebarList from './SidebarList';

import useAdapter from '@/Adapter/compositions/useAdapter';

import SettingsIcon from '@/assets/icons/dashboard/settings.svg';
import LogoIcon from '@/assets/icons/sidebar/logo.svg';

export default {
    name: 'Sidebar',
    components: {
        Logo,
        SidebarList,
        Socials,
        SettingsIcon,
        LogoIcon,
    },
    props: {
        collapsed: {
            type: Boolean,
            required: false,
        },
    },
    setup(props) {
        const { walletAddress } = useAdapter();

        const isCollapsed = computed(() => props.collapsed || false);

        return {
            walletAddress,
            isCollapsed,
        };
    },
};
</script>
<style lang="scss" scoped>
.sidebar {
    position: fixed;
    left: 0;

    z-index: 999;

    height: 100vh;

    background: var(--#{$prefix}primary);

    padding: 30px 25px;

    box-sizing: border-box;

    &-items {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        height: 100%;

        margin: 0 auto;

        &__list {
            @include pageFlexColumn;
        }

        &__list:last-child {
            margin-bottom: 40px;
        }
    }

    &__socials {
        width: 100%;
    }

    &__settings {
        @include pageFlexRow;
        align-self: flex-start;

        color: var(--#{$prefix}sidebar-text);
        margin-bottom: 50px;

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

    &.collapsed {
        .sidebar-items__list {
            align-items: center;
        }

        .sidebar__socials {
            flex-direction: column;
            align-items: flex-start;
        }

        .logo {
            margin-bottom: 70px;
        }

        .sidebar__settings {
            align-self: center;

            &-icon svg {
                transform: scale(1.2);
            }
        }
    }

    .menu {
        color: var(--#{$prefix}white);
    }
}
</style>
