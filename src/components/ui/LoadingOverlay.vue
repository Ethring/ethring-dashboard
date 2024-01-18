<template>
    <div class="loading-overlay">
        <LogoLoading :tip="tip" />
    </div>
</template>
<script>
import LogoLoading from './LogoLoading.vue';

export default {
    name: 'LoadingOverlay',
    props: {
        spinning: {
            type: Boolean,
            default: false,
        },
        tip: {
            type: String,
            default: 'dashboard.connecting',
        },
    },
    components: {
        LogoLoading,
    },
};
</script>
<style lang="scss">
.loading-overlay {
    @include pageFlexRow;
    justify-content: center;

    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;

    width: 100%;
    height: 100%;

    background: var(--#{$prefix}main-background);
}
</style>
