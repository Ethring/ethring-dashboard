<template>
    <div class="bridge">
        <div class="bridge-page">
            <Spinner v-if="loader" />
            <template v-else>
                <div v-if="walletAddress && groupTokens[0].name && !loader">
                    <div class="bridge-page-tab">
                        <router-link class="bridge-page__title" to="/send">{{ $t('simpleSend.title') }}</router-link>
                        <div class="bridge-page__title bridge-page-tab__active">
                            {{ $t('simpleBridge.title') }}
                            <arrowupSvg class="arrow" />
                        </div>
                    </div>
                    <div class="bridge-page__wrap">
                        <component v-if="bridgeComponent" :is="bridgeComponent" />
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import Spinner from '@/components/app/Spinner';
import SimpleBridge from '@/components/dynamic/bridge/SimpleBridge';
import arrowupSvg from '@/assets/icons/dashboard/arrowup.svg';

import { UIConfig } from '@/config/ui';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

export default {
    name: 'Bridge',
    components: {
        SimpleBridge,
        Spinner,
        arrowupSvg,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const { groupTokens } = useTokens();
        const { walletAddress, currentChainInfo } = useWeb3Onboard();

        const loader = computed(() => store.getters['tokens/loader']);

        const bridgeComponent = computed(() => {
            return UIConfig[currentChainInfo.value.net]?.bridge?.component;
        });

        watch(
            () => bridgeComponent.value,
            (newV) => {
                if (!newV) {
                    router.push('/main');
                }
            }
        );

        return {
            groupTokens,
            loader,
            walletAddress,
            bridgeComponent,
        };
    },
};
</script>
<style lang="scss" scoped>
.bridge {
    @include pageStructure;

    .bridge-page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);

        .bridge-page-tab {
            display: flex;
            justify-content: space-around;
            align-items: baseline;

            &__active {
                display: flex;
                flex-direction: column;
                align-items: center;
                color: $colorBlack;
            }
        }

        &__title {
            color: #486060;
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
    .bridge {
        background: rgb(12, 13, 23);

        .bridge-page {
            &__title {
                color: $colorWhite;
            }
        }
    }
}
</style>
