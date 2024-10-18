<template>
    <a-menu-item :key="menuKey" class="sidebar-item" :class="{ [type]: type }" :disabled="disabled" :role="role">
        <template #icon>
            <div class="sidebar-item__icon" :class="{ [type]: type }">
                <component :is="icon" />
            </div>
        </template>
        <a-space>
            <span class="sidebar-item__title">
                <a v-if="type === 'link'" :href="link" target="_blank">{{ title }}</a>
                <span v-else>{{ title }}</span>
                <a-tag v-if="status" color="#14ec8a" :bordered="false" class="sidebar-item__tag"> {{ status }}</a-tag>
            </span>
        </a-space>
    </a-menu-item>
</template>

<script>
import overviewIcon from '@/assets/icons/sidebar/overview.svg';
import swapIcon from '@/assets/icons/sidebar/swap.svg';
import sendIcon from '@/assets/icons/sidebar/send.svg';
import bridgeIcon from '@/assets/icons/sidebar/bridge.svg';
import superSwapIcon from '@/assets/icons/sidebar/super-swap.svg';
import buyCryptoIcon from '@/assets/icons/sidebar/buy-crypto.svg';
import shortcutIcon from '@/assets/icons/sidebar/shortcut.svg';
import portfolioIcon from '@/assets/icons/sidebar/portfolio.svg';

import feedbackIcon from '@/assets/icons/sidebar/feedback';

export default {
    name: 'SidebarItem',
    components: {
        overviewIcon,
        swapIcon,
        sendIcon,
        bridgeIcon,
        superSwapIcon,
        buyCryptoIcon,
        shortcutIcon,
        feedbackIcon,
        portfolioIcon,
    },
    props: {
        collapsed: {
            type: Boolean,
            default: false,
        },
        menuKey: {
            type: String,
            default: 'menu-item',
        },
        type: {
            type: String,
            default: 'menu',
        },
        role: {
            type: String,
            default: 'menuitem',
        },
        title: {
            type: String,
            default: 'Menu item',
        },
        icon: {
            type: String,
            default: 'user-outlined',
        },
        to: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            default: '',
        },
        link: {
            type: String,
            default: '',
        },
    },
    setup() {},
};
</script>
