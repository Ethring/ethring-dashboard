<template>
    <div class="token-icon">
        <img
            v-if="!showIconPlaceholder"
            :width="width"
            :height="height"
            :key="token?.code"
            :src="token?.logo || tokenIconFromZomet || getTokenIcon(token?.code?.toLowerCase())"
            :alt="token?.name"
            @error="showIconPlaceholder = true"
            @load="showIconPlaceholder = false"
            :class="{ nativeIcon: tokenIconFromZomet }"
        />
        <div v-else class="token-icon__placeholder">
            <a-avatar>{{ iconPlaceholder }}</a-avatar>
        </div>
    </div>
</template>
<script>
import { ref, computed, watch, onMounted } from 'vue';
import { getTokenIcon, tokenIconPlaceholder } from '@/helpers/utils';
import { useStore } from 'vuex';

export default {
    name: 'TokenIcon',
    props: {
        dark: {
            type: Boolean,
            default: false,
        },
        width: {
            required: true,
        },
        height: {
            required: true,
        },
        token: {
            required: true,
        },
    },
    setup(props) {
        const showIconPlaceholder = ref(false);
        const tokenIconFromZomet = ref(null);
        const iconPlaceholder = computed(() => props.token?.code);

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
            getTokenIcon,
            iconPlaceholder,
            tokenIconPlaceholder,
            tokenIconFromZomet,
        };
    },
};
</script>
<style lang="scss" scoped>
.token-icon {
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;

    img {
        border-radius: 50%;
        width: 100%;
        height: 100%;
        object-position: center;
        object-fit: contain;

        filter: none;
    }

    &__placeholder {
        font-size: 12px;

        & span {
            color: $colorWhite;
        }
    }
}
</style>
