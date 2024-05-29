<template>
    <div class="not-found">
        <NotFoundIcon />
        <div class="not-found__text">{{ $t('pageNotFound') }}</div>
    </div>
</template>
<script>
import NotFoundIcon from '@/assets/icons/dashboard/not-found.svg';

export default {
    name: 'NotFound',
    components: {
        NotFoundIcon,
    },
    setup() {},
};
</script>
<style lang="scss" scoped>
.not-found {
    text-align: center;
    margin-top: 20vh;

    &__text {
        margin-top: 32px;
        font-size: var(--#{$prefix}h1-fs);
        font-weight: 400;
        color: var(--#{$prefix}mute-apr-text);
    }
}
</style>
