<template>
    <div :class="{ active }" class="select" v-click-away="() => togglePanel(true)">
        <div class="select__panel" @click="() => togglePanel(false)" data-qa="select-network">
            <div class="info">
                <div class="network">
                    <img :src="selectedItem.logo" alt="network-logo" class="network-logo" />
                </div>
                <div class="name">{{ selectedItem.name }}</div>
            </div>
            <arrowSvg class="arrow" />
        </div>
        <div class="select__items">
            <div
                v-for="(item, idx) in items"
                :key="idx"
                :class="{ active: item.net === selectedItem?.net }"
                class="select__items-item"
                @click="onSelectNetwork(item)"
            >
                <div class="info">
                    <div class="icon">
                        <img :src="item.logo" alt="network-logo" class="network-logo" />
                    </div>
                    <div class="name">{{ item.label || item.name }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';

export default {
    name: 'SelectNetwork',
    props: {
        items: {
            type: Array,
            default() {
                return [];
            },
        },
        current: {
            type: Object,
            default() {
                return {};
            },
        },
    },
    components: {
        arrowSvg,
    },
    setup(props, { emit }) {
        const { currentChainInfo } = useAdapter();

        const active = ref(false);
        const selectedItem = ref(props.current || currentChainInfo.value);

        const togglePanel = (away = false) => {
            if (away) {
                return (active.value = false);
            }
            return (active.value = !active.value);
        };

        const onSelectNetwork = (network) => {
            selectedItem.value = network;
            emit('select', network);
            return togglePanel(false);
        };

        const clickAway = () => {
            active.value = false;
        };

        return { active, clickAway, togglePanel, onSelectNetwork, selectedItem };
    },
};
</script>

<style lang="scss" scoped>
.select {
    position: relative;
    z-index: 11;
    &__panel {
        position: relative;
        z-index: 2;

        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--#{$prefix}select-bg-color);
        border-radius: 16px;
        height: 80px;
        padding: 17px 32px;
        box-sizing: border-box;
        border: 2px solid transparent;
        cursor: pointer;

        transition: 0.2s;

        .info {
            display: flex;
            align-items: center;
        }

        .network {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 40px;
            height: 40px;
            min-width: 40px;
            border-radius: 50%;

            background: var(--#{$prefix}primary);
            margin-right: 10px;

            svg {
                fill: var(--#{$prefix}black);
            }

            &-logo {
                width: 70%;
                height: 70%;
                border-radius: 50%;
            }
        }

        .name {
            font-size: var(--#{$prefix}h2-fs);
            font-weight: 600;
            color: var(--#{$prefix}select-item-color);
            user-select: none;
        }

        .label {
            color: var(--#{$prefix}select-label-color);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 500;
            user-select: none;
        }

        .placeholder {
            color: var(--#{$prefix}select-placeholder-text);
            font-size: var(--#{$prefix}h6-fs);
            font-weight: 600;
            user-select: none;
            line-height: 18px;
        }

        svg.arrow {
            cursor: pointer;
            fill: var(--#{$prefix}select-icon-color);
            transform: rotate(0);
            @include animateEasy;
        }
    }

    &.active {
        .select__panel {
            border-color: var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-bg-color);

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &__items {
        z-index: 1;
        background: var(--#{$prefix}select-dropdown-bg-color);
        position: absolute;
        top: 65px;

        left: 0;
        right: 0;

        width: 100%;

        min-height: 40px;

        border: 2px solid var(--#{$prefix}select-active-border-color);
        border-radius: 0 0 16px 16px;

        border-top: none;

        transform: scaleY(0);
        transform-origin: top;
        transition: transform 0.2s ease;

        padding: 20px 32px;
        box-sizing: border-box;

        max-height: 380px;
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: 0px;
            background-color: transparent;
        }
        &-item-logo {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--#{$prefix}icon-secondary-bg-color);
            border-radius: 50%;
            margin-right: 12px;
            svg {
                fill: var(--#{$prefix}black);
            }
        }
    }

    &.active &__items {
        transform: scaleY(1);
        opacity: 1;
    }

    &.active &__items-item {
        opacity: 1;
    }

    &__items-item {
        opacity: 0;

        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 60px;
        border-bottom: 1px dashed var(--#{$prefix}border-secondary-color);
        cursor: pointer;
        @include animateEasy;

        .info {
            .name {
                color: var(--#{$prefix}base-text);
            }

            .icon {
                transition: 0.2s;

                width: 32px;
                height: 32px;
                background-color: var(--#{$prefix}icon-secondary-bg-color);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;

                margin-right: 16px;

                img {
                    width: 100%;
                    height: 100%;
                    max-width: 20px;
                    max-height: 20px;
                }
            }
        }

        &.active {
            .info {
                .name {
                    color: var(--#{$prefix}select-item-active-color);
                    font-weight: 600;
                }
                .icon {
                    background-color: var(--#{$prefix}icon-secondary-bg-hover);
                }
            }
        }

        &:last-child {
            border-bottom: 1px solid transparent;
        }

        &:hover {
            .info {
                .name {
                    color: var(--#{$prefix}sub-text);
                }

                .icon {
                    background-color: var(--#{$prefix}icon-secondary-bg-hover);
                }
            }
            .select__items-item-logo {
                transition: 0.5s;
                background: var(--#{$prefix}icon-logo-bg-hover);
            }
        }

        .info {
            display: flex;
            align-items: center;

            .name {
                font-size: var(--#{$prefix}default-fs);
                color: var(--#{$prefix}base-text);
                font-weight: 400;
            }
        }

        .amount {
            color: var(--#{$prefix}black);
            font-weight: 600;

            span {
                color: var(--#{$prefix}black);
                font-weight: 400;
            }
        }
    }
}
</style>
