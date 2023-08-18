<template>
    <div :class="[type]" class="info-panel">
        <component :is="`${type}Svg`" />
        <div v-if="title && !hash" class="info-panel__title">{{ title }}</div>
        <a v-if="hash" :href="hash" target="_blank" class="info-panel__link">{{ title }}</a>
    </div>
</template>
<script>
import errorSvg from '@/assets/icons/dashboard/cancel.svg';
import successSvg from '@/assets/icons/dashboard/success.svg';
import warningSvg from '@/assets/icons/dashboard/warning.svg';
import infoSvg from '@/assets/icons/dashboard/info.svg';

export default {
    name: 'InfoPanel',
    props: {
        title: {
            type: String,
        },
        hash: {
            type: String,
        },
        type: {
            type: String,
            default: 'error',
        },
    },
    components: {
        errorSvg,
        successSvg,
        warningSvg,
        infoSvg,
    },
};
</script>
<style lang="scss" scoped>
.info-panel {
    min-height: 48px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    box-sizing: border-box;
    border-radius: 8px;
    background: var(--#{$prefix}ligthOrange);
    border: 1px solid var(--#{$prefix}red);
    color: var(--#{$prefix}red);
    font-family: 'Poppins_Regular';
    font-size: var(--#{$prefix}default-fs);

    svg {
        min-width: 24px;
        fill: var(--#{$prefix}red);
    }

    &.success {
        background: #e8f0e4;
        border: 1px solid var(--#{$prefix}success);
        color: var(--#{$prefix}success);

        svg {
            fill: var(--#{$prefix}success);
        }

        .info-panel__link {
            color: var(--#{$prefix}success);
        }
    }

    &.warning {
        background: rgba(255, 107, 0, 0.1);
        border: 1px solid var(--#{$prefix}blazeOrange);
        color: var(--#{$prefix}blazeOrange);

        svg {
            fill: var(--#{$prefix}blazeOrange);
        }

        .info-panel__link {
            color: var(--#{$prefix}blazeOrange);
        }
    }

    &.info {
        background: rgba(0, 131, 159, 0.1);
        border: 1px solid #00839f;
        color: #00839f;

        svg {
            fill: #00839f;
        }

        .info-panel__link {
            color: #00839f;
        }
    }

    &__link {
        margin-left: 7px;
        text-decoration: underline;
        color: var(--#{$prefix}red);
    }

    &__title {
        margin-left: 10px;
    }
}
</style>
