<template>
    <div class="sidebar-list">
        <router-link v-for="(item, ndx) in menu" :key="ndx" :to="item.to" class="sidebar-list__item">
            <div class="sidebar-list__item-icon">
                <component v-if="item.component" :is="item.component" />
            </div>
            <div class="sidebar-list__item-title">
                {{ $t(`sidebar.${item.key}`) }}
            </div>
        </router-link>
    </div>
</template>
<script>
import mainSvg from '@/assets/icons/sidebar/main.svg';
import swapSvg from '@/assets/icons/sidebar/swap.svg';
import stakeSvg from '@/assets/icons/sidebar/stake.svg';
import sendSvg from '@/assets/icons/sidebar/send.svg';

import { UIConfig } from '@/config/ui';

import { computed } from 'vue';
import useWeb3Onboard from '@/compositions/useWeb3Onboard';

export default {
    name: 'SidebarList',
    components: {
        mainSvg,
        swapSvg,
        stakeSvg,
        sendSvg,
    },
    setup() {
        const { currentChainInfo } = useWeb3Onboard();

        const menu = computed(() => {
            if (!currentChainInfo.value.citadelNet) {
                return [];
            }

            if (!UIConfig[currentChainInfo.value.citadelNet]) {
                return [];
            }

            return UIConfig[currentChainInfo.value.citadelNet].sidebar;
        });

        return {
            menu,
        };
    },
};
</script>
<style lang="scss" scoped>
.sidebar-list {
    align-self: flex-start;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    box-sizing: border-box;
    font-family: 'Poppins_Light';
    font-size: 24px;

    &__item {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        text-decoration: none;
        color: $colorLightGreen;
        cursor: pointer;

        @include animateEasy;

        &:hover {
            color: $colorPl;

            svg {
                fill: $colorPl;
            }
        }

        &.router-link-exact-active {
            color: $colorWhite;

            svg {
                fill: $colorBrightGreen;
            }
        }

        svg {
            fill: $colorLightGreen;
            transform: scale(0.8);
            @include animateEasy;
        }
    }

    &__item-icon {
        display: flex;
        justify-content: center;
        width: 32px;
    }

    &__item-title {
        margin-left: 10px;
    }
}

body.dark {
    .sidebar-list {
        &__item {
            color: $colorLightGreen;

            &.router-link-exact-active {
                color: $colorWhite;

                svg {
                    fill: $colorBrightGreen;
                }
            }

            &:hover {
                color: $colorPl;

                svg {
                    fill: $colorPl;
                }
            }

            svg {
                fill: $colorLightGreen;
            }
        }
    }
}
</style>
