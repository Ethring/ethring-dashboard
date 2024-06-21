<template>
    <div class="connect-wallet">
        <div class="connect-wallet__top">
            <p class="title">{{ $t('connect.connectTo') }}</p>
            <span class="sub-title"> {{ $t('connect.connectToStart') }} </span>
        </div>
        <a-menu class="connect-wallet__ecosystems">
            <ConnectToEcosystems />
        </a-menu>
    </div>
</template>
<script>
import { onMounted, onUpdated, watch } from 'vue';
import { useRouter } from 'vue-router';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import ConnectToEcosystems from '@/core/wallet-adapter/UI/Widgets/ConnectToEcosystems';

export default {
    name: 'ConnectWalletAdapter',
    components: {
        ConnectToEcosystems,
    },
    setup() {
        const router = useRouter();

        const { walletAccount, isConnecting } = useAdapter();

        const redirectToMain = async () => {
            if (isConnecting.value) return null;

            if (walletAccount.value) return await router.push('/main');

            return null;
        };

        onMounted(async () => await redirectToMain());

        onUpdated(async () => await redirectToMain());

        watch(isConnecting, async () => await redirectToMain());
    },
};
</script>
<style lang="scss" scoped>
.connect-wallet {
    @include pageFlexRow;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 55vh;
    gap: 2.5rem;

    @media (max-height: 800px) {
        height: 60vh;
    }

    @media (max-height: 600px) {
        height: 70vh;
    }

    &__top {
        @include pageFlexRow;
        justify-content: center;
        flex-direction: column;

        .title {
            font-size: var(--#{$prefix}h3-fs);
            font-weight: 500;
            margin-bottom: 1rem;
            color: var(--#{$prefix}mute-text);
        }

        .sub-title {
            font-size: var(--#{$prefix}h0-fs);
            font-weight: 700;
            text-transform: uppercase;
            color: var(--#{$prefix}primary-text);
        }
    }

    &__ecosystems {
        border: none;
        border-inline-end: none !important;
    }
}
</style>
