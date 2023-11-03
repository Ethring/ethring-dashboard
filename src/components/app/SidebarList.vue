<template>
    <div class="sidebar-list" :class="{ collapsed: collapsed }">
        <router-link
            v-for="(item, ndx) in menu"
            :key="ndx"
            :to="item.disabled ? '' : item.to"
            class="sidebar-list__item"
            :data-qa="item.key"
            :class="{ disabled: item.disabled }"
        >
            <div class="sidebar-list__item-icon">
                <component v-if="item.component" :is="item.component" />
            </div>
            <div v-if="!collapsed" class="sidebar-list__item-title" :data-qa="`sidebar-item-${item.key}`">
                {{ $t(`sidebar.${item.key}`) }}
                <div v-if="item.status" class="sidebar-list__item-status">{{ item.status }}</div>
            </div>
        </router-link>
    </div>
</template>

<script>
import { computed } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';
import UIConfig from '@/config/ui';

import overviewIcon from '@/assets/icons/sidebar/main.svg';
import swapIcon from '@/assets/icons/sidebar/swap.svg';
import stakeIcon from '@/assets/icons/sidebar/stake.svg';
import sendIcon from '@/assets/icons/sidebar/send.svg';
import bridgeIcon from '@/assets/icons/sidebar/bridge.svg';
import superSwapIcon from '@/assets/icons/sidebar/superSwap.svg';
import buyCryptoIcon from '@/assets/icons/sidebar/buy.svg';

export default {
    name: 'SidebarList',
    components: {
        overviewIcon,
        swapIcon,
        stakeIcon,
        sendIcon,
        bridgeIcon,
        superSwapIcon,
        buyCryptoIcon,
    },
    props: {
        collapsed: {
            type: Boolean,
            default: false,
        },
    },
    setup() {
        const { currentChainInfo } = useAdapter();

        const menu = computed(() => {
            if (!currentChainInfo.value?.ecosystem || !currentChainInfo.value?.net) {
                return [];
            }

            const config = UIConfig(currentChainInfo.value?.net, currentChainInfo.value?.ecosystem);

            if (!config) {
                return [];
            }

            return config.sidebar;
        });

        return {
            menu,
        };
    },
};
</script>
<style lang="scss" scoped>
.sidebar-list {
    display: flex;
    align-self: flex-start;
    align-items: flex-start;
    flex-direction: column;
    box-sizing: border-box;

    font-size: var(--#{$prefix}h3-fs);

    &__item {
        @include pageFlexRow;
        @include animateEasy;

        margin-bottom: 30px;
        text-decoration: none;
        color: var(--#{$prefix}sidebar-text);
        cursor: pointer;

        &:hover:not(.disabled) {
            color: $colorPl;

            svg {
                fill: $colorPl;
            }
        }

        &.router-link-exact-active:not(.disabled) {
            color: var(--#{$prefix}white);

            svg {
                fill: var(--#{$prefix}sidebar-active-color);
            }
        }

        svg {
            fill: var(--#{$prefix}sidebar-text);
            transform: scale(0.8);
            @include animateEasy;
        }

        &.disabled {
            opacity: 0.5;
            cursor: not-allowed;

            .sidebar-list__item-status {
                color: var(--#{$prefix}checkbox-text);
            }

            .sidebar-list__item-icon svg {
                opacity: 0.5;
            }
        }
    }

    &__item-icon {
        display: flex;
        justify-content: center;
        width: 32px;
    }

    &__item-title {
        margin-left: 10px;

        font-weight: 300;
        font-size: 20px;

        display: flex;
        align-items: flex-start;
    }

    &__item-status {
        color: var(--#{$prefix}sidebar-active-color);
        font-size: 12px;
        font-weight: 600;

        margin-left: 6px;
    }

    &.collapsed {
        align-self: center !important;

        .sidebar-list__item-icon svg {
            transform: scale(1);
        }

        .sidebar-list {
            align-self: center !important;
        }
    }
}
</style>
