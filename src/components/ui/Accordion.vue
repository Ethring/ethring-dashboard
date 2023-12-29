<template>
    <div :class="{ active }" class="accordion" @click="active = !active">
        <div v-if="!loading" class="accordion__header">
            <slot name="header"></slot>
            <ArrowIcon class="arrow" v-if="!hide" />
        </div>
        <div v-else class="accordion__skeleton">
            <a-skeleton-input active />
        </div>
        <div v-if="!hide" class="accordion__content" :style="{ height: active ? 'auto' : '0' }">
            <slot name="content"></slot>
        </div>
    </div>
</template>
<script>
import { ref } from 'vue';

import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

export default {
    name: 'Accordion',
    components: {
        ArrowIcon,
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
        loading: {
            required: false,
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
    border-radius: 8px;
    padding: 12px 16px;

    .header {
        img {
            width: 16px;
            height: 16px;
        }
    }

    &__title {
        display: flex;
        align-items: center;

        font-weight: 400;
        color: var(--zmt-accordion-label-color);
        font-size: var(--zmt-default-fs);

        .symbol {
            font-weight: 600;
        }

        .route-info-title {
            color: var(--#{$prefix}warning);
            font-weight: 500;
            line-height: 20px;
            opacity: 0.8;

            display: inline;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            width: 500px;
            margin-left: 4px;
        }
    }

    .service-fee {
        font-weight: 600;
        color: var(--#{$prefix}sub-text);
    }

    .symbol {
        margin-left: 5px;
        font-weight: 600;
    }

    &__header {
        @include pageFlexRow;
        justify-content: space-between;
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
