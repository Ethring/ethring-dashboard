<template>
    <div class="loading-overlay">
        <a-spin :tip="$t(tip)" size="large" :spinning="spinning" />
    </div>
</template>
<script>
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

    span,
    div {
        font-weight: 400;
        font-size: var(--#{$prefix}default-fs);
        color: var(--#{$prefix}primary-text);
    }

    i {
        background-color: #3fdfae !important;
    }
}
</style>
