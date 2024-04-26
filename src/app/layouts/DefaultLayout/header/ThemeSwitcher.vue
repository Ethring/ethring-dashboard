<template>
    <div
        :class="{
            checked: theme === 'dark',
        }"
        class="theme-switcher"
        @click="toggleTheme"
    >
        <div class="theme-switcher__icon-container">
            <SunIcon class="icon sun" />
            <MoonIcon class="icon moon" />
        </div>
    </div>
</template>
<script>
import { onMounted, computed } from 'vue';
import { useStore } from 'vuex';

import SunIcon from '@/assets/icons/platform-icons/sun.svg';
import MoonIcon from '@/assets/icons/platform-icons/moon.svg';

import withoutTransition from '@/compositions/useDisableTransition';

export default {
    name: 'ThemeSwitcher',
    components: {
        SunIcon,
        MoonIcon,
    },
    setup() {
        const store = useStore();

        const theme = computed(() => store.getters['app/theme'] || 'light');

        const toggleTheme = () => {
            withoutTransition(() => {
                store.dispatch('app/toggleTheme');
            });
        };

        onMounted(() => document.documentElement.setAttribute('data-theme', theme.value));

        return {
            toggleTheme,
            theme,
        };
    },
};
</script>
<style lang="scss" scoped>
.theme-switcher {
    height: 32px;
    width: 64px;

    border: 1px solid var(--#{$prefix}border-color);
    background-color: var(--#{$prefix}icon-secondary-bg-color);

    border-radius: 50px;

    cursor: pointer;

    transition: all 0.3s ease-in-out;

    display: flex;
    align-items: center;
    padding: 0 2px;

    &__icon-container {
        width: 26px;
        height: 26px;

        display: flex;
        justify-content: center;
        align-items: center;

        background-color: var(--#{$prefix}theme-switcher-color);
        border-radius: 50%;

        transition: all 0.2s ease-in-out;
        transform: translateX(120%);

        position: relative;

        .icon {
            opacity: 0;
            position: absolute;
            transition: all 0.2s ease-in-out;
        }

        .moon {
            opacity: 0;
        }

        .sun {
            opacity: 1;
        }
    }

    &.checked {
        border-color: var(--#{$prefix}social-border-color);
        background-color: var(--#{$prefix}icon-secondary-bg-color);

        .theme-switcher__icon-container {
            background: var(--#{$prefix}icon-secondary-bg-color);
            transform: translateX(0);

            .sun {
                opacity: 0;
            }

            .moon {
                opacity: 1;
            }
        }
    }

    &:hover {
        opacity: 0.8;
        border-color: var(--#{$prefix}icon-hover);
    }
}
</style>
