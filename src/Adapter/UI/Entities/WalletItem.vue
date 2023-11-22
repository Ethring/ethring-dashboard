<template>
    <div
        class="wallet-item"
        :class="{ connected: isCosmosConnected, connecting: wallet.isWalletConnecting, 'not-found': !wallet.client }"
        @click="connectOrDownload"
    >
        <div class="icon">
            <img :src="wallet.walletInfo.logo" alt="logo" />
            <a-spin />
        </div>
        <div class="name">
            <div>{{ wallet.walletPrettyName }}</div>
        </div>
        <div class="check-icon" v-if="isCosmosConnected">
            <CheckIcon />
        </div>
    </div>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import CheckIcon from '@/assets/icons/wallets/check.svg';

export default {
    name: 'WalletItem',
    components: {
        CheckIcon,
    },
    props: {
        wallet: {
            type: Object,
            required: true,
        },
        connect: {
            type: Function,
            required: true,
        },
    },
    setup() {
        const store = useStore();
        const isCosmosConnected = ref(false);

        const connectedWallets = computed(() => store.getters['adapters/getConnectedWallets']);

        if (connectedWallets.value) {
            isCosmosConnected.value = connectedWallets.value.find((wallet) => wallet.walletName === 'Keplr');
        }

        return {
            isCosmosConnected,
        };
    },
    methods: {
        connectOrDownload() {
            !this.wallet.client && window.open(this.wallet.downloadInfo.link, '_blank');

            return this.connect(this.wallet.walletName);
        },
    },
};
</script>
<style lang="scss" scoped>
.wallet-item {
    @include pageFlexRow;

    cursor: pointer;

    flex: 1 45%;

    gap: 16px;

    border: 1px solid var(--#{$prefix}adapter-connected-border-color);
    border-radius: 16px;

    padding: 16px;

    max-height: 80px;

    transition: background-color 250ms ease-in-out;

    &:hover {
        background-color: #eff1fc;
        color: var(--#{$prefix}black);
    }

    .icon {
        width: 48px;
        height: 48px;

        @include pageFlexRow;
        justify-content: center;

        border: 1px solid var(--#{$prefix}adapter-connected-border-color);
        border-radius: 12px;

        img {
            width: 30px;
            height: 30px;
        }

        & > div {
            display: none;
        }
    }

    .check-icon {
        margin-left: auto;
        background-color: var(--#{$prefix}adapter-connected-icon-color);
        border-radius: 50%;
        width: 20px;
        height: 20px;

        @include pageFlexRow;

        justify-content: center;

        svg {
            width: 12px;
            height: 12px;
        }
    }

    &.connected,
    &.connected > .icon {
        border-color: var(--#{$prefix}adapter-connected-icon-color);
    }

    &.connecting {
        .icon {
            img {
                display: none;
            }

            & > div {
                display: initial;
            }
        }
    }

    &.not-found {
        border-color: var(--#{$prefix}adapter-secondary-border-color);
        .icon {
            border-color: var(--#{$prefix}adapter-secondary-border-color);
        }
    }
}
</style>
