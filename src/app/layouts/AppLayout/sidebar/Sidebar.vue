<template>
    <a-layout-sider :collapsed-width="0" :width="230" :collapsed="isCollapsed" :trigger="null" class="sidebar">
        <a-menu mode="inline" :default-selected-keys="['1']" class="sidebar-logo-menu">
            <a-menu-item key="1">
                <template #icon>
                    <SidebarLogo class="sidebar-logo" />
                </template>
                <span>Ethring</span>
            </a-menu-item>
        </a-menu>

        <a-menu mode="inline" :default-selected-keys="['1']" class="sidebar-menu">
            <a-sub-menu key="dashboard-menu">
                <template #icon>
                    <DashboardIcon />
                </template>
                <template #title>
                    <span>
                        <span>Dashboard</span>
                    </span>
                </template>
                <a-menu-item key="dashboard-assets">Assets</a-menu-item>
                <a-menu-item key="dashboard-defi">DeFi</a-menu-item>
            </a-sub-menu>
            <a-sub-menu key="restake-menu">
                <template #icon>
                    <RestakeIcon class="stroke-icons" />
                </template>
                <template #title>
                    <span>
                        <span>Restake</span>
                    </span>
                </template>
                <a-menu-item key="restake-assets">Assets</a-menu-item>
                <a-menu-item key="restake-defi">DeFi</a-menu-item>
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

        <div class="sidebar-footer">
            <span class="sidebar-footer-copyright">© Ethring 2025</span>
            <div class="sidebar-footer-links">
                <a href="#" @click.prevent=""> Privacy Policy </a>
                <a href="#" @click.prevent=""> Docs </a>
                <a href="#" @click.prevent="">T&Cs </a>
                <a href="#" @click.prevent=""> Send Feedback </a>
                <a href="#" @click.prevent=""> Partnership </a>
            </div>

            <div class="sidebar-footer-socials">
                <a href="#" @click.prevent=""> <MirrorIcon /> </a>
                <a href="#" @click.prevent=""> <XTwitterIcon /> </a>
                <a href="#" @click.prevent=""> <DiscordIcon /> </a>
                <a href="#" @click.prevent=""> <WarpcastIcon /> </a>
                <a href="#" @click.prevent=""> <LensIcon /> </a>
            </div>
        </div>
    </a-layout-sider>
</template>
<script>
import SidebarLogo from '@/assets/icons/sidebar/sidebar-logo.svg';
import DashboardIcon from '@/assets/icons/sidebar/dashboard.svg';
import RestakeIcon from '@/assets/icons/sidebar/restake.svg';
import ProtocolsIcon from '@/assets/icons/sidebar/protocols.svg';
import ExploreIcon from '@/assets/icons/sidebar/explore.svg';
import TransactionsIcon from '@/assets/icons/sidebar/transactions.svg';

import MirrorIcon from '@/assets/icons/socials/mirror.svg';
import XTwitterIcon from '@/assets/icons/socials/x-twitter.svg';
import DiscordIcon from '@/assets/icons/socials/discord-channel.svg';
import WarpcastIcon from '@/assets/icons/socials/warpcast-channel.svg';
import LensIcon from '@/assets/icons/socials/lens.svg';

export default {
    name: 'Sidebar',
    components: {
        SidebarLogo,
        DashboardIcon,
        RestakeIcon,
        ExploreIcon,
        ProtocolsIcon,
        TransactionsIcon,

        MirrorIcon,
        XTwitterIcon,
        DiscordIcon,
        WarpcastIcon,
        LensIcon,
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
