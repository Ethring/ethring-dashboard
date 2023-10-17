<template>
    <div class="select" ref="selectBlock">
        <div class="select__block" :class="{ 'select__block-active': showOptions }" @click="() => toggleOptions()">
            <div class="logo">
                <TokenIcon width="24px" height="24px" :token="selectedItem" />
            </div>
            <h3 v-if="selectedItem">{{ !isToken ? selectedItem?.name : selectedItem?.symbol }}</h3>
            <h3 v-else>Select</h3>
            <ArrowIcon class="arrow" />
        </div>
        <div class="select__items" v-if="showOptions">
            <div class="select__items-search">
                <input v-model="searchValue" :placeholder="placeholder" />
                <SearchIcon />
            </div>
            <div class="select__items-list" v-if="optionsList.length" @scroll="loadMore">
                <div
                    v-for="(item, i) in optionsList"
                    :key="i"
                    :class="{ active: item.net === selectedItem?.net, isToken }"
                    class="select__items-item"
                    @click="onSelect(item)"
                >
                    <div class="row">
                        <div class="logo">
                            <TokenIcon width="24px" height="24px" :token="item" />
                        </div>
                        <div class="column">
                            <h3>{{ !isToken ? item?.name : item?.symbol }}</h3>
                            <h5 v-if="isToken">{{ item?.name }}</h5>
                        </div>
                    </div>
                    <div class="balance" v-if="balance">
                        <h4>
                            {{ formatNumber(item.balance) }} <span>{{ item.symbol }}</span>
                        </h4>
                        <h6><span>$</span>{{ formatNumber(item.balanceUsd, 2) }}</h6>
                    </div>
                </div>

                <template v-if="isListloading">
                    <div class="select__items-item">
                        <a-space size="large">
                            <a-skeleton-avatar active />
                            <a-skeleton-input active />
                            <a-skeleton-input active />
                        </a-space>
                    </div>
                </template>
            </div>
            <div v-else-if="searchValue.length" class="select__items-not-found">
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

import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';
import SearchIcon from '@/assets/icons/app/search.svg';

import _ from 'lodash';

import { formatNumber } from '@/helpers/prettyNumber';
import { searchByKey } from '@/helpers/utils';

