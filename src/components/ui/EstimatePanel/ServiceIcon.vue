<template>
    <a-tooltip>
        <div class="service-info-container">
            <div class="service-icon">
                <img :src="icon" alt="service-icon" />
            </div>
            <div v-if="showTitle" class="service-title">
                {{ name }}
            </div>
        </div>

        <template #title v-if="!showTitle">
            {{ name }}
        </template>
    </a-tooltip>
</template>
<script>
export default {
    name: 'ServiceIcon',
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
            default: 24,
        },

        height: {
            type: Number,
            default: 24,
        },

        showTitle: {
            type: Boolean,
            required: true,
            default: false,
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

        width: 24px;
        height: 24px;
        border-radius: 50%;

        font-weight: 600;
        font-size: var(--#{$prefix}default-fs);
        color: var(--#{$prefix}primary-text);

        background-color: var(--#{$prefix}icon-bg);
        border: 1px solid rgba(0, 0, 0, 0.1);

        margin-right: 8px;

        img {
            width: 20px;
            height: 20px;
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
}
</style>
