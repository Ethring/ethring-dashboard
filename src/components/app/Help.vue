<template>
    <div class="help">
        <ThemeSwitcher class="head__switcher" />

        <div v-if="currentChainInfo && isDashboard" class="help__item" @click="toggleViewBalance">
            <EyeOutlined v-if="showBalance" />
            <EyeInvisibleOutlined v-else />
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue';

import ThemeSwitcher from '@/components/app/ThemeSwitcher';
import useAdapter from '@/Adapter/compositions/useAdapter';

export default {
    name: 'Help',
    components: {
        ThemeSwitcher,
        EyeOutlined,
        EyeInvisibleOutlined,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { currentChainInfo } = useAdapter();

        const isDashboard = computed(() => router.currentRoute.value.path === '/main' || router.currentRoute.value.path === '/');

        const showBalance = computed(() => store.getters['app/showBalance']);

        const toggleViewBalance = () => store.dispatch('app/toggleViewBalance');

        return {
            showBalance,
            toggleViewBalance,
            isDashboard,
            currentChainInfo,
        };
    },
};
</script>
<style lang="scss" scoped>
.help {
    @include pageFlexRow;

    &__item {
        width: 40px;
        height: 40px;
        border-radius: 50%;

        @include pageFlexRow;
        justify-content: center;

        background: var(--#{$prefix}icon-secondary-bg-color);
        color: var(--#{$prefix}icon-active);

        font-weight: 400;
        font-size: var(--#{$prefix}h3-fs);

        margin-left: 10px;

        cursor: pointer;

        &:hover {
            background: var(--#{$prefix}icon-active);
            color: var(--#{$prefix}icon-secondary-bg-color);
        }

        svg {
            fill: var(--#{$prefix}icon-active);
        }
    }
}
</style>
