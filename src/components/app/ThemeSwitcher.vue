<template>
    <div :class="{ checked }" class="theme-switcher" @click="toggleTheme">
        <div class="theme-switcher__check">
            <sunSvg v-if="!checked" />
            <moonSvg v-if="checked" />
        </div>
    </div>
</template>
<script>
import sunSvg from '@/assets/icons/dashboard/sun.svg';
import moonSvg from '@/assets/icons/dashboard/moon.svg';
import { onMounted, ref } from 'vue';

export default {
    name: 'ThemeSwitcher',
    components: {
        sunSvg,
        moonSvg,
    },
    setup() {
        const checked = ref(!!localStorage.getItem('theme'));

        const toggleTheme = () => {
            if (window.document.body.className.includes('dark')) {
                window.document.body.classList.remove('dark');
                localStorage.setItem('theme', '');
                checked.value = false;
            } else {
                window.document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                checked.value = true;
            }
        };

        onMounted(() => {
            if (localStorage.getItem('theme')) {
                window.document.body.classList.add(localStorage.getItem('theme'));
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
    border: 1px solid var(--#{$prefix}gulfStream);
    background: var(--#{$prefix}iceberg);
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
        background: var(--#{$prefix}surfieGreen);
    }
}

.theme-switcher.checked {
    border: 1px solid var(--#{$prefix}trout);
    background: var(--#{$prefix}primary);

    .theme-switcher__check {
        background: #020c03;
        left: initial;
        right: 3px;
    }
}
</style>
