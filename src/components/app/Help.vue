<template>
    <div class="help">
        <div class="help__item">
            <settingsSvg />
        </div>
        <div class="help__item mt">?</div>
        <div class="help__item">
            <cardSvg class="card-svg" />
        </div>
    </div>
</template>
<script>
import settingsSvg from '@/assets/icons/dashboard/settings.svg';
import cardSvg from '@/assets/icons/dashboard/card.svg';

export default {
    name: 'Help',
    components: {
        settingsSvg,
        cardSvg,
    },
};
</script>
<style lang="scss" scoped>
.help {
    display: flex;
    align-items: center;

    &__item {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--#{$prefix}icon-secondary-bg-color);
        font-weight: 400;
        font-size: var(--#{$prefix}h3-fs);
        color: var(--#{$prefix}icon-active);
        cursor: not-allowed;

        svg {
            fill: var(--#{$prefix}icon-active);

            &.card-svg {
                fill: var(--#{$prefix}icon-active);
            }
        }

        &.mt {
            margin: 0 10px;
        }
    }
}
</style>
