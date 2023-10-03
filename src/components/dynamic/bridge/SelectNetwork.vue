<template>
    <div :class="{ active }" class="select" @click="active = !active">
        <div class="select__panel">
            <div class="info">
                <div class="network">
                    <img v-if="selectedItem" :src="selectedItem?.logo || selectedItem?.logoURI" alt="network-logo" class="network-logo" />
                </div>
                <div v-if="selectedItem" class="name">{{ networkName }}</div>
                <div v-else>
                    <div class="label">{{ label }}</div>
                    <div class="placeholder">{{ placeholder }}</div>
                </div>
            </div>
            <arrowSvg class="arrow" />
        </div>
        <div v-if="active" class="select__items" v-click-away="clickAway">
            <div
                v-for="(item, idx) in items"
                :key="idx"
                :class="{ active: item.net === selectedItem?.net }"
                class="select__items-item"
                @click="setActive(item)"
            >
                <div class="info">
                    <div class="icon">
                        <img :src="item.logo || item.logoURI" alt="network-logo" class="network-logo" />
                    </div>
                    <div class="name">{{ item.label || item.name }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, computed, onMounted } from 'vue';

import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';

export default {
    name: 'SelectNetwork',
    props: {
        items: {
            type: Array,
        },
        current: {
            type: Object,
            default: () => {},
        },
        label: {
            type: String,
        },
        placeholder: {
            type: String,
        },
    },
    components: {
        arrowSvg,
    },
    setup(props, { emit }) {
        const active = ref(false);
        const selectedItem = ref(props.current);

        const clickAway = () => {
            active.value = false;
        };

        const setActive = (item) => {
            selectedItem.value = item;
            emit('select', selectedItem.value);
        };

        onMounted(() => {
            if (props.current) {
                selectedItem.value = props.current;
                emit('select', selectedItem.value);
            }
        });

        const networkName = computed(() => {
            const { name, label } = selectedItem.value || {};

            if (name?.includes(' Mainnet')) {
                const replaced = name.replace(' Mainnet', '');
                return replaced || name;
            }

            return label || name;
        });

        return { active, selectedItem, networkName, clickAway, setActive };
    },
};
</script>
<style lang="scss" scoped>
.select {
    position: relative;
    .row {
        display: flex;
    }
    &__panel {
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
            background: var(--#{$prefix}icon-logo-bg-color);
            margin-right: 10px;

            svg {
                fill: var(--#{$prefix}black);
            }

            &-logo {
                width: 70%;
                height: 70%;
            }
        }

        .name {
            text-transform: uppercase;
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
            border: 2px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-bg-color);

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &__items {
        z-index: 11;
        background: var(--#{$prefix}select-dropdown-bg-color);
        position: absolute;
        left: 0;
        top: 80px;
        width: 100%;
        min-height: 40px;
        border-radius: 16px;
        border: 2px solid var(--#{$prefix}select-active-border-color);
        padding: 20px 25px;
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

    &__items-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 60px;
        border-bottom: 1px dashed var(--#{$prefix}border-secondary-color);
        cursor: pointer;
        @include animateEasy;

        .info {
            .name {
                text-transform: uppercase;
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
            }
        }

        &:last-child {
            border-bottom-color: transparent;
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
