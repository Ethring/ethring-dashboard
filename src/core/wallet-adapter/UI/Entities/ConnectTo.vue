<template>
    <div class="wallets-item" :class="{ disabled }" :data-qa="`${name} wallet`" @click.stop="connect">
        <div class="wallets-item__logos">
            <div v-for="logo in logos" :key="logo" class="wallets-item__logo">
                <component :is="logo" />
            </div>
        </div>

        <div class="wallets-item__info">
            <h4 class="name">{{ name }}</h4>
            <span v-if="disabled" class="soon">soon</span>
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
import Abstract from '@/assets/icons/wallets/abstract.svg';

export default {
    name: 'ConnectTo',
    components: {
        Metamask,
        Ledger,
        Coinbase,
        Keplr,
        Leap,
        Abstract,
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
    @include pageFlexRow;
    justify-content: flex-start;

    color: var(--#{$prefix}primary-text);
    border: 1px solid var(--#{$prefix}adapter-ecosystem-border-color);
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: 0.2s;
    min-width: 300px;

    &.disabled {
        cursor: not-allowed;
        background: var(--#{$prefix}select-bg-color) !important;
        border: 1px solid var(--#{$prefix}select-bg-color);

        .name {
            color: var(--#{$prefix}description-text);
        }

        .soon {
            position: absolute;
            right: 20px;
            top: 8px;

            font-weight: 600;
            color: var(--#{$prefix}sub-text);
        }
    }

    &:hover:not(.disabled) {
        background: var(--#{$prefix}adapter-hover-color);
    }

    &__info {
        display: flex;
        flex-direction: column;
        justify-content: center;

        .name {
            width: max-content;
            font-weight: 600;
            font-size: var(--#{$prefix}default-fs);
        }
    }

    &__logos {
        @include pageFlexRow;
        justify-content: flex-start;

        width: 100px;
    }

    &__logo {
        @include pageFlexRow;
        justify-content: center;

        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--#{$prefix}adapter-logo-main-color);

        border: 1px solid var(--#{$prefix}border-color);

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
        background-color: var(--#{$prefix}adapter-logo-base-color);
        z-index: 2;
    }

    &__logo:nth-child(3) {
        background-color: var(--#{$prefix}adapter-logo-secondary-color);
        z-index: 1;
    }
}
</style>
