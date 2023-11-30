<template>
    <div class="disconnect-all">
        <div class="text" @click="disconnectAll">
            {{ $t('adapter.disconnectAll') }}
        </div>
    </div>
</template>

<script>
export default {
    name: 'DisconnectAll',
    props: {
        disconnectAll: {
            type: Function,
            required: true,
        },
    },
};
</script>
<style lang="scss" scoped>
.disconnect-all {
    cursor: pointer;
    transition: 0.2s;

    .text {
        color: var(--#{$prefix}danger);
        font-size: var(--#{$prefix}small-lg-fs);
        font-weight: 400;

        border-bottom: 1px dashed var(--#{$prefix}danger);
    }

    &:hover {
        opacity: 0.7;
    }
}
</style>
