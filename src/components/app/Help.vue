<template>
    <div class="help">
        <div class="help__item">?</div>
        <div class="help__item">
            <CardSvg class="card-svg" />
        </div>

        <ThemeSwitcher class="head__switcher" />
    </div>
</template>
<script>
import ThemeSwitcher from '@/components/app/ThemeSwitcher';

import CardSvg from '@/assets/icons/dashboard/card.svg';

export default {
    name: 'Help',
    components: {
        ThemeSwitcher,
        CardSvg,
    },
};
</script>
<style lang="scss" scoped>
.help {
    display: flex;
    align-items: center;

    &__item {
        cursor: pointer;

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

        &:not(.disabled):hover {
            background: var(--#{$prefix}icon-active);
            color: var(--#{$prefix}icon-secondary-bg-color);

            svg {
                fill: var(--#{$prefix}icon-secondary-bg-color);
            }
        }

        &:not(:last-child) {
            margin-right: 10px;
        }

        svg {
            fill: var(--#{$prefix}icon-active);
        }
    }
}
</style>
