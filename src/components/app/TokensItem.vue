<template>
    <div :class="{ inGroup }" class="tokens__item">
        <div class="network">
            <div class="logo">
                <TokenIcon width="24" height="24" :token="item" />
            </div>
            <div class="info">
                <div v-if="!inGroup" class="symbol">{{ item.code }}</div>
                <div class="name">{{ item.name }}</div>
                <div v-if="inGroup" class="blockchain">{{ item.standard }}</div>
            </div>
        </div>
        <div class="amount">
            <div class="value">
                {{ showBalance ? prettyNumber(item.balance.amount) : '****' }}
            </div>
            <div class="symbol">{{ item?.code }}</div>
        </div>
        <div class="change">
            <!-- <div class="label">-</div> -->
            <div class="value"><span>$</span>{{ showBalance ? prettyNumber(item.balanceUsd) : '****' }}</div>
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import TokenIcon from '@/components/ui/TokenIcon';

import { prettyNumber } from '@/helpers/prettyNumber';

export default {
    name: 'TokensItem',
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
<style lang="scss" scoped>
.tokens__item {
    min-height: 72px;
    border: 1px solid var(--#{$prefix}turquoise);
    border-radius: 16px;
    margin-bottom: 7px;

    display: flex;
    align-items: center;
    font-family: 'Poppins_Light';
    font-size: var(--#{$prefix}h4-fs);
    color: var(--#{$prefix}black);
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
            background: var(--#{$prefix}black);
            margin-right: 10px;

            display: flex;
            justify-content: center;
            align-items: center;
        }

        .symbol {
            font-size: var(--#{$prefix}h6-fs);
            font-family: 'Poppins_SemiBold';
        }

        .name {
            margin-top: -3px;
            font-size: var(--#{$prefix}small-lg-fs);
            font-family: 'Poppins_Regular';
            color: var(--#{$prefix}black);
        }

        .blockchain {
            font-family: 'Poppins_Regular';
            color: var(--#{$prefix}surfieGreen);
            font-size: var(--#{$prefix}small-sm-fs);
            text-transform: uppercase;
        }
    }

    .amount {
        width: 20%;
        display: flex;
        align-items: center;

        .value {
            font-size: var(--#{$prefix}h6-fs);
            font-family: 'Poppins_SemiBold';
            margin-right: 5px;
            color: var(--#{$prefix}black);
        }

        .symbol {
            font-size: var(--#{$prefix}small-lg-fs);
            font-family: 'Poppins_Regular';
            color: var(--#{$prefix}grey);
        }
    }

    .change {
        width: 20%;
        display: flex;
        flex-direction: column;

        .label {
            font-size: var(--#{$prefix}small-lg-fs);
            font-family: 'Poppins_Regular';
            color: var(--#{$prefix}grey);
            text-align: right;
        }

        .value {
            font-size: var(--#{$prefix}default-fs);
            font-family: 'Poppins_SemiBold';
            text-align: right;
        }
    }
}
</style>
