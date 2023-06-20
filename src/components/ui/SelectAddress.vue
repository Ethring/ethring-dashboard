<template>
    <div :class="{ active: active && items?.length, focused, error }" class="select-address" @click="active = !active">
        <div class="select-address__panel">
            <div class="recipient">{{ $t('simpleSend.recipient') }}</div>
            <div class="info-wrap">
                <div class="info">
                    <div class="network">
                        <component v-if="selectedNetwork?.net" :is="`${selectedNetwork?.net}Svg`" />
                    </div>
                    <input
                        v-model="address"
                        :placeholder="placeholder"
                        @focus="onFocus"
                        @input="onInput"
                        @blur="onBlur"
                        class="input-address"
                    />
                </div>
            </div>
        </div>
        <div v-if="active && items.length" class="select-address__items" v-click-away="clickAway">
            <div v-for="(item, ndx) in items" :key="ndx" class="select-address__items-item" @click="selectAddress(item)">
                <div class="info">
                    <div class="name">{{ item }}</div>
                </div>
                <closeSvg class="remove" @click.stop="removeAddress(item)" />
            </div>
        </div>
    </div>
</template>
<script>
import closeSvg from '@/assets/icons/app/close.svg';
import arrowSvg from '@/assets/icons/dashboard/arrowdowndropdown.svg';
import bscSvg from '@/assets/icons/networks/bsc.svg';
import ethSvg from '@/assets/icons/networks/eth.svg';
import polygonSvg from '@/assets/icons/networks/polygon.svg';
import optimismSvg from '@/assets/icons/networks/optimism.svg';
import arbitrumSvg from '@/assets/icons/networks/arbitrum.svg';
import evmosethSvg from '@/assets/icons/networks/evmoseth.svg';
import avalancheSvg from '@/assets/icons/networks/avalanche.svg';

import { ref, watch } from 'vue';

export default {
    name: 'SelectAddress',
    props: {
        selectedNetwork: {
            required: true,
            default: () => {},
        },
        items: {
            type: Array,
            default: () => [],
        },
        onReset: {
            type: [Boolean, String],
            default: false,
        },
        error: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        closeSvg,
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
        const focused = ref(false);
        const address = ref('');
        const placeholder = ref('Address');

        watch(
            () => props.onReset,
            () => {
                if (props.onReset) {
                    address.value = '';
                    active.value = false;
                    emit('setAddress', address.value);
                }
            }
        );

        const onFocus = () => {
            placeholder.value = '';
            focused.value = true;
        };

        const onInput = () => {
            emit('setAddress', address.value);
            active.value = false;
        };

        const onBlur = () => {
            emit('setAddress', address.value);
            placeholder.value = 'Address';
            focused.value = false;
        };

        const selectAddress = (addr) => {
            address.value = addr;

            emit('setAddress', address.value);
        };

        const clickAway = () => {
            active.value = false;
        };

        const removeAddress = (address) => {
            emit('removeAddress', { net: props.selectedNetwork.net, address });
            active.value = false;
        };

        return {
            active,
            focused,
            address,
            placeholder,
            removeAddress,
            clickAway,
            selectAddress,
            onInput,
            onBlur,
            onFocus,
        };
    },
};
</script>
<style lang="scss" scoped>
.select-address {
    position: relative;

    .name {
        font-size: 16px;
        color: $colorBlack;
        font-family: 'Poppins_Regular';
    }

    &__panel {
        position: relative;
        display: flex;
        flex-direction: column;
        background: $colorGray;
        border-radius: 16px;
        height: 130px;
        padding: 17px 32px;
        box-sizing: border-box;
        border: 2px solid transparent;
        cursor: pointer;

        .recipient {
            color: #486060;
            font-family: 'Poppins_SemiBold';
        }

        .address {
            color: #486060;
            font-family: 'Poppins_Regular';
        }

        .info-wrap {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .info {
            width: 95%;
            margin: 15px 0;
            display: flex;
            align-items: center;
        }

        .input-address {
            width: 100%;
            border: none;
            outline: none;
            background: transparent;
            font-size: 28px;
            font-family: 'Poppins_SemiBold';
        }

        .network {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 40px;
            min-width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3fdfae;
            margin-right: 10px;

            svg {
                fill: $colorBlack;
            }
        }

        .name {
            font-size: 28px;
            font-family: 'Poppins_SemiBold';
            color: #73b1b1;
            user-select: none;
        }

        svg.arrow {
            cursor: pointer;
            fill: #73b1b1;
            transform: rotate(0);
            @include animateEasy;
        }
    }

    &.focused {
        .select-address__panel {
            border: 2px solid $colorBaseGreen;
            background: $colorWhite;
        }
    }

    &.active {
        .select-address__panel {
            border: 2px solid $colorBaseGreen;
            background: $colorWhite;

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &.error {
        .select-address__panel {
            border-color: $colorRed;
            background: $colorLightOrange;
        }
    }

    &__items {
        z-index: 10;
        background: #fff;
        position: absolute;
        left: 0;
        top: 160px;
        width: 100%;
        min-height: 40px;
        border-radius: 16px;
        border: 2px solid $colorBaseGreen;
        padding: 20px 25px;
        box-sizing: border-box;
        max-height: 430px;
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: 0px;
            background-color: transparent;
        }
    }

    &__items-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 50px;
        border-bottom: 1px dashed #73b1b1;
        cursor: pointer;
        @include animateEasy;

        &:hover {
            .remove {
                opacity: 1;
            }
        }

        .remove {
            opacity: 0.2;
            fill: $colorBaseGreen;
        }

        &.active {
            .info {
                .address {
                    color: $colorBlack;
                    font-family: 'Poppins_SemiBold';
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

        .info {
            display: flex;
            align-items: center;

            .address {
                font-size: 16px;
                color: $colorBlack;
                font-family: 'Poppins_Regular';
            }
        }
    }
}

body.dark {
    .select-address {
        &__panel {
            background: $colorDarkPanel;

            .recipient,
            .address {
                color: $colorLightGreen;
            }

            svg.arrow {
                fill: #486060;
            }

            .input-address {
                color: $colorWhite;
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

        &.focused {
            .select-address__panel {
                border: 2px solid $colorBrightGreen;
                background: $colorDarkPanel;
            }
        }

        &.active {
            .select-address__panel {
                border: 2px solid $colorBrightGreen;
                background: $colorDarkPanel;
            }
        }

        &.error {
            .select-address__panel {
                border-color: $colorRed;
                background: $colorDarkPanel;
            }
        }

        .select-address__items {
            background: #0c0d18;
            border-color: $colorBrightGreen;
        }

        .select-address__items-item {
            border-color: #e8e9c933;

            &:last-child {
                border-color: transparent;
            }

            .info {
                .name {
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

            .amount {
                color: $colorLightGreen;

                span {
                    color: $colorWhite;
                }
            }
        }

        .select-address__items-item.active {
            .info {
                .address {
                    color: $colorWhite;
                }
            }
        }
    }
}
</style>
