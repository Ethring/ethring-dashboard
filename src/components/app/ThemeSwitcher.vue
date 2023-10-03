<template>
    <div :class="{ checked }" class="theme-switcher" @click="toggleTheme">
        <div class="theme-switcher__check">
            <SunSvg v-if="!checked" />
            <MoonSvg v-if="checked" />
        </div>
    </div>
</template>
<script>
import { onMounted, ref } from 'vue';

import SunSvg from '@/assets/icons/dashboard/sun.svg';
import MoonSvg from '@/assets/icons/dashboard/moon.svg';

export default {
    name: 'ThemeSwitcher',
    components: {
        SunSvg,
        MoonSvg,
    },
    setup() {
        const checked = ref(localStorage.getItem('theme') === 'dark');

        const toggleTheme = () => {
            let currentTheme = document.documentElement.getAttribute('data-theme');
            let targetTheme = 'light';

            checked.value = false;

            if (currentTheme === 'light') {
                targetTheme = 'dark';
                checked.value = true;
            }

            document.documentElement.setAttribute('data-theme', targetTheme);
            localStorage.setItem('theme', targetTheme);
        };

        onMounted(() => {
            if (localStorage.getItem('theme')) {
                document.documentElement.setAttribute('data-theme', localStorage.getItem('theme'));
            }
        });

        return {
            checked,
            toggleTheme,
        };
    },
};
</script>
<style lang="scss" scoped>
.theme-switcher {
    width: 80px;
    height: 40px;
    position: relative;
    border: 1px solid var(--#{$prefix}border-color);
    background: var(--#{$prefix}icon-secondary-bg-color);
    border-radius: 50px;
    cursor: pointer;

    @include animateEasy;

    &:hover {
        opacity: 0.8;
    }

    &__check {
        border-right: 50%;
        position: absolute;
        width: 32px;
        height: 32px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        top: 4px;
        left: 3px;
        background: var(--#{$prefix}theme-switcher-color);
    }
}

.theme-switcher.checked {
    border: 1px solid var(--#{$prefix}social-border-color);
    background: var(--#{$prefix}icon-secondary-bg-color);

    .theme-switcher__check {
        background: var(--#{$prefix}secondary-background-color);
        left: initial;
        right: 3px;
    }
}
</style>
