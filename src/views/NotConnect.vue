<template>
    <div class="notconnect">
        <div class="notconnect-page">
            <div class="notconnect-page__title">{{ $t('connect.pageTitle') }}</div>
            <div class="notconnect-page__block" @click="connectToMetamask">
                <div>
                    <MmIcon />
                </div>
                <div class="description">
                    <div class="title">{{ $t('connect.blockTitle') }}</div>
                    <div class="wallet">{{ $t('connect.mmTitle') }}</div>
                </div>
            </div>
            <div class="notconnect-page__block keplr">
                <div>
                    <KeplrIcon />
                </div>
                <div class="description">
                    <div class="title">{{ $t('connect.blockTitle') }}</div>
                    <div class="wallet">{{ $t('connect.keplrTitle') }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { useStore } from 'vuex';

import MmIcon from '@/assets/icons/wallets/mm.svg';
import KeplrIcon from '@/assets/icons/wallets/keplr.svg';

export default {
    name: 'NotConnect',
    components: {
        MmIcon,
        KeplrIcon,
    },
    setup() {
        const store = useStore();

        const connectToMetamask = async () => {
            await store.dispatch('metamask/connectToMetamask');
        };

        return {
            connectToMetamask,
        };
    },
};
</script>
<style lang="scss" scoped>
.notconnect {
    width: 100%;

    .notconnect-page {
        @include pageFlexColumn;
        margin-top: 0;
        justify-content: center;
        height: calc(100vh - 115px);

        &__title {
            color: var(--#{$prefix}black);
            font-size: var(--#{$prefix}h1-fs);
            font-weight: 600;

            margin-bottom: 30px;
        }

        &__block {
            @include pageFlexRow;
            @include animateEasy;

            box-sizing: border-box;

            width: 240px;
            height: 82px;

            border-radius: 8px;
            border: 1px solid var(--#{$prefix}border-color);
            margin-bottom: 12px;
            padding: 0 12px;

            &:hover {
                opacity: 0.7;
                cursor: pointer;
            }

            .description {
                display: flex;
                flex-direction: column;
                margin-left: 12px;

                .title {
                    font-size: var(--#{$prefix}small-lg-fs);
                    font-weight: 400;
                    color: var(--#{$prefix}secondary-text);
                }

                .wallet {
                    margin-top: -5px;

                    font-size: var(--#{$prefix}h6-fs);
                    font-weight: 600;
                    color: var(--#{$prefix}black);
                }
            }

            &.keplr {
                opacity: 0.4;
            }
        }
    }
}
</style>
