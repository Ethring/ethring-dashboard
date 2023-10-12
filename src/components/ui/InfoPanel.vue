<template>
    <div :class="[type]" class="info-panel">
        <component :is="`${type}Icon`" />
        <div v-if="title && !hash" class="info-panel__title">{{ title }}</div>
        <a v-if="hash" :href="hash" target="_blank" class="info-panel__link">{{ title }}</a>
    </div>
</template>
<script>
import errorIcon from '@/assets/icons/dashboard/cancel.svg';
import successIcon from '@/assets/icons/dashboard/success.svg';
import warningIcon from '@/assets/icons/dashboard/warning.svg';
import infoIcon from '@/assets/icons/dashboard/info.svg';

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
        errorIcon,
        successIcon,
        warningIcon,
        infoIcon,
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
    background: var(--#{$prefix}danger-op-01);
    border: 1px solid var(--#{$prefix}danger-color);
    color: var(--#{$prefix}danger-color);
    font-weight: 400;
    font-size: var(--#{$prefix}default-fs);

    svg {
        min-width: 24px;
        fill: var(--#{$prefix}danger-color);
    }

    &.success {
        background: var(--#{$prefix}success-op-01);
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
        background: var(--#{$prefix}warning-op-01);
        border: 1px solid var(--#{$prefix}warning);
        color: var(--#{$prefix}warning);

        svg {
            fill: var(--#{$prefix}warning);
        }

        .info-panel__link {
            color: var(--#{$prefix}warning);
        }
    }

    &.info {
        background: var(--#{$prefix}info-op-01);
        border: 1px solid var(--#{$prefix}info);
        color: var(--#{$prefix}info);

        svg {
            fill: var(--#{$prefix}info);
        }

        .info-panel__link {
            color: var(--#{$prefix}info);
        }
    }

    &__link {
        margin-left: 7px;
        text-decoration: underline;
        color: var(--#{$prefix}danger-color);
    }

    &__title {
        margin-left: 10px;
    }
}
</style>
