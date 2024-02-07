<template>
    <div class="trigger sidebar-trigger">
        <MenuUnfoldOutlined v-if="isCollapsed" @click="toggleCollapsed" />
        <MenuFoldOutlined v-else @click="toggleCollapsed" />
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue';

export default {
    name: 'SidebarTrigger',
    components: {
        MenuFoldOutlined,
        MenuUnfoldOutlined,
    },
    setup() {
        const store = useStore();

        const isCollapsed = computed({
            get: () => store.getters['app/isCollapsed'],
            set: () => store.dispatch('app/toggleSidebar'),
        });

        const toggleCollapsed = () => (isCollapsed.value = !isCollapsed.value);

        return {
            isCollapsed,
            toggleCollapsed,
        };
    },
};
</script>
<style lang="scss" scoped>
.sidebar-container {
    background: var(--#{$prefix}primary);

    height: 100vh;
    position: fixed;
    z-index: 999;
    left: 0;
    top: 0;
    bottom: 0;
}

.sidebar {
    // position: fixed;
    // left: 0;

    // z-index: 999;

    // height: 100vh;

    // background: var(--#{$prefix}primary);

    // padding: 30px 25px;

    // min-width: 80px;
    // max-width: 239px;

    box-sizing: border-box;

    &__menu {
        background-color: transparent;
        width: fit-content;
    }

    &-items {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        height: 100%;

        margin: 0 auto;

        &__list {
            @include pageFlexColumn;
        }
    }

    &__socials {
        width: 100%;
    }

    &__version {
        color: var(--#{$prefix}sidebar-text);
        margin-top: 20px;
        margin-left: auto;
    }

    &__settings {
        @include pageFlexRow;
        align-self: flex-start;

        color: var(--#{$prefix}sidebar-text);
        margin-bottom: 26px;

        cursor: not-allowed;
        opacity: 0.5;

        @include animateEasy;

        &-icon {
            display: flex;
            justify-content: center;

            width: 32px;
        }

        svg {
            fill: var(--#{$prefix}sidebar-text);
        }

        &-title {
            font-size: var(--#{$prefix}h5-fs);
            font-weight: 300;
            color: var(--zmt-sidebar-text);

            margin-left: 10px;
        }
    }

    &__logo {
        margin-bottom: 40px;

        &-item {
            display: flex;
            align-items: flex-start;
        }

        &-type {
            color: var(--#{$prefix}sidebar-active-color);
            font-size: var(--#{$prefix}small-sm-fs);
            font-weight: 700;
            margin-left: -12px;
            margin-top: -4px;
        }
    }

    &.collapsed {
        .sidebar-items__list {
            align-items: center;
        }

        .sidebar__socials {
            flex-direction: column;
        }

        .logo {
            margin-bottom: 70px;
        }

        .sidebar__settings {
            align-self: center;

            &-icon svg {
                transform: scale(1.2);
            }
        }
    }
}
</style>
