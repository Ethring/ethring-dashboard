<template>
    <a-row class="shortcut-info-container">
        <div class="shortcut-info">
            <div class="label">{{ $t('shortcuts.label') }}</div>
            <div class="description">{{ $t('shortcuts.description') }}</div>
        </div>
        <div class="shortcut-info__btn">
            <UiButton title="Soon" />
        </div>
        <LinesBack class="shortcut-info-lines" />
    </a-row>
</template>
<script>
import LinesBack from '@/assets/images/wallet-info/lines.svg';
import UiButton from '@/components/ui/Button.vue';
export default {
    name: 'ShortcutInfoLarge',
    components: {
        LinesBack,
        UiButton,
    },
    setup() {},
};
</script>
<style lang="scss" scoped>
.shortcut-info-container {
    @include pageFlexRow;
    justify-content: space-between;

    position: relative;
    z-index: 3;
    background-color: var(--#{$prefix}banner-color);

    padding: 18px 24px;
    box-sizing: border-box;

    border-radius: 16px;
    min-height: 80px;

    overflow: hidden;
}

.shortcut-info-lines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    transform: translate(30%, -35%);
}

.shortcut-info {
    @include pageFlexColumn;
    align-items: baseline;

    z-index: 2;

    .label {
        font-size: var(--#{$prefix}h5-fs);
        font-weight: 600;
        line-height: 24px;

        color: var(--#{$prefix}primary-text);
    }

    .description {
        font-size: var(--#{$prefix}small-lg-fs);
        font-weight: 400;
        line-height: 24px;

        color: var(--#{$prefix}mute-text);
    }

    &__btn {
        z-index: 3;

        @media (max-width: 1300px) {
            & {
                margin-top: 8px;
            }
        }

        button {
            width: 160px;
        }
    }
}
</style>
