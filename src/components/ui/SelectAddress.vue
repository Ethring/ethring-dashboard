<template>
    <div :class="{ active: active && items?.length, focused, error }" class="select-address" @click="active = !active">
        <div class="select-address__panel">
            <div class="recipient">{{ $t('tokenOperations.recipient') }}</div>
            <div class="info-wrap">
                <div class="info">
                    <div class="network">
                        <img class="network-logo" alt="network-logo" :src="selectedNetwork.logo" />
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
                    <div v-if="address?.length" class="select-address__clear" @click="clearValue">
                        <ClearIcon />
                    </div>
                </div>
            </div>
        </div>
        <div v-if="active && items.length" class="select-address__items" v-click-away="clickAway">
            <div v-for="(item, ndx) in items" :key="ndx" class="select-address__items-item" @click="selectAddress(item)">
                <div class="info">
                    <div class="name">{{ item }}</div>
                </div>
                <CloseIcon class="remove" @click.stop="removeAddress(item)" />
            </div>
        </div>
    </div>
</template>
<script>
import CloseIcon from '@/assets/icons/app/close.svg';
import ClearIcon from '@/assets/icons/app/xmark.svg';

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
        CloseIcon,
        ClearIcon,
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

        const removeAddress = () => {
            address.value = '';
            emit('setAddress', address.value);
        };

        const clearValue = () => {
            address.value = '';
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
            clearValue,
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
        font-weight: 400;
    }

    &__panel {
        position: relative;
        display: flex;
        flex-direction: column;
        background: var(--#{$prefix}select-bg-color);
        border-radius: 16px;
        padding: 16px 24px;
        box-sizing: border-box;
        border: 2px solid transparent;
        transition: 0.2s;

        cursor: pointer;

        .recipient {
            display: flex;
            align-items: center;

            color: var(--#{$prefix}select-label-color);
            font-weight: 600;
            height: 32px;
            max-height: 32px;
        }

        .address {
            color: var(--#{$prefix}select-label-color);
            font-weight: 400;
        }

        .info-wrap {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .info {
            width: 95%;
            margin-top: 8px;
            display: flex;
            align-items: center;
        }

        .input-address {
            width: 100%;
            border: none;
            outline: none;
            background: transparent;
            font-size: var(--#{$prefix}h6-fs);
            font-weight: 500;
            color: var(--#{$prefix}primary-text);
        }

        .network {
            display: flex;
            justify-content: center;
            align-items: center;

            width: 40px;
            min-width: 40px;
            height: 40px;

            border-radius: 50%;
            margin-right: 10px;

            &-logo {
                width: 80%;
                height: 80%;
                border-radius: 50%;
            }
        }

        .name {
            font-size: var(--#{$prefix}h2-fs);
            font-weight: 600;
            color: var(--#{$prefix}select-placeholder-text);
            user-select: none;
        }
    }

    &__clear {
        position: absolute;
        right: 32px;
        cursor: pointer;
    }

    &.focused {
        .select-address__panel {
            border: 2px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-bg-color);
        }
    }

    &.active {
        .select-address__panel {
            border: 2px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-bg-color);

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &.error {
        .select-address__panel {
            border-color: var(--#{$prefix}danger-color);
            background: var(--#{$prefix}danger-op-01);
        }
    }

    &__items {
        z-index: 10;
        background: var(--#{$prefix}white);
        position: absolute;
        left: 0;
        top: 160px;
        width: 100%;
        min-height: 40px;
        border-radius: 16px;
        border: 2px solid var(--#{$prefix}select-active-border-color);
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
        border-bottom: 1px dashed var(--#{$prefix}select-border-color);
        cursor: pointer;
        @include animateEasy;

        &:hover {
            .remove {
                opacity: 1;
            }
        }

        .remove {
            opacity: 0.2;
            fill: red;
        }

        &.active {
            .info {
                .address {
                    color: var(--#{$prefix}black);
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
                    color: var(--#{$prefix}select-active-border-color);
                }
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

        .info {
            display: flex;
            align-items: center;

            .address {
                font-size: var(--#{$prefix}default-fs);
                color: var(--#{$prefix}black);
                font-weight: 400;
            }
        }
    }
}
</style>
