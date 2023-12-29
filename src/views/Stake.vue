<template>
    <div class="stake">
        <div class="stake-page">
            <div class="stake-page__title">Stake</div>
        </div>
    </div>
</template>
<script>
export default {
    name: 'Stake',
    components: {},
};
</script>
<style lang="scss" scoped>
.stake {
    .stake-page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);

        &__title {
            color: var(--#{$prefix}black);
            font-size: var(--#{$prefix}h3-fs);
            font-weight: 600;
        }
    }
}
</style>
