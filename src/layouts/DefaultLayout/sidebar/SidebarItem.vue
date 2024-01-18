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
                <a-tag v-if="status" color="#14ec8a" :bordered="false"> {{ status }}</a-tag>
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

        SettingsIcon,
    },
    setup() {},
};
</script>
<style lang="scss" scoped>
.sidebar-item {
    // width: 200px;
    &__title {
        color: var(--#{$prefix}sidebar-text);

        font-weight: 300;
        font-size: var(--#{$prefix}h5-fs);
    }

    &__icon {
        width: 20px;
        height: 20px;

        display: flex;
        justify-content: center;
        align-items: center;

        svg {
            // width: 100%;
            // height: 100%;

            &[fill='none'] {
                fill: var(--#{$prefix}sidebar-text);
            }
        }
    }
}
// .sidebar-list {
//     display: flex;
//     align-self: flex-start;
//     align-items: flex-start;
//     flex-direction: column;
//     box-sizing: border-box;

//     font-size: var(--#{$prefix}h5-fs);

//     &__item {
//         @include pageFlexRow;
//         @include animateEasy;

//         height: 48px;
//         text-decoration: none;
//         color: var(--#{$prefix}sidebar-text);
//         cursor: pointer;

//         &:hover:not(.disabled) {
//             color: var(--#{$prefix}icon-color);

//             svg {
//                 &[fill='none'] {
//                     fill: var(--#{$prefix}icon-color);
//                 }
//             }
//         }

//         &.router-link-exact-active:not(.disabled) {
//             color: var(--#{$prefix}white);

//             svg {
//                 fill: var(--#{$prefix}sidebar-active-color);
//             }
//         }

//         svg {
//             &[fill='none'] {
//                 fill: var(--#{$prefix}sidebar-text);
//             }
//             @include animateEasy;
//         }

//         &.disabled {
//             cursor: not-allowed;
//             color: var(--#{$prefix}checkbox-disabled-text);

//             .sidebar-list__item-status {
//                 color: var(--#{$prefix}checkbox-text);
//             }

//             .sidebar-list__item-icon svg {
//                 opacity: 0.5;
//             }
//         }
//     }

//     &__item-icon {
//         display: flex;
//         justify-content: center;
//         width: 32px;
//     }

//     &__item-title {
//         margin-left: 10px;

//         font-weight: 300;
//         font-size: var(--#{$prefix}h5-fs);

//         display: flex;
//         align-items: flex-start;
//     }

//     &__item-status {
//         color: var(--#{$prefix}sidebar-active-color);
//         font-size: var(--#{$prefix}small-sm-fs);
//         font-weight: 700;
//         margin-top: -6px;
//     }

//     &.collapsed {
//         align-self: center !important;

//         .sidebar-list {
//             align-self: center !important;

//             &__item-icon {
//                 svg {
//                     transform: scale(1.1);
//                 }
//             }
//         }
//     }
// }
</style>
