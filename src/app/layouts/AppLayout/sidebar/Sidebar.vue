<template>
    <a-layout-sider :collapsed-width="0" :width="256" :collapsed="isCollapsed" :trigger="null" class="sidebar">
        <a-menu mode="inline" :default-selected-keys="['1']" class="sidebar-logo-menu">
            <a-menu-item key="1">
                <template #icon>
                    <SidebarLogo class="sidebar-logo" />
                </template>
                <span>Ethring</span>
            </a-menu-item>
        </a-menu>

        <a-menu mode="inline" :default-selected-keys="['1']" class="sidebar-menu">
            <a-menu-item key="1">
                <template #icon>
                    <DashboardIcon />
                </template>
                <span>Dashboard</span>
            </a-menu-item>
            <a-sub-menu key="restake-menu">
                <template #icon>
                    <RestakeIcon class="stroke-icons" />
                </template>
                <template #title>
                    <span>
                        <span>Restake</span>
                    </span>
                </template>
                <a-menu-item key="assets">Assets</a-menu-item>
                <a-menu-item key="defi">DeFi</a-menu-item>
            </a-sub-menu>
            <a-menu-item key="2" disabled>
                <template #icon>
                    <ProtocolsIcon class="stroke-icons" />
                </template>
                <span>Protocols</span>
            </a-menu-item>
            <a-menu-item key="3" disabled>
                <template #icon>
                    <ExploreIcon />
                </template>
                <span>Explore</span>
            </a-menu-item>
            <a-menu-item key="4" disabled>
                <template #icon>
                    <TransactionsIcon />
                </template>
                <span>Transactions</span>
            </a-menu-item>
        </a-menu>
    </a-layout-sider>
</template>
<script>
import SidebarLogo from '@/assets/icons/sidebar/sidebar-logo.svg';
import DashboardIcon from '@/assets/icons/sidebar/dashboard.svg';
import RestakeIcon from '@/assets/icons/sidebar/restake.svg';
import ProtocolsIcon from '@/assets/icons/sidebar/protocols.svg';
import ExploreIcon from '@/assets/icons/sidebar/explore.svg';
import TransactionsIcon from '@/assets/icons/sidebar/transactions.svg';

export default {
    name: 'Sidebar',
    components: {
        SidebarLogo,
        DashboardIcon,
        RestakeIcon,
        ExploreIcon,
        ProtocolsIcon,
        TransactionsIcon,
    },
    props: {
        isCollapsed: {
            type: Boolean,
            default: false,
        },
    },
};
</script>
<style lang=""></style>
