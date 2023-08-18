<template>
    <div :class="{ active: active && items?.length, focused, error }" class="select-address" @click="active = !active">
        <div class="select-address__panel">
            <div class="recipient">{{ $t('tokenOperations.recipient') }}</div>
            <div class="info-wrap">
                <div class="info">
                    <div class="network">
                        <component v-if="selectedNetwork?.net" :is="`${selectedNetwork?.net}Svg`" />
                    </div>
                    <input
                        v-model="address"
                        :placeholder="placeholder"
                        @focus="onFocus"
                        @blur="onBlur"
                        v-debounce:1s="onInput"
                        data-qa="input-address"
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

import { ref, watch, onMounted } from 'vue';

export default {
    name: 'SelectAddress',
    props: {
        value: {
            type: String,
            default: '',
        },
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
        const address = ref(props.value);
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

        onMounted(() => {
            if (props.value) {
                address.value = props.value;
            }
        });

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
        font-size: var(--#{$prefix}default-fs);
        color: var(--#{$prefix}black);
        font-family: 'Poppins_Regular';
    }

    &__panel {
        position: relative;
        display: flex;
        flex-direction: column;
        background: var(--#{$prefix}select-bg-color);
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
            font-size: var(--#{$prefix}h2-fs);
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
            background: var(--#{$prefix}turquoise);
            margin-right: 10px;

            svg {
                fill: var(--#{$prefix}black);
            }
        }

        .name {
            font-size: var(--#{$prefix}h2-fs);
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
            border: 2px solid var(--#{$prefix}surfieGreen);
            background: var(--#{$prefix}white);
        }
    }

    &.active {
        .select-address__panel {
            border: 2px solid var(--#{$prefix}surfieGreen);
            background: var(--#{$prefix}white);

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &.error {
        .select-address__panel {
            border-color: var(--#{$prefix}red);
            background: var(--#{$prefix}lightOrange);
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
        border: 2px solid var(--#{$prefix}surfieGreen);
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
            fill: var(--#{$prefix}surfieGreen);
        }

        &.active {
            .info {
                .address {
                    color: var(--#{$prefix}black);
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
                    color: var(--#{$prefix}surfieGreen);
                }
            }
        }

        .info {
            display: flex;
            align-items: center;

            .name {
                font-size: var(--#{$prefix}default-fs);
                color: #486060;
                font-family: 'Poppins_Regular';
            }
        }

        .info {
            display: flex;
            align-items: center;

            .address {
                font-size: var(--#{$prefix}default-fs);
                color: var(--#{$prefix}black);
                font-family: 'Poppins_Regular';
            }
        }
    }
}
</style>
