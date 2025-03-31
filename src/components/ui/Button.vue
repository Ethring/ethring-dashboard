<template>
    <button :class="{ [type]: type, disabled, [shape]: shape, [size]: size }" class="button" :disabled="disabled || loading">
        <DefaultLoading v-if="loading" :tip="tip" />
        <div v-else>
            <component :is="icon" />
            <span data-testid="confirm-btn">{{ title }}</span>
        </div>
    </button>
</template>
<script>
import DefaultLoading from './DefaultLoading.vue';

export default {
    name: 'UiButton',
    components: {
        DefaultLoading,
    },
    props: {
        title: {
            type: String,
            default: 'Button title',
        },
        tip: {
            type: String,
            default: '',
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
        icon: {
            default: null,
            type: [String, Object],
        },
    },
};
</script>
