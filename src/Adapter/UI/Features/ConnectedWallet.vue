<template>
    <div class="connected-wallet">
        <div class="left-side">
            <div class="icon-container">
                {{ wallet.walletName }}
            </div>
            <div class="">
                {{ cutAddress(wallet.address, 10, 4) }}
            </div>
        </div>

        <div>
            <div></div>
            <div></div>
        </div>
    </div>
</template>

<script>
import { cutAddress } from '@/helpers/utils';
import useAdapter from '@/Adapter/compositions/useAdapter';

export default {
    name: 'ConnectedWallet',
    components: {},
    props: {
        wallet: {
            type: Object,
            required: true,
        },
    },
    setup() {
        const { getWalletLogo } = useAdapter();

        return {
            cutAddress,
            getWalletLogo,
        };
    },
};
</script>

<style lang="scss" scoped>
.connected-wallet {
    border: 1px solid #d9f4f1;
    border-radius: 16px;
    padding: 8px 16px;
    cursor: pointer;
    max-height: 48px;

    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    & > div {
        display: flex;
        align-items: center;
        justify-content: center;

        .icon-container {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #d9f4f1;
            margin-right: 8px;

            display: flex;
            justify-content: center;
            align-items: center;

            font-size: 5px;
        }
    }
}
</style>
