<template>
    <div class="empty-list">
        <!-- <emptyListSvg v-if="false" /> -->
        <div class="empty-list__title">{{ title }}</div>
    </div>
</template>
<script>
// import emptyListSvg from "@/assets/icons/dashboard/empty.svg";

export default {
    name: 'EmptyList',
    components: {
        // emptyListSvg,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
    },
};
</script>
<style lang="scss" scoped>
.empty-list {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    svg {
        stroke: var(--#{$prefix}black);
    }

    &__title {
        font-weight: 600;
        font-size: var(--#{$prefix}h1-fs);
        color: var(--#{$prefix}black);
    }
}
</style>
