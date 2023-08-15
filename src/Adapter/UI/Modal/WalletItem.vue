<template>
    <div
        class="wallet-item"
        :class="{ connected: wallet.isDone, connecting: wallet.isWalletConnecting }"
        @click="() => connect(wallet.walletName)"
    >
        <div class="icon">
            <img :src="wallet.walletInfo.logo" alt="logo" />
            <a-spin />
        </div>
        <div class="name">
            <div>{{ wallet.walletPrettyName }}</div>
        </div>
        <div class="check-icon" v-if="wallet.isDone">
            <CheckIcon />
        </div>
    </div>
</template>
<script>
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
};
</script>
<style lang="scss" scoped>
.wallet-item {
    cursor: pointer;

    flex: 1 45%;

    display: flex;
    align-items: center;
    gap: 16px;

    border: 1px solid #d0d4f7;
    border-radius: 16px;

    padding: 16px;

    max-height: 80px;

    transition: background-color 250ms ease-in-out;

    &:hover {
        background-color: #eff1fc;
    }

    .icon {
        width: 48px;
        height: 48px;

        display: flex;
        align-items: center;
        justify-content: center;

        border: 1px solid #d0d4f7;
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
        background-color: #5aec99;
        border-radius: 50%;
        width: 20px;
        height: 20px;

        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            width: 12px;
            height: 12px;
        }
    }

    &.connected,
    &.connected > .icon {
        border-color: #5aec99;
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
}
</style>
