<template>
    <div class="select-token__title">{{ $t('simpleSwap.selectToken') }}</div>
    <div class="select-token__wrap">
        <arrowSvg class="arrow" @click="router.push(router.options.history.state.back)" />
        <SearchInput @onChange="filterTokens" />
        <div v-if="tokens?.length" class="select-token__items">
            <div v-for="(item, ndx) in tokens" :key="ndx" @click="() => setToken(item)" class="select-token__item">
                <div class="network">
                    <div class="logo">
                        <TokenIcon width="24" height="24" :token="item" />
                    </div>
                    <div class="info">
                        <div class="symbol">{{ item.code }}</div>
                        <div class="name">{{ item.name }}</div>
                    </div>
                </div>
                <div class="amount">
                    <h3>
                        {{ prettyNumber(item.balance.amount || item.balance.mainBalance) }}
                        <span class="symbol">{{ item?.code }}</span>
                    </h3>
                    <h5 class="value"><span>$</span>{{ prettyNumber(item.balanceUsd) }}</h5>
                </div>
            </div>
        </div>
        <div v-else class="select-token__not-found">
            <notFoundSvg />
            <p>{{ $t('dashboard.notFound') }}</p>
        </div>
    </div>
</template>
<script>
import { useRouter } from 'vue-router';
import SearchInput from '@/components/ui/SearchInput';
import { prettyNumber } from '@/helpers/prettyNumber';
import TokenIcon from '@/components/ui/TokenIcon';
import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';
import notFoundSvg from '@/assets/icons/app/notFound.svg';

export default {
    name: 'SelectToken',
    components: {
        SearchInput,
        TokenIcon,
        arrowSvg,
        notFoundSvg,
    },
    props: {
        tokens: {
            required: true,
            default: [],
        },
    },
    emits: ['setToken', 'filterTokens'],
    setup(props, { emit }) {
        const router = useRouter();
        const setToken = (item) => {
            emit('setToken', item);
        };
        const filterTokens = (val) => {
            emit('filterTokens', val);
        };
        return {
            emit,
            router,
            prettyNumber,
            filterTokens,
            setToken,
        };
    },
};
</script>
<style lang="scss" scoped>
.select-token {
    &__wrap {
        width: 660px;
    }
    &__title {
        color: $colorBlack;
        font-size: 32px;
        font-family: 'Poppins_SemiBold';
        margin-bottom: 30px;
    }
    &__items {
        height: 470px;
        overflow-y: auto;
        margin: 0px -22px;
        padding: 0px 22px;
    }
    svg.arrow {
        cursor: pointer;
        fill: $colorDarkGray;
        position: absolute;
        transform: rotate(90deg);
        top: 20px;
    }

    &__not-found {
        text-align: center;
        margin-top: 15%;
        p {
            font-family: 'Poppins';
            font-style: normal;
            font-weight: 500;
            font-size: 20px;
            line-height: 27px;
            color: #494c56;
        }
    }

    &__item {
        font-family: 'Poppins';
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px solid $colorLightGreen;
        padding: 16px;
        border-radius: 16px;
        margin-top: 8px;
        &:hover {
            box-shadow: 0px 4px 30px rgba(0, 0, 0, 0.15);
        }
        cursor: pointer;
        .network {
            display: flex;
            align-items: center;
        }
        h3,
        h5 {
            font-family: 'Poppins_SemiBold';
            font-style: normal;
            font-weight: 700;
            font-size: 20px;
            text-align: right;
            margin: 0;
            color: $colorDarkPanel;
        }
        span {
            font-family: 'Poppins';
            font-size: 16px;
            font-weight: 300;
            color: $colorDarkGray;
        }
        h5 {
            font-size: 14px;
            line-height: 21px;
            color: $colorDarkGray;
            span {
                font-weight: 12px;
                font-weight: 300;
                font-family: 'Poppins_Regular';
            }
        }
        .amount {
            text-align: right;
        }
        .info {
            .symbol {
                font-family: 'Poppins_SemiBold';
                font-style: normal;
                font-weight: 700;
                font-size: 18px;
                line-height: 27px;
                text-transform: uppercase;
                color: $colorDarkPanel;
            }

            .name {
                font-family: 'Poppins';
                font-style: normal;
                font-weight: 400;
                font-size: 14px;
                line-height: 21px;
                color: #0d7e71;
            }
        }
        .logo {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: $colorDarkPanel;
            border-radius: 50%;
            margin-right: 12px;
        }
    }
}
body.dark {
}
</style>
