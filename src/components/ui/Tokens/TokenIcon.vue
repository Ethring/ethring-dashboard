<template>
    <div
        class="token-icon"
        :style="{
            width: `${width}px`,
            height: `${height}px`,
        }"
        :data-qa="token?.name || token?.symbol"
    >
        <template v-if="token && imageToShow && shouldShowImage">
            <img
                :key="token?.symbol"
                :style="{
                    width: `${width}px`,
                    height: `${height}px`,
                }"
                :src="imageToShow"
                :alt="token?.name || token?.symbol"
                :title="token?.address || token?.name || token?.symbol"
                loading="lazy"
                @error="handleOnErrorImg"
                @load="handleOnLoadImg"
            />
        </template>
        <template v-else>
            <div class="token-icon__placeholder">
                <a-avatar :size="+width" :title="token?.address || token?.name || token?.symbol">
                    {{ token?.symbol || token?.name || '' }}
                </a-avatar>
            </div>
        </template>
    </div>
</template>
<script>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'TokenIcon',
    props: {
        width: {
            type: [String, Number],
            default: '32',
        },
        height: {
            type: [String, Number],
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
        const store = useStore();

        const isGetFromStore = ref(false);
        const imageToShow = ref(props.token?.logo);
        const isShowPlaceholder = ref(!props.token?.logo || false);

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);
        const shouldShowImage = computed(() => !isShowPlaceholder.value);

        const updateTokenImage = async (image, token) => {
            if (!token?.id || !token?.chain) return null;

            console.log('Updating token image', image, token);
            try {
                await store.dispatch('tokens/updateTokenImage', {
                    chain: token.chain,
                    id: token.id,
                    image,
                });
            } catch (error) {
                console.error('Error updating token image', error);
                return null;
            }
        };

        const getImageByAddress = async (token) => {
            try {
                const image = await store.dispatch('configs/getTokenImage', token);

                if (!image) return null;

                if (image !== token?.logo) await updateTokenImage(image, token);

                return image;
            } catch (error) {
                console.error('Error getting token image', error);
                return null;
            } finally {
                isGetFromStore.value = true;
            }
        };

        const handleOnLoadImg = () => (isShowPlaceholder.value = false);

        const handleOnErrorImg = async () => {
            isShowPlaceholder.value = true;
            await handleOnChangeIsShowPlaceholder(true);
        };

        const handleOnChangeIsShowPlaceholder = async (value) => {
            if (!value) return;
            const { chain = null, address = null } = props.token || {};

            // If the token image is not available, we need to get it from the store
            // If we already requested the image, we don't need to request it again
            if (value && chain && address && !isGetFromStore.value) {
                imageToShow.value = await getImageByAddress(props.token);
                isShowPlaceholder.value = !imageToShow.value;
            }
        };

        // **********************************************************************************
        // * Watchers
        // **********************************************************************************

        const unWatchPropsToken = watch(
            () => props.token,
            (newProps, oldProps) => {
                // If the token changes, we need to update the image to show
                if (newProps?.symbol !== oldProps?.symbol) {
                    isGetFromStore.value = false;
                    imageToShow.value = newProps?.logo;
                    isShowPlaceholder.value = !newProps?.logo;
                }
                if (imageToShow.value === props.token?.logo || isGetFromStore.value) return;
                if (props.token?.logo) imageToShow.value = props.token?.logo;
                isShowPlaceholder.value = !props.token?.logo;
            },
        );

        watch(isAllTokensLoading, async (value) => {
            if (value) return;
            await handleOnChangeIsShowPlaceholder(isShowPlaceholder.value);
        });

        // **********************************************************************************
        // * Lifecycle Hooks
        // **********************************************************************************

        onMounted(async () => {
            isGetFromStore.value = false;
            imageToShow.value = props.token?.logo;
            isShowPlaceholder.value = !imageToShow.value;
            if (!imageToShow.value) await handleOnChangeIsShowPlaceholder(isShowPlaceholder.value);
        });

        onUnmounted(() => {
            unWatchPropsToken();
        });

        return {
            shouldShowImage,
            imageToShow,

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
        span {
            font-size: var(--#{$prefix}small-xs-fs) !important;
            color: var(--#{$prefix}primary-text);
            background: var(--#{$prefix}icon-logo-bg-color);
        }
    }
}
</style>
