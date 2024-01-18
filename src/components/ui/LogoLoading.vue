<template>
    <a-spin :tip="$t(tip)" size="large" class="logo-loading">
        <template #indicator>
            <Logo class="logo-indicator" />
        </template>
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
        tip: {
            type: String,
            default: '',
        },
    },
};
</script>
