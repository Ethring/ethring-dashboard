<template>
    <a-space direction="horizontal" align="baseline">
        <a-spin size="small" class="spin-loading" />
        <span v-if="tip" class="spin-loading-tip">{{ $t(tip) }}</span>
    </a-space>
</template>
<script>
export default {
    name: 'DefaultLoading',

    props: {
        tip: {
            type: String,
            default: '',
        },
    },
};
</script>
<style lang="scss">
.spin-loading span > i {
    background-color: var(--#{$prefix}icon-color) !important;
}
</style>
