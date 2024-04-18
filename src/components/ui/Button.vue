<template>
    <button :class="{ [type]: type, disabled, [shape]: shape, [size]: size }" class="button"
        :disabled="disabled || loading">
        <DefaultLoading v-if="loading" :tip="tip" />
        <div v-else>
            <component :is="icon" />
            <span>{{ title }}</span>
        </div>
    </button>
</template>
<script>
import DefaultLoading from './DefaultLoading.vue';

export default {
    name: 'Button',
    components: {
        DefaultLoading,
    },
    props: {
        title: {
            type: String,
            default: 'Button',
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
        },
    },
};
</script>
