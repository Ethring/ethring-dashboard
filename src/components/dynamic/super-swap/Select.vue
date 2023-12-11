<template>
    <div class="select" :class="{ active }" ref="selectBlock">
        <div class="select__block" data-qa="select__block" :class="{ 'select__block-active': active }" @click="() => toggleOptions()">
            <div class="logo">
                <TokenIcon width="24px" height="24px" :token="selectedItem" />
            </div>
            <h3 v-if="selectedItem">{{ !isToken ? selectedItem?.name : selectedItem?.symbol }}</h3>
            <h3 v-else>Select</h3>
            <ArrowIcon class="arrow" />
        </div>
        <div class="select__items" data-qa="select__items">
            <div class="select__items-search">
                <SearchInput :value="searchValue" @onChange="handleOnFilterOptions" :placeholder="placeholder" />
            </div>
            <div class="select__items-list" v-if="optionsList.length" @scroll="loadMore">
                <div
                    v-for="(item, i) in optionsList"
                    :key="i"
                    :class="{ isToken, selected: item.selected, active: item.name === selectedItem?.name }"
                    class="select__items-item"
                    data-qa="item"
                    @click="onSelect(item)"
                >
                    <div class="row">
                        <div class="logo">
                            <TokenIcon width="24px" height="24px" :token="item" />
                        </div>
                        <div class="column">
                            <h3 data-qa="item__name">{{ !isToken ? item?.name : item?.symbol }}</h3>
                            <h5 v-if="isToken">{{ item?.name }}</h5>
                        </div>
                    </div>
                    <div class="balance" v-if="balance">
                        <h4>
                            <NumberTooltip :value="item.balance" decimals="3" />
                            <span>{{ item.symbol }}</span>
                        </h4>
                        <h6>
                            <span class="usd-symbol">$</span>
                            <NumberTooltip :value="item.balanceUsd" decimals="2" />
                        </h6>
                    </div>
                </div>

                <template v-if="isListLoading">
                    <div class="select__items-item">
                        <a-space size="large">
                            <a-skeleton-avatar active />
                            <a-skeleton-input active />
                            <a-skeleton-input active />
                        </a-space>
                    </div>
                </template>
            </div>
            <div v-else-if="searchValue?.length" class="select__items-not-found">
                <p>{{ $t('dashboard.notFound') }}</p>
            </div>
            <div v-if="!options.length" class="select__items-not-found">
                <p>{{ $t('tokenOperations.emptyAssets') }}</p>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, watch } from 'vue';

import { onClickOutside } from '@vueuse/core';

import TokenIcon from '@/components/ui/TokenIcon';
import NumberTooltip from '@/components/ui/NumberTooltip';
import SearchInput from '@/components/ui/SearchInput';

import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

import _ from 'lodash';

import { formatNumber } from '@/helpers/prettyNumber';
import { searchByKey } from '@/helpers/utils';

