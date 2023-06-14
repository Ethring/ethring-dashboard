<template>
    <div :class="{ dark }" class="token-icon">
        <img
            v-if="!showIconPlaceholder"
            :width="width"
            :height="height"
            :key="token?.code"
            :src="tokenIconFromZomet || getTokenIcon(token?.code?.toLowerCase())"
            :alt="token?.name"
            @error="showIconPlaceholder = true"
            @load="showIconPlaceholder = false"
            :class="{ nativeIcon: tokenIconFromZomet }"
        />
        <div v-else class="token-icon__placeholder">
            <span>{{ iconPlaceholder[0] }}</span>
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
        const iconPlaceholder = computed(() => tokenIconPlaceholder(props.token?.name || 'Token'));

        const store = useStore();

        const tokens = computed(() => store.getters['networks/zometTokens']);

        const setTokenIcon = () => {
            if (props.token?.address && tokens.value[props.token?.address]) {
                return (tokenIconFromZomet.value = tokens.value[props.token.address].logo);
            }
            return (tokenIconFromZomet.value = null);
        };

        onMounted(() => setTokenIcon());

        watch(
            () => props.token,
            () => {
                setTokenIcon();
                showIconPlaceholder.value = false;
            }
        );

        watch(tokens, () => {
            setTokenIcon();
        });

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

    &.dark {
        img {
            filter: brightness(0) invert(0);
        }

        .token-icon__placeholder {
            span {
                color: $colorBlack;
            }
        }
    }

    img.nativeIcon {
        border-radius: 50%;
        width: 100%;
        height: 100%;
        object-position: center;
        object-fit: contain;

        filter: none;
    }

    img {
        filter: brightness(0) invert(1);
    }

    &__placeholder {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-top: 1px;

        & span {
            font-size: 25px;
            line-height: 17px;
            color: $colorWhite;
            font-family: 'Poppins_Bold';
        }
    }
}

body.dark {
    .token-icon {
        width: 32px;
        height: 32px;
        display: flex;
        justify-content: center;
        align-items: center;

        &.dark {
            img {
                filter: brightness(0) invert(1);
            }

            .token-icon__placeholder {
                span {
                    color: $colorWhite;
                }
            }
        }
    }
}
</style>
