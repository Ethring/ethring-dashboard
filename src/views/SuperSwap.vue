<template>
    <div class="superswap">
        <div class="superswap-page">
            <Spinner v-if="loader" />
            <template v-else>
                <div class="superswap-page__title">{{ $t('superSwap.title') }}</div>
                <div v-if="walletAddress && !loader" class="superswap-page__wrap">
                    <component v-if="superSwapComponent" :is="superSwapComponent" />
                </div>
            </template>
        </div>
        <RoutesModal v-if="showRoutesModal" @close="closeRoutesModal" />
    </div>
</template>
<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import Spinner from '@/components/app/Spinner';
import SuperSwap from '@/components/dynamic/superswap/SuperSwap';
import RoutesModal from '@/components/app/modals/RoutesModal';

import { UIConfig } from '@/config/ui';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';

export default {
    name: 'Superswap',
    components: {
        SuperSwap,
        Spinner,
        RoutesModal,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const showRoutesModal = computed(() => store.getters['swap/showRoutes']);

        const loader = computed(() => store.getters['tokens/loader']);

        const { walletAddress, currentChainInfo } = useWeb3Onboard();

        const superSwapComponent = computed(() => {
            return UIConfig[currentChainInfo.value.net]?.superSwap?.component;
        });

        const closeRoutesModal = () => {
            store.dispatch('swap/setShowRoutes', false);
        };

        watch(
            () => superSwapComponent.value,
            (newV) => {
                if (!newV) {
                    router.push('/main');
                }
            }
        );

        return {
            loader,
            walletAddress,
            superSwapComponent,
            showRoutesModal,

            closeRoutesModal,
        };
    },
};
</script>
<style lang="scss" scoped>
.superswap {
    @include pageStructure;

    .superswap-page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);

        &__title {
            color: $colorBlack;
            font-size: 32px;
            font-family: 'Poppins_SemiBold';
            margin-bottom: 30px;
            text-decoration: none;
        }

        &__wrap {
            display: flex;
            justify-content: center;
            height: calc(100vh - 200px);
        }

        .arrow {
            fill: $colorBlack;
        }
    }
}

body.dark {
    .superswap {
        background: rgb(12, 13, 23);

        .superswap-page {
            &__title {
                color: $colorWhite;
            }
        }
    }
}
</style>
