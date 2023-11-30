<template>
    <div
        :style="{
            position,
            marginLeft: `${marginLeft}px`,
        }"
        class="modal"
        @click="$emit('close')"
    >
        <div
            :style="{
                width,
                height,
            }"
            class="modal__content"
            @click.stop="() => {}"
        >
            <div class="modal__content-close">
                <CloseIcon @click="$emit('close')" />
            </div>
            <div class="modal__content-title">{{ title }}</div>
            <div class="modal__content-line" />
            <div class="modal__content-inner">
                <slot />
            </div>
        </div>
    </div>
</template>

<script>
import CloseIcon from '@/assets/icons/app/close.svg';

export default {
    name: 'Modal',
    components: {
        CloseIcon,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        position: {
            type: String,
            default: 'fixed',
        },
        width: {
            type: String,
            default: '588px',
        },
        height: {
            type: String,
            default: '',
        },
        marginLeft: {
            type: String,
            default: '0',
        },
    },
};
</script>

<style lang="scss" scoped>
.modal {
    height: 100%;
    @include pageFlexRow;
    justify-content: center;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: var(--#{$prefix}modal-bg-color);
    z-index: 1000;
    overflow: auto;

    &__content {
        position: relative;
        min-width: 40vw;
        height: max-content;
        background: var(--#{$prefix}modal-content-bg-color);
        border-radius: 16px;
        padding: 24px 32px;
        box-sizing: border-box;
        max-width: 588px;
    }

    &__content-title {
        color: var(--#{$prefix}primary-text);
        font-size: var(--#{$prefix}h3-fs);
        font-weight: 500;
    }

    &__content-line {
        margin: 16px 0;
        border-top: 1px dashed var(--#{$prefix}border-color);
    }

    &__content-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 90%;
    }

    &__content-close {
        position: absolute;
        right: 32px;
        top: 30px;
        cursor: pointer;

        @include animateEasy;

        &:hover {
            opacity: 0.7;
        }

        svg {
            fill: var(--#{$prefix}icon-color);
        }
    }
}
</style>