export default {
    name: 'Select',

    components: { TokenIcon, ArrowIcon, SearchInput, NumberTooltip },

    props: {
        value: {
            required: true,
            default: {},
        },
        options: {
            required: true,
            default: [],
        },
        isToken: {
            type: Boolean,
            required: false,
            default: false,
        },
        placeholder: {
            required: false,
            default: '',
        },
        balance: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    setup(props, { emit }) {
        const MAX_TOKENS_PER_PAGE = 20;
        const currentIndex = ref(MAX_TOKENS_PER_PAGE);

        const isListLoading = ref(false);
        const selectBlock = ref(null);

        onClickOutside(selectBlock, () => (active.value = false));

        const selectedItem = ref(props.value);
        const searchValue = ref();
        const active = ref(false);
        const optionsList = ref(props.options.slice(0, currentIndex.value));

        const timer = ref(null);

        const onSelect = (value) => {
            emit('onChange', value);
            selectedItem.value = value;
            toggleOptions();
        };

        const toggleOptions = () => {
            currentIndex.value = MAX_TOKENS_PER_PAGE;
            optionsList.value = props.options.slice(0, currentIndex.value);
            searchValue.value = '';
            active.value = !active.value;
        };

        const searchInTokens = (tokens, value) => {
            return _.filter(tokens, (elem) => {
                return searchByKey(elem, value, 'name') || searchByKey(elem, value, 'symbol') || searchByKey(elem, value, 'address');
            });
        };

        const loadMore = () => {
            if (currentIndex.value > props.options.length) {
                return;
            }

            const masonry = document.querySelector('.select__items-list');

            if (masonry.scrollTop + masonry.clientHeight + 1 < masonry.scrollHeight) {
                return;
            }

            clearTimeout(timer.value);

            let tokens = props.options || [];

            if (searchValue.value) {
                tokens = searchInTokens(props.options, searchValue.value);
            }

            if (tokens.length <= MAX_TOKENS_PER_PAGE) {
                isListLoading.value = false;
                return (optionsList.value = tokens);
            }

            if (tokens.length <= currentIndex.value) {
                isListLoading.value = false;
                return;
            }

            isListLoading.value = true;

            currentIndex.value += MAX_TOKENS_PER_PAGE;

            optionsList.value = _.slice(tokens, 0, currentIndex.value);

            return (timer.value = setTimeout(() => {
                isListLoading.value = false;
            }, 500));
        };

        const handleOnFilterOptions = (val) => {
            searchValue.value = val;
            if (val.length) {
                clearTimeout(timer.value);
                optionsList.value = searchInTokens(props.options, val)?.slice(0, currentIndex.value);
                return;
            }
            optionsList.value = props.options.slice(0, currentIndex.value);
        };

        watch(
            () => props.options,
            () => {
                optionsList.value = props.options.slice(0, currentIndex.value);
            }
        );

        watch(
            () => props.value,
            () => {
                selectedItem.value = props.value;
            }
        );

        return {
            selectedItem,
            selectBlock,
            isListLoading,
            searchValue,
            optionsList,
            active,
            loadMore,
            onSelect,
            toggleOptions,
            formatNumber,
            handleOnFilterOptions,
        };
    },
};
</script>
<style lang="scss" scoped>
.select {
    &__block {
        position: relative;
        background-color: var(--#{$prefix}select-secondary-bg-color);
        width: 180px;
        height: 40px;
        border-radius: 24px;
        padding-left: 4px;
        border: 1px solid transparent;
        @include pageFlexRow;

        svg.arrow {
            margin: auto;
            position: absolute;
            right: 16px;
            cursor: pointer;
            fill: var(--#{$prefix}select-icon-color);
            @include animateEasy;
        }

        &-active {
            background-color: var(--#{$prefix}select-active-bg-color);
            border: 1px solid var(--#{$prefix}select-active-border-color);

            .arrow {
                transform: rotate(180deg) !important;
            }
        }

        h3 {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            width: 100px;
        }

        &:hover {
            border: 1px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-active-bg-color);
        }
    }

    h3 {
        font-size: var(--#{$prefix}h6-fs);
        color: var(--#{$prefix}primary-text);
        font-weight: 500;
        line-height: 24px;
        margin: auto 0 auto 6px;
    }

    .logo {
        width: 32px;
        height: 32px;
    }

    &.active &__items {
        transform: scaleY(1);
        opacity: 1;
    }

    &.active &__items-item {
        opacity: 1;
    }

    &__items {
        padding: 16px 16px 2px;
        position: absolute;
        z-index: 10;
        left: 0;
        right: 0;
        width: 100%;
        height: 288px;
        background-color: var(--#{$prefix}select-dropdown-bg-color);
        border-radius: 8px;
        border: 1px solid var(--#{$prefix}select-active-border-color);

        transform: scaleY(0);
        transform-origin: top;
        transition: transform 0.2s ease;

        &-list {
            width: 102%;
            height: 200px;
            overflow-y: auto;
            padding-right: 8px;

            .active {
                h3 {
                    color: var(--#{$prefix}primary-text);
                }
            }
        }

        &-not-found {
            @include pageFlexRow;
            justify-content: center;
            height: 200px;
            margin: auto;

            p {
                font-weight: 400;
                font-size: var(--#{$prefix}small-lg-fs);
                color: var(--#{$prefix}mute-text);
            }
        }

        h3 {
            color: var(--#{$prefix}base-text);
            font-weight: 500;
            margin: 0;
            line-height: 18px;
        }

        h5 {
            font-weight: 400;
            color: var(--#{$prefix}sub-text);
            font-size: var(--#{$prefix}small-sm-fs);
            margin: 0;
            line-height: 16px;
        }

        &-item {
            @include pageFlexRow;
            height: 56px;
            justify-content: space-between;
            padding: 16px;
            padding-left: 0;
            border-bottom: 1px dashed var(--#{$prefix}border-color);

            &.selected {
                border: 1px solid transparent;
                background-color: var(--zmt-icon-secondary-bg-color);
                border-radius: 8px;
                color: var(--#{$prefix}btn-text-hover);
            }

            &:last-child {
                border-bottom: none;
            }

            &:hover {
                h3 {
                    color: var(--#{$prefix}btn-text-hover);
                    cursor: pointer;
                }
            }
            .balance {
                margin: 0;
                text-align: right;

                span {
                    font-weight: 400;
                    color: var(--#{$prefix}mute-text);
                    font-size: var(--#{$prefix}small-lg-fs);
                }

                .usd-symbol {
                    margin-right: -3px;
                }

                h4 {
                    font-weight: 500;
                    color: var(--#{$prefix}primary-text);
                    font-size: var(--#{$prefix}h6-fs);
                    margin: 0;
                    line-height: var(--#{$prefix}h5-fs);

                    span {
                        margin-left: 2px;
                    }
                }

                h6 {
                    color: var(--#{$prefix}sub-text);
                    font-size: var(--#{$prefix}small-sm-fs);
                    line-height: var(--#{$prefix}h6-fs);
                    margin: 0;

                    span {
                        font-size: var(--#{$prefix}small-sm-fs);
                    }
                }
            }
        }

        .row {
            @include pageFlexRow;
        }

        .column {
            @include pageFlexColumn;
            justify-content: center;
            align-items: flex-start;
            margin-left: 10px;
        }

        .isToken {
            padding: 10px 8px;
            margin: 6px 0;
        }
    }

    .infinite-scroll {
        opacity: 0;
        height: 1px;
    }
}
</style>
