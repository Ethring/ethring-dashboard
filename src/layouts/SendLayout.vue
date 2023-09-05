<template>
    <AppLayout component="send">
        <div class="send-page-tab">
            <div class="send-page__title__active send-page-tab__active">
                {{ $t('simpleSend.title') }}
                <arrowupSvg class="arrow" />
            </div>
            <router-link class="send-page__title" to="/bridge">{{ $t('simpleBridge.title') }}</router-link>
        </div>
    </AppLayout>
</template>
<script>
import AppLayout from '@/layouts/AppLayout.vue';
import arrowupSvg from '@/assets/icons/dashboard/arrowup.svg';

export default {
    name: 'Send',
    components: {
        AppLayout,
        arrowupSvg,
    },
    setup() {},
};
</script>
<style lang="scss" scoped>
.send-page-tab {
    display: flex;
    justify-content: space-around;
    align-items: baseline;
    width: calc(100% - 260px);

    &__active {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--#{$prefix}black);
    }
}

.send-page__title {
    color: var(--#{$prefix}base-text);
    font-size: var(--#{$prefix}h1-fs);
    font-weight: 600;
    margin-bottom: 30px;
    text-decoration: none;

    &__active {
        font-size: var(--#{$prefix}h1-fs);
        font-weight: 600;
        margin-bottom: 30px;
        text-decoration: none;
        color: var(--#{$prefix}primary-text);
    }
}

.arrow {
    fill: var(--#{$prefix}arrow-color);
}
</style>
