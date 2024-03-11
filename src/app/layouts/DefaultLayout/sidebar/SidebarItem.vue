<template>
    <a-menu-item :key="menuKey" class="sidebar-item" :disabled="disabled" :role="role">
        <template #icon>
            <div class="sidebar-item__icon" :class="{ [type]: type }">
                <component :is="icon" />
            </div>
        </template>
        <a-space>
            <span class="sidebar-item__title">
                {{ title }}
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
import SettingsIcon from '@/assets/icons/sidebar/settings.svg';

export default {
    name: 'SidebarItem',
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
    },
    components: {
        overviewIcon,
        swapIcon,
        sendIcon,
        bridgeIcon,
        superSwapIcon,
        buyCryptoIcon,
        shortcutIcon,

        SettingsIcon,
    },
    setup() {},
};
</script>
