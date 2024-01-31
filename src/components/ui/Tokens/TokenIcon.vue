<template>
    <div
        class="token-icon"
        :style="{
            width: `${width}px`,
            height: `${height}px`,
        }"
    >
        <template v-if="token">
            <template v-if="!showIconPlaceholder && (tokenIconFromZomet || token?.logo)">
                <img
                    :key="token?.symbol"
                    :src="token?.logo || tokenIconFromZomet"
                    :alt="token?.name"
                    :sss="token?.logo || tokenIconFromZomet"
                    @error="showIconPlaceholder = true"
                    @load="showIconPlaceholder = false"
                />
            </template>
            <template v-else>
                <div class="token-icon__placeholder">
                    <a-avatar :size="+width">{{ iconPlaceholder }}</a-avatar>
                </div>
            </template>
        </template>
        <template v-else>
            <div class="token-icon__placeholder">
                <a-avatar :size="+width">{{ iconPlaceholder }}</a-avatar>
            </div>
        </template>
    </div>
</template>
<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';

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
        const showIconPlaceholder = ref(false);
        const tokenIconFromZomet = ref(null);
        const iconPlaceholder = computed(() => props.token?.symbol);

        const store = useStore();

        const tokens = computed(() => store.getters['networks/zometTokens']);

        const setTokenIcon = () => {
            const { address = null, extensions = {} } = props.token;

            let searchAddress = address?.toLowerCase();

            if (extensions && extensions?.bridgeInfo) {
                for (const key in extensions.bridgeInfo) {
                    searchAddress = extensions.bridgeInfo[key].tokenAddress.toLowerCase();
                    break;
                }
            }

            if (searchAddress && tokens.value[searchAddress]) {
                return (tokenIconFromZomet.value = tokens.value[searchAddress].logo);
            }

            return (tokenIconFromZomet.value = null);
        };

        onMounted(() => {
            if (props.token) {
                setTokenIcon();
            }
        });

        watch(
            () => props.token,
            () => {
                if (props.token) {
                    showIconPlaceholder.value = false;
                    setTokenIcon();
                }
            }
        );

        return {
            showIconPlaceholder,
            iconPlaceholder,
            tokenIconFromZomet,
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
