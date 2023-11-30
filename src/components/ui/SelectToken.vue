<template>
    <div class="select-token__title">{{ $t('tokenOperations.selectToken') }}</div>
    <div class="select-token__wrap">
        <ArrowIcon class="arrow" @click="router.push(router.options.history.state.back)" />
        <SearchInput @onChange="handleOnFilterTokens" />

        <template v-if="tokensLoading || tokensList.length">
            <div class="select-token__items">
                <template v-if="tokensLoading">
                    <div v-for="(_, ndx) in 8" :key="ndx" class="select-token__item">
                        <a-skeleton active avatar :paragraph="{ rows: 0 }" :style="{ paddingTop: '15px' }" />
                    </div>
                </template>

                <template v-if="!tokensLoading && tokensList.length > 0">
                    <TokenRecord v-for="(item, ndx) in tokensList" :key="ndx" :record="item" @select-token="(token) => setToken(token)" />
                    <div v-if="isLoadMore" class="select-token__load-more">
                        <Button title="Load More" @click="handleLoadMore" />
                    </div>
                </template>
            </div>
        </template>

        <div v-else class="select-token__not-found">
            <NotFoundIcon />
            <p>{{ $t('dashboard.notFound') }}</p>
        </div>
    </div>
</template>
<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import _ from 'lodash';

import SearchInput from '@/components/ui/SearchInput';
import TokenRecord from '@/components/ui/Tokens/TokenRecord';

import Button from '@/components/ui/Button';

import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';
import NotFoundIcon from '@/assets/icons/app/notFound.svg';

import { prettyNumber } from '@/helpers/prettyNumber';
import { searchByKey } from '@/helpers/utils';

export default {
    name: 'SelectToken',
    components: {
        SearchInput,
        Button,
        ArrowIcon,
        NotFoundIcon,
        TokenRecord,
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
    setup(props, { emit }) {
        const MAX_TOKENS_PER_PAGE = 20;

        const router = useRouter();

        const searchValue = ref('');

        const isLoadMore = ref(false);
        const currentIndex = ref(MAX_TOKENS_PER_PAGE);

        const allTokens = computed(() => props.tokens || []);

        const setToken = (item) => {
            emit('setToken', item);
        };

        const handleOnFilterTokens = (val) => {
            searchValue.value = val;
            currentIndex.value = MAX_TOKENS_PER_PAGE;
        };

        const searchInTokens = (tokens, value) =>
            _.filter(
                tokens,
                (elem) => searchByKey(elem, value, 'name') || searchByKey(elem, value, 'symbol') || searchByKey(elem, value, 'address')
            );

        const getTokensList = () => {
            isLoadMore.value = false;

            let tokens = allTokens.value || [];

            if (searchValue.value) {
                tokens = searchInTokens(allTokens.value, searchValue.value);
            }

            if (tokens.length <= MAX_TOKENS_PER_PAGE) {
                isLoadMore.value = false;

                return tokens;
            }

            isLoadMore.value = allTokens.value.length > MAX_TOKENS_PER_PAGE && currentIndex.value <= tokens.length;

            return _.slice(tokens, 0, currentIndex.value);
        };

        const tokensList = computed({
            get: getTokensList,
            set: getTokensList,
        });

        const handleLoadMore = () => {
            currentIndex.value += MAX_TOKENS_PER_PAGE;

            if (currentIndex.value >= allTokens.value.length) {
                isLoadMore.value = false;
            }
        };

        return {
            prettyNumber,
            router,
            tokensList,
            isLoadMore,

            handleLoadMore,
            handleOnFilterTokens,
            setToken,
        };
    },
};
</script>
<style lang="scss" scoped>
.select-token {
    &__wrap {
        width: 70%;
        max-width: 524px;
    }

    &__title {
        color: var(--#{$prefix}primary-text);
        font-size: var(--#{$prefix}h4-fs);
        font-weight: 500;
        margin-bottom: 24px;
    }

    &__items {
        height: calc(80vh - 150px);
        overflow-y: auto;
        margin-top: 16px;
    }

    svg.arrow {
        cursor: pointer;
        fill: var(--#{$prefix}icon-active);
        position: absolute;
        transform: rotate(90deg);
        top: 6px;
    }

    &__not-found {
        text-align: center;
        margin-top: 15%;

        p {
            font-style: normal;
            font-weight: 500;
            font-size: var(--#{$prefix}h5-fs);
            line-height: 27px;
            color: var(--#{$prefix}mute-text);
        }
    }

    &__load-more {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }
}
</style>
