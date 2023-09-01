<template>
    <div :class="{ active }" class="select" @click="active = !active">
        <div class="select__panel">
            <div class="info">
                <div class="network">
                    <img :src="current.logo" alt="network-logo" class="network-logo" />
                    <!-- <component :is="`${selectedItem?.net}Svg`" /> -->
                </div>
                <div v-if="selectedItem" class="name">{{ selectedItem?.name }}</div>
                <div v-else>
                    <div class="label">{{ label }}</div>
                    <div class="placeholder">{{ placeholder }}</div>
                </div>
            </div>
            <arrowSvg class="arrow" />
        </div>
        <div v-if="active" class="select__items" v-click-away="clickAway">
            <div
                v-for="(item, ndx) in items"
                :key="ndx"
                :class="{ active: item.name === selectedItem?.name }"
                class="select__items-item"
                @click="setActive(item)"
            >
                <div class="row">
                    <div class="select__items-item-logo">
                        <component :is="`${item?.net}Svg`" />
                    </div>
                    <div class="info">
                        <div class="name">{{ item.name }}</div>
                    </div>
                </div>
                <div class="amount">
                    {{ prettyNumber(item.balance?.mainBalance) }}
                    <span>{{ item.code }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import bscSvg from '@/assets/icons/networks/bsc.svg';
import ethSvg from '@/assets/icons/networks/eth.svg';
import polygonSvg from '@/assets/icons/networks/polygon.svg';
import optimismSvg from '@/assets/icons/networks/optimism.svg';
import arbitrumSvg from '@/assets/icons/networks/arbitrum.svg';
import evmosethSvg from '@/assets/icons/networks/evmoseth.svg';
import avalancheSvg from '@/assets/icons/networks/avalanche.svg';
import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';
import { prettyNumber } from '@/helpers/prettyNumber';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'Select',
    props: {
        items: {
            type: Array,
        },
        label: {
            type: String,
        },
        placeholder: {
            type: String,
        },
        current: {
            type: Object,
            default: () => {},
        },
    },
    components: {
        arrowSvg,
        bscSvg,
        ethSvg,
        polygonSvg,
        optimismSvg,
        arbitrumSvg,
        evmosethSvg,
        avalancheSvg,
    },
    setup(props, { emit }) {
        const active = ref(false);
        const store = useStore();
        const selectedItem = ref(props.items.find((elem) => elem.net === props.current.net));

        const clickAway = () => {
            active.value = false;
        };

        const setActive = (item) => {
            selectedItem.value = item;
            emit('select', selectedItem.value);
        };

        onMounted(() => {
            store.dispatch('networks/setSelectedNetwork', selectedItem.value);
        });

        return { active, selectedItem, prettyNumber, clickAway, setActive };
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
            border: 2px solid var(--#{$prefix}sub-text);
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
        border-bottom: 1px dashed var(--#{$prefix}select-border-color);
        cursor: pointer;
        @include animateEasy;

        .info {
            .name {
                color: var(--#{$prefix}base-text);
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
