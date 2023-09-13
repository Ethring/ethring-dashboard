<template>
    <div class="help">
        <div class="help__item disabled">
            <SettingsSvg />
        </div>
        <div class="help__item disabled">?</div>
        <div class="help__item disabled">
            <CardSvg class="card-svg" />
        </div>

        <div class="help__item" @click="toggleViewBalance">
            <EyeOutlined v-if="showBalance" />
            <EyeInvisibleOutlined v-else />
        </div>

        <div class="mt">
            <ThemeSwitcher class="head__switcher" />
        </div>
    </div>
</template>
<script>
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue';

import ThemeSwitcher from '@/components/app/ThemeSwitcher';

import SettingsSvg from '@/assets/icons/dashboard/settings.svg';
import CardSvg from '@/assets/icons/dashboard/card.svg';
import { useStore } from 'vuex';
import { computed } from 'vue';

export default {
    name: 'Help',
    components: {
        ThemeSwitcher,
        SettingsSvg,
        CardSvg,
        EyeOutlined,
        EyeInvisibleOutlined,
    },

    setup() {
        const store = useStore();

        const showBalance = computed(() => store.getters['app/showBalance']);

        const toggleViewBalance = () => store.dispatch('app/toggleViewBalance');

        return {
            showBalance,
            toggleViewBalance,
        };
    },
};
</script>
<style lang="scss" scoped>
.help {
    display: flex;
    align-items: center;

    &__item {
        cursor: pointer;

        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--#{$prefix}icon-secondary-bg-color);
        font-weight: 400;
        font-size: var(--#{$prefix}h3-fs);
        color: var(--#{$prefix}icon-active);

        &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        &:not(.disabled):hover {
            background: var(--#{$prefix}icon-active);
            color: var(--#{$prefix}icon-secondary-bg-color);
        }

        &:not(:last-child) {
            margin-right: 10px;
        }

        svg {
            fill: var(--#{$prefix}icon-active);
        }
    }
}
</style>
