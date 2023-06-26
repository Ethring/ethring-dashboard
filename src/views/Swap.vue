<template>
    <div class="swap">
        <div class="swap-page">
            <Spinner v-if="loader || !walletAddress || !groupTokens[0]?.name" />
            <template v-else>
                <div class="swap-page__title">{{ $t('simpleSwap.title') }}</div>
                <div class="swap-page__wrap">
                    <component v-if="swapComponent" :is="swapComponent" />
                </div>
            </template>
        </div>
    </div>
</template>
<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import SimpleSwap from '@/components/dynamic/swaps/SimpleSwap';
import UniSwap from '@/components/dynamic/swaps/UniSwap';
import PancakeSwap from '@/components/dynamic/swaps/PancakeSwap';
import NotWorking from '@/components/dynamic/swaps/NotWorking';
import Spinner from '@/components/app/Spinner';

import { UIConfig } from '@/config/ui';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

export default {
    name: 'Swap',
    components: {
        SimpleSwap,
        UniSwap,
        PancakeSwap,
        NotWorking,
        Spinner,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { groupTokens } = useTokens();

        const loader = computed(() => store.getters['tokens/loader']);

        const { walletAddress, currentChainInfo } = useWeb3Onboard();

        const swapComponent = computed(() => {
            return UIConfig[currentChainInfo.value.net]?.swap?.component;
        });

        watch(
            () => swapComponent.value,
            (newV) => {
                if (!newV) {
                    router.push('/main');
                }
            }
        );

        return {
            loader,
            groupTokens,
            walletAddress,
            swapComponent,
        };
    },
};
</script>
<style lang="scss" scoped>
.swap {
    @include pageStructure;

    .swap-page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);

        &__title {
            color: $colorBlack;
            font-size: 32px;
            font-family: 'Poppins_SemiBold';
            margin-bottom: 30px;
        }

        &__wrap {
            display: flex;
            justify-content: center;
            height: calc(100vh - 200px);
        }
    }
}

body.dark {
    .swap {
        background: rgb(12, 13, 23);

        .swap-page {
            &__title {
                color: $colorWhite;
            }
        }
    }
}
</style>