export default {
    name: 'Select',

    components: { TokenIcon, ArrowIcon, SearchIcon },

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
        const count = ref(10);
        const isListloading = ref(false);
        const selectBlock = ref(null);

        onClickOutside(selectBlock, () => (showOptions.value = false));

        const selectedItem = ref(props.value);
        const searchValue = ref();
        const showOptions = ref(false);
        const optionsList = ref(props.options.slice(0, count.value));

        const onSelect = (value) => {
            emit('onChange', value);
            selectedItem.value = value;
            toggleOptions();
        };

        const toggleOptions = () => {
            count.value = 10;
            optionsList.value = props.options.slice(0, count.value);
            searchValue.value = '';
            showOptions.value = !showOptions.value;
        };

        const searchInTokens = (tokens, value) => {
            return _.filter(tokens, (elem) => {
                return searchByKey(elem, value, 'name') || searchByKey(elem, value, 'symbol') || searchByKey(elem, value, 'address');
            });
        };

        const loadMore = () => {
            if (count.value > props.options.length || isListloading.value) {
                return;
            }
            const masonry = document.querySelector('.select__items-list');

            if (masonry.scrollTop + masonry.clientHeight + 1 < masonry.scrollHeight) {
                return;
            }

            isListloading.value = true;

            setTimeout(() => {
                count.value += 10;
                isListloading.value = false;
                if (searchValue.value) {
                    return (optionsList.value = searchInTokens(props.options, searchValue.value)?.slice(0, count.value));
                }
                return (optionsList.value = props.options.slice(0, count.value));
            }, 500);
        };

        watch(searchValue, (val) => {
            if (val.length) {
                optionsList.value = searchInTokens(props.options, searchValue.value)?.slice(0, count.value);
                return;
            }
            optionsList.value = props.options.slice(0, count.value);
        });

        watch(
            () => props.options,
            () => {
                optionsList.value = props.options.slice(0, count.value);
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
            isListloading,
            searchValue,
            optionsList,
            showOptions,
            loadMore,
            onSelect,
            toggleOptions,
            formatNumber,
        };
    },
};
</script>
<style lang="scss" scoped>
.select {
    &__block {
        position: relative;
        background-color: var(--#{$prefix}select-secondary-bg-color);
        width: 200px;
        height: 48px;
        border-radius: 24px;
        padding-left: 8px;
        border: 1px solid transparent;
        @include pageFlexRow;

        svg.arrow {
            margin: auto;
            position: absolute;
            right: 16px;
            cursor: pointer;
            fill: var(--#{$prefix}select-icon-color);
            transform: scale(0.8);
            @include animateEasy;
        }

        &-active {
            background-color: var(--#{$prefix}select-active-bg-color);
            border: 1px solid var(--#{$prefix}select-active-border-color);

            .arrow {
                transform: scale(0.8) rotate(180deg) !important;
            }
        }

        h3 {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            width: 110px;
        }
    }

    h3 {
        font-size: var(--#{$prefix}default-fs);
        color: var(--#{$prefix}primary-text) !important;
        line-height: var(--#{$prefix}h5-fs);
        font-weight: 600;
        margin: auto 0 auto 6px;
    }

    .logo {
        width: 32px;
        height: 32px;
    }
    &__items {
        padding: 20px 26px 6px;
        position: absolute;
        z-index: 10;
        left: 0;
        right: 0;
        width: 100%;
        height: 288px;
        background-color: var(--#{$prefix}select-dropdown-bg-color);
        border-radius: 16px;
        border: 2px solid var(--#{$prefix}select-active-border-color);

        &-list {
            width: 102%;
            height: 200px;
            overflow-y: auto;
            padding-right: 12px;
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
            font-weight: 600;
            margin: 0;
        }

        h5 {
            font-weight: 400;
            color: var(--#{$prefix}sub-text);
            font-size: var(--#{$prefix}small-sm-fs);
            margin: 0;
            line-height: var(--#{$prefix}default-fs);
        }

        &-search {
            height: 48px;
            width: 100%;
            border-radius: 8px;
            background-color: var(--#{$prefix}search-bg-color);
            @include pageFlexRow;
            justify-content: space-between;
            padding: 0 16px;
            margin-bottom: 4px;

            svg {
                fill: var(--#{$prefix}sub-text);
            }

            input {
                width: 95%;
                background-color: transparent;
                border: none;
                outline: none;
                font-size: var(--#{$prefix}default-fs);
                color: var(--#{$prefix}primary-text);
            }
        }

        &-item {
            @include pageFlexRow;
            justify-content: space-between;
            padding: 16px 0;
            border-bottom: 1px dashed var(--#{$prefix}border-secondary-color);

            &:last-child {
                border-bottom: none !important;
            }

            &:hover {
                h3 {
                    color: var(--#{$prefix}btn-text-hover-color);
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

                h4 {
                    font-weight: 600;
                    color: var(--#{$prefix}primary-text);
                    font-size: var(--#{$prefix}default-fs);
                    margin: 0;
                    line-height: var(--#{$prefix}h5-fs);
                }
                h6 {
                    color: var(--#{$prefix}sub-text);
                    font-size: var(--#{$prefix}small-sm-fs);
                    line-height: var(--#{$prefix}h6-fs);
                    margin: 0;

                    span {
                        font-size: var(--#{$prefix}small-sm-fs);
                        margin-right: 2px;
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
            margin-left: 12px;
        }

        .isToken {
            padding: 12.7px 0;
        }
    }

    .infinite-scroll {
        opacity: 0;
        height: 1px;
    }
}
</style>
