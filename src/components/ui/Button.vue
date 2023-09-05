<template>
    <button :class="{ [type]: type, disabled, [shape]: shape, [size]: size }" class="button" :disabled="disabled || loading">
        <loadingIcon v-if="loading" class="rotating" />
        <div v-else>{{ title }}</div>
    </button>
</template>
<script>
import loadingIcon from '@/assets/icons/dashboard/load-btn.svg';

export default {
    name: 'Button',
    components: {
        loadingIcon,
    },
    props: {
        title: {
            type: String,
            default: 'Button',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            default: 'primary',
        },
        loading: {
            type: Boolean,
            default: false,
        },
        shape: {
            type: String,
            default: 'default',
        },
        size: {
            type: String,
            default: 'default',
        },
    },
};
</script>
<style lang="scss" scoped>
@keyframes rotating {
    from {
        -ms-transform: rotate(0deg);
        -moz-transform: rotate(0deg);
        -webkit-transform: rotate(0deg);
        -o-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    to {
        -ms-transform: rotate(360deg);
        -moz-transform: rotate(360deg);
        -webkit-transform: rotate(360deg);
        -o-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}
.rotating {
    -webkit-animation: rotating 2s linear infinite;
    -moz-animation: rotating 2s linear infinite;
    -ms-animation: rotating 2s linear infinite;
    -o-animation: rotating 2s linear infinite;
    animation: rotating 2s linear infinite;
}
</style>
