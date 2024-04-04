<template>
    <div class="loading-overlay" :class="{ active: spinning }">
        <LogoLoading :tip="tip" :spinning="spinning" :overlay="overlay" />
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
        overlay: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        LogoLoading,
    },
};
</script>
<style lang="scss">
@import '../../assets/styles/index.scss';

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

    @keyframes slideUp {
        0% {
            transform: translateY(0);
        }
        100% {
            transform: translateY(100%);
            z-index: -9999;
        }
    }

    @keyframes slideDown {
        0% {
            transform: translateY(100%);
        }
        100% {
            transform: translateY(0);
            z-index: 9999;
        }
    }

    animation: slideUp 0.3s 0.1s;
    animation-fill-mode: forwards;

    &.active {
        animation: slideDown 0.3s;
        animation-fill-mode: forwards;
        cursor: progress;
    }
}
</style>
