<template>
    <div class="actions-menu">
        <div
            class="actions-menu__item"
            v-for="(item, ndx) in menuItems"
            :class="{ active: activeIndex === ndx }"
            :key="ndx"
            @click="setActive(ndx)"
        >
            <div class="title">{{ $t(item.$title) }}</div>
            <arrowUpIcon v-if="activeIndex === ndx" class="arrow" />
        </div>
    </div>
</template>
<script>
import arrowUpIcon from '@/assets/icons/dashboard/arrowup.svg';
import { ref } from 'vue';

export default {
    name: 'ActionsMenu',
    components: {
        arrowUpIcon,
    },
    props: {
        menuItems: {
            type: Array,
            required: true,
        },
    },
    setup() {
        const activeIndex = ref(0);

        const setActive = (ndx) => {
            activeIndex.value = ndx;
        };

        return {
            setActive,
            activeIndex,
        };
    },
};
</script>
<style lang="scss" scoped>
.actions-menu {
    display: flex;

    &__item {
        @include pageFlexColumn;
        
        font-weight: 300;
        font-size: var(--#{$prefix}h4-fs);
        color: var(--#{$prefix}primary-text);
        margin-right: 25px;
        cursor: pointer;

        .arrow {
            fill: var(--#{$prefix}arrow-color);
        }

        &.active {
            font-weight: 600;
        }
    }
}
</style>
