<template>
    <div class="sidebar">
        <div class="sidebar-items">
            <div class="sidebar__logo-item">
                <Logo class="sidebar__logo" />
                <div class="sidebar__logo-type">{{ $t('sidebar.type') }}</div>
            </div>
            <SidebarList v-if="walletAddress" />
            <Socials class="sidebar__socials" />
        </div>
    </div>
</template>
<script>
import Logo from './Logo';
import Socials from './Socials';
import SidebarList from './SidebarList';

import useAdapter from '@/Adapter/compositions/useAdapter';

export default {
    name: 'Sidebar',
    components: {
        Logo,
        SidebarList,
        Socials,
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
    padding: 40px 25px;

    box-sizing: border-box;

    &-items {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        max-width: 184px;
        margin: 0 auto;
    }

    &__socials {
        margin: auto auto 0;
        width: 100%;
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
