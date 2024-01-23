<template>
    <div class="select-network" data-qa="select-network">
        <div class="network" :class="{ 'default-network-logo': !name }">
            <TokenIcon v-if="current" :token="current" class="network-logo" />
        </div>

        <div class="label" :class="{ name, placeholder }">
            <template v-if="name">
                {{ name }}
            </template>
            <template v-else>
                {{ placeholder }}
            </template>
        </div>

        <ArrowDownIcon class="arrow" />
    </div>
</template>

<script>
import { ref, computed } from 'vue';

import _ from 'lodash';

import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

import ArrowDownIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

import { searchByKey } from '@/helpers/utils';

export default {
    name: 'SelectNetwork',
    props: {
        current: {
            type: Object,
            default() {
                return {};
            },
        },
        placeholder: {
            type: String,
        },
    },
    components: {
        TokenIcon,
        ArrowDownIcon,
    },
    setup(props, { emit }) {
        const active = ref(false);
        const searchValue = ref('');
        const options = ref(props.items);

        const name = computed(() => {
            const name = props.current?.name;
            return name;
        });

        const togglePanel = (away = false) => {
            options.value = props.items;
            searchValue.value = '';

            if (away) {
                return (active.value = false);
            }

            return (active.value = !active.value);
        };

        const onSelectNetwork = (network) => {
            emit('select', network);
            return togglePanel(false);
        };

        const clickAway = () => {
            active.value = false;
        };

        const searchInNetworks = (networks, value) => {
            return _.filter(networks, (elem) => {
                return searchByKey(elem, value, 'name') || searchByKey(elem, value, 'symbol');
            });
        };

        const handleOnFilterNetworks = (val) => {
            searchValue.value = val;
            options.value = searchInNetworks(props.items, val);
        };

        return {
            active,
            name,
            options,
            searchValue,
            clickAway,
            togglePanel,
            onSelectNetwork,
            handleOnFilterNetworks,
        };
    },
};
</script>

<style lang="scss" scoped>
// .select {
//     position: relative;
//     z-index: 11;

//     &__label {
//         color: var(--#{$prefix}select-label-color);
//         font-weight: 500;
//         margin-bottom: 4px;
//     }

//     &__panel {
//         @include pageFlexColumn;
//         align-items: flex-start;
//         background: var(--#{$prefix}select-bg-color);
//         border-radius: 8px;
//         height: 80px;
//         padding: 12px 16px;
//         box-sizing: border-box;
//         border: 1px solid transparent;
//         cursor: pointer;

//         transition: all 0.2s;

//         .info {
//             @include pageFlexRow;
//             overflow: hidden;
//         }

//         .network {
//             @include pageFlexRow;
//             justify-content: center;

//             width: 32px;
//             height: 32px;

//             border-radius: 50%;
//             margin-right: 8px;

//             &-logo {
//                 object-fit: contain;
//                 object-position: center;
//                 border-radius: 50%;
//                 width: 32px;
//                 height: 32px;
//             }
//         }

//         .default-network-logo {
//             background: var(--#{$prefix}select-secondary-bg-color);
//         }

//         .name {
//             font-size: var(--#{$prefix}h5-fs);
//             font-weight: 600;
//             color: var(--#{$prefix}select-item-color);
//             line-height: 40px;

//             user-select: none;
//             display: inline-block;
//             text-overflow: ellipsis;
//             overflow: hidden;
//             white-space: nowrap;
//             max-width: 100%;
//         }

//         .label {
//             color: var(--#{$prefix}select-label-color);
//             font-size: var(--#{$prefix}small-lg-fs);
//             line-height: 20px;
//             font-weight: 400;
//             user-select: none;
//         }

//         .placeholder {
//             color: var(--#{$prefix}select-placeholder-text);
//             font-size: var(--#{$prefix}h6-fs);
//             font-weight: 500;
//             user-select: none;
//             line-height: 18px;
//         }

//         svg.arrow {
//             cursor: pointer;
//             fill: var(--#{$prefix}select-icon-color);
//             transform: rotate(0);
//             @include animateEasy;
//             display: inline;
//             position: absolute;
//             right: 16px;
//             top: 40%;
//         }
//     }

//     &.active {
//         .select__panel {
//             border-color: var(--#{$prefix}select-active-border-color);
//             background: var(--#{$prefix}select-dropdown-bg-color);

//             svg.arrow {
//                 transform: rotate(180deg);
//             }
//         }

//         .default-network-logo {
//             background: var(--#{$prefix}select-bg-color);
//         }
//     }

//     &__items {
//         background: var(--#{$prefix}select-dropdown-bg-color);
//         position: absolute;
//         top: 74px;
//         left: 0;
//         right: 0;
//         height: 250px;
//         width: 524px;
//         z-index: -1;
//         padding: 22px 16px 4px;

//         border: 1px solid var(--#{$prefix}select-active-border-color);
//         border-radius: 0 0 8px 8px;
//         border-top: none;
//         transform: scaleY(0);
//         transform-origin: top;
//         transition: transform 0.2s;

//         &::-webkit-scrollbar {
//             width: 0px;
//             background-color: transparent;
//         }

//         &-container {
//             overflow-y: auto;
//             height: 170px;
//         }
//         .search {
//             position: sticky;
//             top: 0;
//             left: 16px;
//             right: 16px;
//         }

//         &-not-found {
//             @include pageFlexRow;
//             justify-content: center;
//             margin: auto;

//             p {
//                 font-weight: 400;
//                 margin-top: 15%;
//                 font-size: var(--#{$prefix}small-lg-fs);
//                 color: var(--#{$prefix}mute-text);
//             }
//         }

//         &-item-logo {
//             width: 32px;
//             height: 32px;
//             @include pageFlexRow;
//             justify-content: center;
//             background: var(--#{$prefix}icon-secondary-bg-color);
//             border-radius: 50%;

//             svg {
//                 fill: var(--#{$prefix}black);
//             }
//         }
//     }

//     &.active &__items {
//         transform: scaleY(1);
//         opacity: 1;
//     }

//     &.active &__items-item {
//         opacity: 1;
//     }

//     &__items-item {
//         @include pageFlexRow;
//         @include animateEasy;

//         opacity: 0;
//         justify-content: space-between;
//         height: 56px;
//         border-bottom: 1px dashed var(--#{$prefix}border-color);
//         cursor: pointer;

//         .info {
//             @include pageFlexRow;
//             .name {
//                 color: var(--#{$prefix}base-text);
//                 font-weight: 500;
//                 font-size: var(--#{$prefix}h6-fs);
//             }

//             .icon {
//                 transition: 0.2s;

//                 width: 32px;
//                 height: 32px;

//                 border-radius: 50%;
//                 @include pageFlexRow;
//                 justify-content: center;

//                 margin-right: 8px;

//                 img {
//                     width: 100%;
//                     height: 100%;
//                 }
//             }
//         }

//         &.active {
//             .info {
//                 .name {
//                     color: var(--#{$prefix}select-item-active-color);
//                     font-weight: 500;
//                 }
//             }
//         }

//         &:last-child {
//             border-bottom: 1px solid transparent;
//         }

//         &:hover {
//             .info {
//                 .name {
//                     color: var(--#{$prefix}primary-text);
//                 }
//             }
//             .select__items-item-logo {
//                 transition: 0.5s;
//                 background: var(--#{$prefix}icon-logo-bg-hover);
//             }
//         }

//         .amount {
//             color: var(--#{$prefix}black);
//             font-weight: 600;

//             span {
//                 color: var(--#{$prefix}black);
//                 font-weight: 400;
//             }
//         }
//     }
// }
</style>
