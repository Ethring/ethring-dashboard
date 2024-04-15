<template>
    <div
        class="token-icon"
        :style="{
            width: `${width}px`,
            height: `${height}px`,
        }"
    >
        <template v-if="token && shouldShowImage">
            <img
                :key="token?.symbol"
                :src="token?.logo"
                :alt="token?.name || token?.symbol"
                loading="lazy"
                @error="handleOnErrorImg"
                @load="handleOnLoadImg"
            />
        </template>
        <template v-else>
            <div class="token-icon__placeholder">
                <a-avatar :size="+width">{{ token?.symbol || '' }}</a-avatar>
            </div>
        </template>
    </div>
</template>
<script>
import { ref, computed, onMounted, watch } from 'vue';

export default {
    name: 'TokenIcon',
    props: {
        width: {
            default: '32',
        },
        height: {
            default: '32',
        },
        token: {
            type: Object,
            default: () => ({
                symbol: null,
                logo: null,
            }),
        },
    },
    setup(props) {
        const isShowPlaceholder = ref(!props.token?.logo || false);

        const handleOnErrorImg = () => {
            isShowPlaceholder.value = true;
        };

        const handleOnLoadImg = () => {
            isShowPlaceholder.value = false;
        };

        onMounted(() => {
            if (!props.token?.logo) {
                isShowPlaceholder.value = true;
            }
        });

        watch(
            () => props.token,
            () => {
                if (props.token) {
                    isShowPlaceholder.value = false;
                }

                if (!props.token?.logo) {
                    isShowPlaceholder.value = true;
                }
            },
        );

        return {
            isShowPlaceholder,

            handleOnLoadImg,
            handleOnErrorImg,

            shouldShowImage: computed(() => !isShowPlaceholder.value),
        };
    },
};
</script>
<style lang="scss" scoped>
.token-icon {
    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 0.2px solid var(--#{$prefix}icon-placeholder-border);
    border-radius: 50%;
    padding: 1px;

    background-color: var(--#{$prefix}icon-placeholder);

    max-width: 64px;
    max-height: 64px;

    img {
        width: 100%;
        height: 100%;
        object-position: center;
        object-fit: contain;
    }

    &__placeholder {
        span {
            font-size: var(--#{$prefix}small-xs-fs) !important;
            color: var(--#{$prefix}primary-text);
            background: var(--#{$prefix}icon-logo-bg-color);
        }
    }
}
</style>
