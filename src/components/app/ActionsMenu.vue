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
            <arrowupSvg v-if="activeIndex === ndx" class="arrow" />
        </div>
    </div>
</template>
<script>
import arrowupSvg from '@/assets/icons/dashboard/arrowup.svg';
import { ref } from 'vue';

export default {
    name: 'ActionsMenu',
    components: {
        arrowupSvg,
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
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Poppins_Light';
        font-size: 22px;
        color: $colorBlack;
        margin-right: 25px;
        cursor: pointer;

        .arrow {
            fill: $colorBlack;
        }

        &.active {
            font-family: 'Poppins_SemiBold';
        }
    }
}

body.dark {
    .actions-menu {
        &__item {
            color: $colorLightBrown;

            &.active {
                color: $colorWhite;
            }

            .arrow {
                fill: $colorBrightGreen;
            }
        }
    }
}
</style>
