<template>
    <a-tooltip>
        <div class="service-info-container">
            <div
                class="service-icon"
                :class="{
                    'service-icon--no-title': !name,
                }"
                :style="{
                    width: `${width}px`,
                    height: `${height}px`,
                }"
            >
                <a-avatar v-if="!icon" :size="width"></a-avatar>
                <img v-else :src="icon" alt="service-icon" />
            </div>
            <div v-if="showTitle" class="service-title">
                {{ name }}
            </div>
        </div>

        <template v-if="!showTitle && showTooltip" #title>
            {{ name }}
        </template>
    </a-tooltip>
</template>
<script>
export default {
    name: 'QuoteServiceIcon',
    props: {
        name: {
            type: String,
            default: '',
        },
        icon: {
            type: String,
            default: null,
        },

        width: {
            type: Number,
            default: 16,
        },

        height: {
            type: Number,
            default: 16,
        },
        showTitle: {
            type: Boolean,
            default: false,
        },
        showTooltip: {
            type: Boolean,
            default: true,
        },
    },
};
</script>

<style lang="scss" scoped>
.service {
    &-info-container {
        display: flex;
        align-items: center;
    }

    &-icon {
        display: flex;
        align-items: center;
        justify-content: center;

        cursor: default;

        width: 100%;
        height: 100%;
        border-radius: 50%;

        font-weight: 600;
        font-size: var(--#{$prefix}default-fs);
        color: var(--#{$prefix}primary-text);

        background-color: var(--#{$prefix}icon-bg);
        border: 1px solid rgba(0, 0, 0, 0.1);

        margin-right: 8px;

        img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
        }
    }

    &-title {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 360px;

        font-size: var(--#{$prefix}small-lg-fs);
        color: var(--#{$prefix}base-text);
        font-weight: 600;
    }

    &-icon--no-title {
        margin-right: 0;
    }
}
</style>
