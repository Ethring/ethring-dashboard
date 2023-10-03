<template>
    <div :class="{ active }" class="accordion" @click="active = !active">
        <div class="accordion__header">
            <div class="accordion__title" v-html="title"></div>
            <arrowSvg class="arrow" v-if="!hide" />
        </div>
        <div v-if="!hide" class="accordion__content" :style="{ height: active ? 'auto' : '0' }">
            <slot></slot>
        </div>
    </div>
</template>
<script>
import { ref } from 'vue';

import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';

export default {
    name: 'Accordion',
    components: {
        arrowSvg,
    },
    props: {
        title: {
            type: String,
            default: 'Receive',
        },
        hide: {
            type: Boolean,
            default: false,
        },
    },
    setup() {
        const active = ref(false);

        const clickAway = () => {
            active.value = !active.value;
        };

        return { active, clickAway };
    },
};
</script>
<style lang="scss" scoped>
.accordion {
    background: var(--#{$prefix}accordion-bg-color);
    border: 1px solid var(--#{$prefix}accordion-border-color);
    border-radius: 16px;
    padding: 27px 32px;

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &__title {
        color: var(--#{$prefix}mute-text);
        font-size: var(--#{$prefix}default-fs);
        font-weight: 400;
    }

    &__content {
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    svg.arrow {
        cursor: pointer;
        fill: var(--#{$prefix}select-icon-color);
        transform: rotate(0);
        @include animateEasy;
    }

    &.active {
        svg.arrow {
            transform: rotate(180deg);
            transition: 0.6s;
        }
    }
}
</style>
