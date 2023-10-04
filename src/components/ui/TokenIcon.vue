<template>
    <div class="token-icon">
        <img
            v-if="!showIconPlaceholder && token"
            :width="width"
            :height="height"
            :key="token?.symbol"
            :src="token?.logo || tokenIconFromZomet || getTokenIcon(token?.symbol?.toLowerCase())"
            :alt="token?.name"
            @error="showIconPlaceholder = true"
            @load="showIconPlaceholder = false"
        />
        <div v-else class="token-icon__placeholder">
            <a-avatar>{{ iconPlaceholder }}</a-avatar>
        </div>
    </div>
</template>
<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';

import { getTokenIcon, tokenIconPlaceholder } from '@/helpers/utils';

export default {
    name: 'TokenIcon',
    props: {
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
        width: 100%;
        height: 100%;
        border-radius: 50%;

        object-position: center;
        object-fit: contain;
    }

    &__placeholder {
        font-size: var(--#{$prefix}small-sm-fs);

        span {
            color: var(--#{$prefix}white);
        }
    }
}
</style>
