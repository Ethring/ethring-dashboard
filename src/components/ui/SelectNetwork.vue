<template>
    <div :class="{ active }" class="select" v-click-away="() => togglePanel(true)">
        <div class="select__panel" @click="() => togglePanel(false)" data-qa="select-network">
            <div class="info">
                <div class="network" :class="{ 'default-network-logo': !name }">
                    <img v-if="current?.logo" :src="current?.logo" alt="network-logo" class="network-logo" />
                </div>
                <div v-if="name" class="name">{{ name }}</div>
                <div v-else>
                    <div class="label">{{ label }}</div>
                    <div class="placeholder">{{ placeholder }}</div>
                </div>
            </div>
            <ArrowDownIcon class="arrow" />
        </div>
        <div class="select__items">
            <div
                v-for="(item, idx) in items"
                :key="idx"
                :class="{ active: item.net === current?.net }"
                class="select__items-item"
                @click="() => onSelectNetwork(item)"
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
import { ref, computed } from 'vue';

import ArrowDownIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

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
        label: {
            type: String,
        },
        placeholder: {
            type: String,
        },
    },
    components: {
        ArrowDownIcon,
    },
    setup(props, { emit }) {
        const active = ref(false);

        const name = computed(() => {
            const name = props.current?.name;
            return name;
        });

        const togglePanel = (away = false) => {
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

        return {
            active,
            name,
            clickAway,
            togglePanel,
            onSelectNetwork,
        };
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

        @include pageFlexRow;
        justify-content: space-between;
        background: var(--#{$prefix}select-bg-color);
        border-radius: 8px;
        height: 80px;
        padding: 12px 16px;
        box-sizing: border-box;
        border: 1px solid transparent;
        cursor: pointer;

        transition: 0.2s;

        .info {
            @include pageFlexRow;
            overflow: hidden;
        }

        .network {
            @include pageFlexRow;
            justify-content: center;

            width: 40px;
            height: 40px;
            min-width: 40px;

            border-radius: 50%;
            margin-right: 10px;

            svg {
                fill: var(--#{$prefix}black);
            }

            &-logo {
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: center;
                border-radius: 50%;
                max-width: 32px;
                max-height: 32px;
            }
        }

        .default-network-logo {
            background: var(--#{$prefix}select-secondary-bg-color);
        }

        .name {
            font-size: var(--#{$prefix}h4-fs);
            font-weight: 600;
            color: var(--#{$prefix}select-item-color);
            line-height: 40px;

            user-select: none;
            display: inline-block;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: 100%;
        }

        .label {
            color: var(--#{$prefix}select-label-color);
            font-size: var(--#{$prefix}small-lg-fs);
            line-height: 20px;
            font-weight: 500;
            user-select: none;
        }

        .placeholder {
            color: var(--#{$prefix}select-placeholder-text);
            font-size: var(--#{$prefix}default-fs);
            font-weight: 600;
            user-select: none;
            line-height: 18px;
        }

        svg.arrow {
            cursor: pointer;
            fill: var(--#{$prefix}select-icon-color);
            transform: rotate(0);
            @include animateEasy;
            display: inline;
            margin-left: 10px;
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

        min-height: 32px;

        border: 1px solid var(--#{$prefix}select-active-border-color);
        border-radius: 0 0 8px 8px;

        border-top: none;

        transform: scaleY(0);
        transform-origin: top;
        transition: transform 0.2s ease;

        padding: 16px 16px 4px;
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
            @include pageFlexRow;
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

        @include pageFlexRow;
        justify-content: space-between;
        min-height: 56px;
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

                border-radius: 50%;
                @include pageFlexRow;
                justify-content: center;

                margin-right: 10px;

                img {
                    width: 100%;
                    height: 100%;
                    max-width: 24px;
                    max-height: 24px;
                }
            }
        }

        &.active {
            .info {
                .name {
                    color: var(--#{$prefix}select-item-active-color);
                    font-weight: 600;
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
            }
            .select__items-item-logo {
                transition: 0.5s;
                background: var(--#{$prefix}icon-logo-bg-hover);
            }
        }

        .info {
            @include pageFlexRow;

            .name {
                font-size: var(--#{$prefix}h6-fs);
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
