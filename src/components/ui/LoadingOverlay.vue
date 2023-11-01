<template>
    <div class="loading-overlay">
        <a-spin tip="Connecting to wallet" />
    </div>
</template>
<script>
export default {
    name: 'LoadingOverlay',
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
    background: rgba(255, 255, 255, 0.7);

    span,
    div {
        color: var(--#{$prefix}black);
    }

    i {
        background-color: #3fdfae !important;
    }
}
</style>
