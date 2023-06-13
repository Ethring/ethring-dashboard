<template>
    <div class="send">
        <div class="send-page">
            <Spinner v-if="loader" />
            <template v-else>
                <div class="send-page__title">{{ $t('simpleSend.title') }}</div>
                <div v-if="walletAddress && groupTokens.length && !loader" class="send-page__wrap">
                    <component v-if="sendComponent" :is="sendComponent" />
                </div>
            </template>
        </div>
    </div>
</template>
<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import SimpleSend from '@/components/dynamic/send/SimpleSend';

import { UIConfig } from '@/config/ui';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

import Spinner from '@/components/app/Spinner';

export default {
    name: 'Send',
    components: {
        SimpleSend,
        Spinner,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { groupTokens } = useTokens();
        const { walletAddress, currentChainInfo } = useWeb3Onboard();

        const loader = computed(() => store.getters['tokens/loader']);

        const sendComponent = computed(() => {
            return UIConfig[currentChainInfo.value.net]?.send?.component;
        });

        watch(
            () => sendComponent.value,
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
            sendComponent,
        };
    },
};
</script>
<style lang="scss" scoped>
.send {
    @include pageStructure;

    .send-page {
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
    .send {
        background: rgb(12, 13, 23);

        .send-page {
            &__title {
                color: $colorWhite;
            }
        }
    }
}
</style>
