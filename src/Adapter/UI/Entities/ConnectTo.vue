<template>
    <div class="wallets-item" @click.stop="connect" :class="{ disabled }" :data-qa="`${name} wallet`">
        <div class="wallets-item__logos">
            <div class="wallets-item__logo" v-for="logo in logos" :key="logo">
                <component :is="logo" />
            </div>
        </div>

        <div class="wallets-item__info">
            <h4 class="name">{{ name }}</h4>
        </div>
    </div>
</template>

<script>
import { PlusOutlined } from '@ant-design/icons-vue';

import Metamask from '@/assets/icons/wallets/mm.svg';
import Ledger from '@/assets/icons/wallets/ledger.svg';
import Coinbase from '@/assets/icons/wallets/coinbase.svg';
import Keplr from '@/assets/icons/wallets/keplr.svg';
import Leap from '@/assets/icons/wallets/leap.svg';

export default {
    name: 'ConnectTo',
    components: {
        Metamask,
        Ledger,
        Coinbase,
        Keplr,
        Leap,
        PlusOutlined,
    },
    props: {
        connect: {
            type: Function,
        },
        name: {
            type: String,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        logos: {
            type: Array,
            default() {
                return [];
            },
        },
    },
};
</script>

<style lang="scss" scoped>
.wallets-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    background-color: #e6eeff;
    &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    min-width: 300px;
    max-width: 500px;
    width: auto;

    border: 1px solid #c9e0e0;

    border-radius: 8px;
    padding: 8px;

    cursor: pointer;

    transition: 0.2s;

    &:hover:not(.disabled) {
        background: #d9f4f1;
    }

    &:not(:last-child) {
        margin-bottom: 12px;
    }

    &__info {
        display: flex;
        flex-direction: column;
        justify-content: center;

        .name {
            width: max-content;
            font-weight: 600;
            font-size: 14px;
            margin: 0;
        }
    }

    &__logos {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 100px;
    }

    &__logo {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #f0f0f0;
        z-index: 3;

        svg {
            width: 24px;
            height: 24px;
        }
    }

    &__logo:nth-child(2),
    &__logo:nth-child(3) {
        margin-left: -16px;
    }

    &__logo:nth-child(2) {
        background-color: #02e7f6;
        z-index: 2;
    }

    &__logo:nth-child(3) {
        background-color: #d9f4f1;
        z-index: 1;
    }
}
</style>
