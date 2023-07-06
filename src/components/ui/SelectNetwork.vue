<template>
    <div :class="{ active }" class="select" v-click-away="() => togglePanel(true)">
        <div class="select__panel" @click="() => togglePanel(false)" data-qa="select-network">
            <div class="info">
                <div class="network">
                    <img :src="currentChainInfo.logo" alt="network-logo" class="network-logo" />
                </div>
                <div class="name">{{ currentChainInfo?.label || currentChainInfo?.name }}</div>
            </div>
            <arrowSvg class="arrow" />
        </div>
        <div class="select__items">
            <div
                v-for="(item, idx) in items"
                :key="idx"
                :class="{ active: item.net === currentChainInfo?.net }"
                class="select__items-item"
                @click="$emit('select', item)"
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

import useWeb3Onboard from '@/compositions/useWeb3Onboard';

import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';

export default {
    name: 'SelectNetwork',
    props: {
        items: {
            type: Array,
        },
    },
    components: {
        arrowSvg,
    },
    setup() {
        const { currentChainInfo } = useWeb3Onboard();

        const active = ref(false);

        const togglePanel = (away = false) => {
            if (away) {
                return (active.value = false);
            }
            return (active.value = !active.value);
        };

        const clickAway = () => {
            active.value = false;
        };

        return { active, clickAway, togglePanel, currentChainInfo };
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
        background: $colorGray;
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
            border-color: $colorBaseGreen;
            background: $colorWhite;

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &__items {
        z-index: 1;
        background: #fff;
        position: absolute;
        top: 65px;

        left: 0;
        right: 0;

        width: 100%;

        min-height: 40px;

        border: 2px solid $colorBaseGreen;
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
            background: #d9f4f1;
            border-radius: 50%;
            margin-right: 12px;
            svg {
                fill: $colorBlack;
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
                .icon {
                    background-color: $colorLightGreen;
                }
            }
        }

        &:last-child {
            border-bottom: 1px solid transparent;
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
