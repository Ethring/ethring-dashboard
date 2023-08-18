<template>
    <div class="select-token__title">{{ $t('tokenOperations.selectToken') }}</div>
    <div class="select-token__wrap">
        <arrowSvg class="arrow" @click="router.push(router.options.history.state.back)" />
        <SearchInput @onChange="filterTokens" />

        <template v-if="tokensLoading || tokens.length">
            <div class="select-token__items">
                <template v-if="tokensLoading">
                    <div v-for="(_, ndx) in 8" :key="ndx" class="select-token__item">
                        <a-skeleton active avatar :paragraph="{ rows: 0 }" :style="{ paddingTop: '15px' }" />
                    </div>
                </template>
                <template v-if="!tokensLoading && tokens.length > 0">
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
                                {{ prettyNumber(item?.balance?.amount || item?.balance?.mainBalance) }}
                                <span class="symbol">{{ item?.code }}</span>
                            </h3>
                            <h5 class="value"><span>$</span>{{ prettyNumber(item?.balanceUsd) }}</h5>
                        </div>
                    </div>
                </template>
            </div>
        </template>

        <div v-if="!tokensLoading && tokens.length === 0" class="select-token__not-found">
            <notFoundSvg />
            <p>{{ $t('dashboard.notFound') }}</p>
        </div>
    </div>
</template>
<script>
import { useRouter } from 'vue-router';

import SearchInput from '@/components/ui/SearchInput';
import TokenIcon from '@/components/ui/TokenIcon';

import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';
import notFoundSvg from '@/assets/icons/app/notFound.svg';

import { prettyNumber } from '@/helpers/prettyNumber';

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
        tokensLoading: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    emits: ['setToken', 'filterTokens'],
    setup(_, { emit }) {
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
        color: var(--#{$prefix}black);
        font-size: var(--#{$prefix}h1-fs);
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
        fill: var(--#{$prefix}icon-active);
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
            font-size: var(--#{$prefix}h5-fs);
            line-height: 27px;
            color: var(--#{$prefix}mute-text);
        }
    }

    &__item {
        font-family: 'Poppins';
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px solid var(--#{$prefix}border-color);
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
            font-size: var(--#{$prefix}h5-fs);
            text-align: right;
            margin: 0;
            color: var(--#{$prefix}primary);
        }
        span {
            font-family: 'Poppins';
            font-size: var(--#{$prefix}default-fs);
            font-weight: 300;
            color: var(--#{$prefix}mineralGreen);
        }
        h5 {
            font-size: var(--#{$prefix}small-lg-fs);
            line-height: 21px;
            color: var(--#{$prefix}mineralGreen);
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
                font-size: var(--#{$prefix}h6-fs);
                line-height: 27px;
                text-transform: uppercase;
                color: var(--#{$prefix}primary);
            }

            .name {
                font-family: 'Poppins';
                font-style: normal;
                font-weight: 400;
                font-size: var(--#{$prefix}small-lg-fs);
                line-height: 21px;
                color: var(--#{$prefix}sub-text);
            }
        }
        .logo {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--#{$prefix}primary);
            border-radius: 50%;
            margin-right: 12px;
        }
    }
}
</style>
