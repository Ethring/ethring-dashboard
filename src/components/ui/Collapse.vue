<template>
    <div :class="{ active }" class="collapse" @click="toggleCollapse">
        <div v-if="!loading" class="collapse__header">
            <slot name="header"></slot>
            <ArrowSvg v-if="!hideContent" class="arrow" />
        </div>
        <template v-else>
            <a-space class="loader">
                <a-skeleton-avatar active size="small" />
                <a-skeleton-input active size="small" />
                <a-skeleton-input active size="small" />
            </a-space>
        </template>
        <div v-if="!hideContent && !loading" class="collapse__content" :style="{ height: active ? 'auto' : '0' }">
            <slot name="content"></slot>
        </div>
    </div>
</template>
<script>
import ArrowSvg from '@/assets/icons/form-icons/drop-down.svg';

import { ref } from 'vue';

export default {
    name: 'Collapse',
    components: {
        ArrowSvg,
    },
    props: {
        loading: {
            required: false,
            default: false,
        },
        hideContent: {
            required: false,
            default: false,
        },
    },
    setup() {
        const active = ref(false);

        const toggleCollapse = () => {
            active.value = !active.value;
        };

        return { active, toggleCollapse };
    },
};
</script>
<style lang="scss" scoped>
.loader {
    @include pageFlexRow;
    margin: auto;
    padding-left: 16px;
    height: 48px;
}

.collapse {
    background: var(--#{$prefix}select-bg-color);
    border-radius: 8px;
    position: relative;

    &__content {
        @include pageFlexColumn;
        transition: all 1s;
        overflow: hidden;
        padding: 0 4px;
    }

    &__header {
        padding: 12px 16px;
        @include pageFlexRow;
        justify-content: space-between;
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
