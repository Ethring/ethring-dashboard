<template>
    <div :class="{ inGroup }" class="tokens__item">
        <div class="network">
            <div class="logo">
                <TokenIcon width="24" height="24" :token="item" />
                <div class="chain">
                    <img :src="item.chainLogo" />
                </div>
            </div>
            <div class="info">
                <div v-if="!inGroup" class="symbol">{{ item.code }}</div>
                <div class="name">{{ item.name }}</div>
            </div>
        </div>
        <div class="amount">
            <div class="value">
                {{ showBalance ? prettyNumber(item.balance.amount) : '****' }}
            </div>
            <div class="symbol">{{ item?.code }}</div>
        </div>
        <div class="change">
            <div class="value"><span>$</span>{{ showBalance ? prettyNumber(item.balanceUsd) : '****' }}</div>
        </div>
    </div>
</template>
<script>
import { prettyNumber } from '@/helpers/prettyNumber';
import TokenIcon from '@/components/ui/TokenIcon';
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'AssetItem',
    props: {
        item: {
            required: true,
        },
        inGroup: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        TokenIcon,
    },
    setup() {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        return {
            prettyNumber,
            showBalance,
        };
    },
};
</script>
<style lang="scss">
.tokens__item {
    min-height: 72px;
    border: 1px solid $colorLightGreen;
    border-radius: 16px;
    margin-bottom: 7px;
    display: flex;
    align-items: center;
    font-family: 'Poppins_Light';
    font-size: 22px;
    color: $colorBlack;
    cursor: pointer;
    padding: 0 10px;
    box-sizing: border-box;

    &.inGroup {
        border-color: transparent;
        margin-bottom: 3px;
        padding: 3px 0 0 0;
        min-height: 55px;
    }

    .network {
        width: 60%;
        display: flex;
        align-items: center;

        .logo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #d9f4f1;
            margin-right: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;

            .token-icon img {
                filter: none;
            }
        }

        .chain {
            width: 16px;
            height: 16px;
            background: #0c0d18;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;

            position: absolute;
            top: 26px;
            left: 30px;

            img {
                border-radius: 50%;
                object-position: center;
                object-fit: contain;
                width: 80%;
                height: 80%;
            }
        }

        .symbol {
            font-size: 18px;
            font-family: 'Poppins_SemiBold';
        }

        .name {
            font-size: 16px;
            font-family: 'Poppins_Regular';
            color: #1c1f2c;
        }
    }

    .amount {
        width: 20%;
        display: flex;
        align-items: center;

        .value {
            font-size: 16px;
            font-family: 'Poppins_SemiBold';
            margin-right: 5px;
            color: #1c1f2c;
        }

        .symbol {
            font-size: 14px;
            font-family: 'Poppins_Regular';
            color: #494c56;
        }
    }

    .change {
        width: 20%;
        display: flex;
        flex-direction: column;

        span {
            font-size: 14px;
            font-family: 'Poppins_Regular';
            color: #494c56;
            text-align: right;
            margin-right: 5px;
        }

        .value {
            font-size: 16px;
            font-family: 'Poppins_SemiBold';
            text-align: right;
            color: #2e323e;
        }
    }
}
</style>
