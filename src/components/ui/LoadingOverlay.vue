<template>
    <div class="loading-overlay" :class="{ active: spinning }">
        <LogoLoading :tip="tip" :spinning="spinning" />
    </div>
</template>
<script>
import LogoLoading from './LogoLoading.vue';

export default {
    name: 'LoadingOverlay',
    components: {
        LogoLoading,
    },
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
};
</script>
<style lang="scss">
.loading-overlay {
    @include pageFlexRow;
    justify-content: center;

    position: fixed;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    background: var(--#{$prefix}main-background);

    transition: all 0.3s;

    z-index: 9999;
}
</style>
