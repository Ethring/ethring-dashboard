<template>
    <div
        class="token-icon"
        :style="{
            width: `${width}px`,
            height: `${height}px`,
        }"
    >
        <a-skeleton-avatar v-if="isImageLoading" active />

        <template v-else>
            <img
                :key="token?.symbol"
                :src="token?.logo"
                :alt="token?.name || token?.symbol"
                @error="() => handleOnErrorImg()"
                @load="() => handleOnLoadImg()"
            />

            <template v-if="isShowPlaceholder">
                <div class="token-icon__placeholder">
                    <a-avatar :size="+width">{{ token?.symbol || '' }}</a-avatar>
                </div>
            </template>
        </template>
    </div>
</template>
<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';

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
        const isImageLoading = ref(false);
        const isShowPlaceholder = ref(!props.token?.logo || false);

        const handleOnErrorImg = () => {
            isImageLoading.value = false;
            isShowPlaceholder.value = true;
        };

        const handleOnLoadImg = () => {
            isShowPlaceholder.value = false;
            isImageLoading.value = false;
        };

        onMounted(() => {
            isImageLoading.value = true;
            isShowPlaceholder.value = true;

            if (!props.token?.logo) {
                isImageLoading.value = false;
                isShowPlaceholder.value = true;
            }
        });

        watch(
            () => props.token,
            () => {
                if (!props.token?.logo) {
                    isImageLoading.value = false;
                    isShowPlaceholder.value = true;
                }
            },
        );

        onUnmounted(() => {
            isImageLoading.value = false;
            isShowPlaceholder.value = false;
        });

        return {
            isImageLoading,
            isShowPlaceholder,

            handleOnLoadImg,
            handleOnErrorImg,
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
        font-size: var(--#{$prefix}small-sm-fs);
        span {
            background: var(--#{$prefix}icon-logo-bg-color);
        }
    }
}
</style>
