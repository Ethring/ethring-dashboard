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
            <router-link to="/dashboard">
                <a-menu-item key="dashboard">
                    <template #icon>
                        <DashboardIcon />
                    </template>
                    <span>Dashboard</span>
                </a-menu-item>
            </router-link>
            <router-link to="/earn">
                <a-menu-item key="restake">
                    <template #icon>
                        <RestakeIcon class="stroke-icons" />
                    </template>
                    <span>Restake</span>
                </a-menu-item>
            </router-link>
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
                <a href="#" class="disabled" @click.prevent=""> Privacy Policy </a>
                <a href="#" class="disabled" @click.prevent="">T&Cs </a>
                <a href="#" class="disabled" @click.prevent=""> Docs </a>
                <a href="#" class="disabled" @click.prevent=""> Send Feedback </a>
                <a
                    href="https://docs.google.com/forms/d/1apiOuHXF2t_SHvulN4MG8_jdPYDrGNcFg74DBsZrZsc/edit"
                    target="_blank"
                    title="Partnership Ethring"
                >
                    Partnership
                </a>
            </div>

            <div class="sidebar-footer-socials">
                <a href="https://mirror.xyz/ethring.eth" target="_blank" title="Miro Ethring"> <MirrorIcon /> </a>
                <a href="https://x.com/Ethring_io" target="_blank" title="X.com/Twitter Ethring">
                    <XTwitterIcon />
                </a>
                <a href="https://discord.gg/jujUmHVg5Q" target="_blank" title="Discord Ethring"> <DiscordIcon /> </a>
                <a href="https://warpcast.com/ethring.eth" target="_blank" title="Warpcast Ethring"> <WarpcastIcon /> </a>
                <a href="https://hey.xyz/u/ethring" target="_blank" title="Lens Ethring"> <LensIcon /> </a>
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
