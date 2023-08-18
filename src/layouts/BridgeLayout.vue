<template>
    <AppLayout component="bridge">
        <div class="bridge-page-tab">
            <router-link class="bridge-page__title" to="/send">{{ $t('simpleSend.title') }}</router-link>
            <div class="bridge-page__title__active bridge-page-tab__active">
                {{ $t('simpleBridge.title') }}
                <arrowupSvg class="arrow" />
            </div>
        </div>
    </AppLayout>
</template>
<script>
import AppLayout from '@/layouts/AppLayout.vue';
import arrowupSvg from '@/assets/icons/dashboard/arrowup.svg';

export default {
    name: 'Bridge',
    components: {
        AppLayout,
        arrowupSvg,
    },
};
</script>
<style lang="scss" scoped>
.bridge-page-tab {
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

.bridge-page__title {
    color: #486060;
    font-size: var(--#{$prefix}h1-fs);
    font-family: 'Poppins_SemiBold';
    margin-bottom: 30px;
    text-decoration: none;

    &__active {
        color: var(--#{$prefix}black);
        font-size: var(--#{$prefix}h1-fs);
        font-family: 'Poppins_SemiBold';
        margin-bottom: 30px;
        text-decoration: none;
    }
}

.arrow {
    fill: var(--#{$prefix}black);
}
</style>
