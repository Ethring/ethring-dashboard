<template>
    <a-spin :tip="$t(tip)" size="large" class="logo-loading" :spinning="spinning">
        <template #indicator>
            <Logo class="logo-indicator" />
        </template>

        <slot name="content" />
    </a-spin>
</template>
<script>
import Logo from '../../assets/icons/sidebar/logo.svg';

export default {
    name: 'LogoLoading',

    components: {
        Logo,
    },

    props: {
        spinning: {
            type: Boolean,
            default: false,
        },
        tip: {
            type: String,
            default: 'dashboard.loadingConfig',
        },
    },
};
</script>
<style lang="scss">
.logo-loading {
    border-radius: 16px;
}
</style>
