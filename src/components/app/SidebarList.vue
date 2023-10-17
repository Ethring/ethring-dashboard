<template>
    <div class="sidebar-list">
        <router-link v-for="(item, ndx) in menu" :key="ndx" :to="item.to" class="sidebar-list__item" :data-qa="item.key">
            <div class="sidebar-list__item-icon">
                <component v-if="item.component" :is="item.component" />
            </div>
            <div class="sidebar-list__item-title" :data-qa="`sidebar-item-${item.key}`">
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
import bridgeSvg from '@/assets/icons/sidebar/bridge.svg';

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
        bridgeSvg,
    },
    setup() {
        const { currentChainInfo } = useWeb3Onboard();

        const menu = computed(() => {
            if (!currentChainInfo.value.net) {
                return [];
            }

            if (!UIConfig[currentChainInfo.value.net]) {
                return [];
            }

            return UIConfig[currentChainInfo.value.net].sidebar;
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
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        text-decoration: none;
        color: var(--#{$prefix}sidebar-text);
        cursor: pointer;

        @include animateEasy;

        &:hover {
            color: $colorPl;

            svg {
                fill: $colorPl;
            }
        }

        &.router-link-exact-active {
            color: var(--#{$prefix}white);

            svg {
                fill: var(--#{$prefix}sidebar-icon-color);
            }
        }

        svg {
            fill: var(--#{$prefix}sidebar-text);
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
        font-weight: 300;
    }
}
</style>
