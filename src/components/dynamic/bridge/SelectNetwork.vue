<template>
    <div :class="{ active }" class="select" @click="active = !active">
        <div class="select__panel">
            <div class="info">
                <div class="network">
                    <img v-if="selectedItem" :src="selectedItem?.logo || selectedItem?.logoURI" alt="network-logo" class="network-logo" />
                </div>
                <div v-if="selectedItem" class="name">{{ selectedItem?.label || selectedItem?.name.replace(' Mainnet', '') }}</div>
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
                        <img :src="item.logoURI" alt="network-logo" class="network-logo" />
                    </div>
                    <div class="name">{{ item.label || item.name }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { onMounted, ref } from 'vue';

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
            if (selectedItem.value) {
                setActive(selectedItem.value);
            }
        });

        return { active, selectedItem, clickAway, setActive };
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
        background: $colorGray;
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
            background: #3fdfae;
            margin-right: 10px;

            svg {
                fill: $colorBlack;
            }

            &-logo {
                width: 70%;
                height: 70%;
            }
        }

        .name {
            font-size: 28px;
            font-family: 'Poppins_SemiBold';
            color: $colorBlack;
            user-select: none;
        }

        .label {
            color: #486060;
            font-size: 14px;
            font-family: 'Poppins_Medium';
            user-select: none;
        }

        .placeholder {
            color: #73b1b1;
            font-size: 18px;
            font-family: 'Poppins_SemiBold';
            user-select: none;
            line-height: 18px;
        }

        svg.arrow {
            cursor: pointer;
            fill: #73b1b1;
            transform: rotate(0);
            @include animateEasy;
        }
    }

    &.active {
        .select__panel {
            border: 2px solid $colorBaseGreen;
            background: $colorWhite;

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &__items {
        z-index: 11;
        background: #fff;
        position: absolute;
        left: 0;
        top: 80px;
        width: 100%;
        min-height: 40px;
        border-radius: 16px;
        border: 2px solid $colorBaseGreen;
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
            background: #d9f4f1;
            border-radius: 50%;
            margin-right: 12px;
            svg {
                fill: $colorBlack;
            }
        }
    }

    &__items-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 60px;
        border-bottom: 1px dashed #73b1b1;
        cursor: pointer;
        @include animateEasy;

        .info {
            .name {
                color: #486060;
            }

            .icon {
                transition: 0.2s;

                width: 32px;
                height: 32px;
                background-color: $colorSlimLightBlue;
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
                    color: #1c1f2c;
                    font-family: 'Poppins_SemiBold';
                }
            }
        }

        &:last-child {
            border-bottom-color: transparent;
        }

        &:hover {
            .info {
                .name {
                    color: $colorBaseGreen;
                }

                .icon {
                    background-color: $colorLightGreen;
                }
            }
            .select__items-item-logo {
                transition: 0.5s;
                background: #97ffd0;
            }
        }

        .info {
            display: flex;
            align-items: center;

            .name {
                font-size: 16px;
                color: #486060;
                font-family: 'Poppins_Regular';
            }
        }

        .amount {
            color: $colorBlack;
            font-family: 'Poppins_SemiBold';

            span {
                color: $colorBlack;
                font-family: 'Poppins_Regular';
            }
        }
    }
}

body.dark {
    .select {
        &__panel {
            background: $colorDarkPanel;

            svg.arrow {
                fill: #486060;
            }

            .info {
                .network {
                    background: #0c0d18;

                    svg {
                        fill: $colorWhite;
                    }
                }

                .name {
                    color: $colorWhite;
                }
            }
        }

        &.active {
            .select__panel {
                border: 2px solid $colorBrightGreen;
                background: $colorDarkPanel;
            }
        }

        .select__items {
            background: #0c0d18;
            border-color: $colorBrightGreen;
        }

        .select__items-item {
            border-color: #e8e9c933;

            &:last-child {
                border-color: transparent;
            }

            .info {
                .name {
                    color: $colorPl;
                }
            }

            .amount {
                color: $colorBrightGreen;

                span {
                    color: $colorPl;
                }
            }

            &:hover {
                .info {
                    .name {
                        color: #97ffd0;
                    }
                }
            }
        }

        .select__items-item.active {
            .info {
                .name {
                    color: $colorWhite;
                }
            }
        }
    }
}
</style>
