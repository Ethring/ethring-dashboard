<template>
    <div :class="{ active: active && items?.length, focused, error: isError }" class="select-address" @click="active = !active">
        <div class="select-address__panel">
            <div class="recipient">{{ $t('tokenOperations.recipient') }}</div>
            <div class="info-wrap">
                <div class="info">
                    <img class="network" alt="network-logo" :src="selectedNetwork?.logo" />
                    <input
                        v-model="address"
                        :placeholder="placeholder"
                        @focus="onFocus"
                        @blur="onBlur"
                        v-debounce:1s="onInput"
                        data-qa="input-address"
                        class="input-address"
                        :class="inputClass"
                    />
                    <div v-if="address?.length" class="select-address__clear" @click="clearValue">
                        <ClearIcon />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import ClearIcon from '@/assets/icons/app/xmark.svg';

import { ref, watch, onMounted, onUpdated, computed } from 'vue';
import { useStore } from 'vuex';

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
        ClearIcon,
    },
    setup(props, { emit }) {
        const store = useStore();

        const active = ref(false);
        const focused = ref(false);
        const inputClass = ref('');
        const address = ref(props.value);
        const isError = ref(props.error);

        const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);
        const selectedDstNetwork = computed(() => store.getters['tokenOps/dstNetwork']);

        const addressPlaceholder = computed(() => {
            const target = selectedDstNetwork.value || selectedSrcNetwork.value;

            const { bech32_prefix = null, address_validating = null } = target || {};

            if (bech32_prefix) {
                return `${bech32_prefix}1abc...`;
            }

            if (address_validating) {
                return '0x1234abcd...';
            }

            return 'Address';
        });

        const resetAddress = () => {
            if (props.onReset) {
                address.value = '';
                active.value = false;
                emit('setAddress', '');
            }
        };

        const getClassName = () => {
            if (address.value.length > 50) {
                return 'small-size';
            }

            if (address.value.length > 46) {
                return 'medium-size';
            }

            return '';
        };

        const onFocus = () => {
            focused.value = true;
        };

        const onInput = () => {
            emit('setAddress', address.value);
            active.value = false;
        };

        const onBlur = () => {
            emit('setAddress', address.value);
            focused.value = false;
        };

        const selectAddress = (addr) => {
            address.value = addr;

            emit('setAddress', address.value);
        };

        const clickAway = () => {
            active.value = false;
        };

        const clearValue = () => {
            address.value = '';
            isError.value = false;

            emit('setAddress', address.value);
        };

        watch(
            () => props.onReset,
            () => resetAddress()
        );

        watch(address, () => {
            inputClass.value = getClassName();
        });

        watch(
            () => props.error,
            () => {
                isError.value = props.error;
            }
        );

        onMounted(() => {
            if (props.value) {
                address.value = props.value;
            }
        });

        onUpdated(() => resetAddress());

        return {
            active,
            focused,
            isError,

            address,
            placeholder: addressPlaceholder,

            inputClass,
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

    &__panel {
        position: relative;
        display: flex;
        flex-direction: column;
        background: var(--#{$prefix}select-bg-color);
        border-radius: 8px;
        padding: 10px 16px;
        height: 80px;
        box-sizing: border-box;
        border: 1px solid transparent;
        transition: 0.2s;

        .recipient {
            @include pageFlexRow;

            color: var(--#{$prefix}select-label-color);
            font-weight: 500;
            line-height: 20px;
        }

        .info-wrap {
            @include pageFlexRow;
            justify-content: space-between;
            margin-top: 2px;
        }

        .info {
            @include pageFlexRow;

            width: 95%;
        }

        .input-address {
            width: 100%;
            border: none;
            outline: none;
            background: transparent;
            font-size: var(--#{$prefix}h6-fs);
            font-weight: 400;
            color: var(--#{$prefix}primary-text);
        }

        .medium-size {
            font-size: var(--#{$prefix}medium-fs) !important;
        }

        .small-size {
            font-size: var(--#{$prefix}--#{$prefix}default-fs) !important;
        }

        .network {
            width: 32px;
            height: 32px;
            margin-right: 6px;

            border-radius: 50%;
        }
    }

    &__clear {
        position: absolute;
        right: 16px;
        cursor: pointer;
    }

    &.focused {
        .select-address__panel {
            border: 1px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-bg-color);
        }
    }

    &.active {
        .select-address__panel {
            border: 1px solid var(--#{$prefix}select-active-border-color);
            background: var(--#{$prefix}select-bg-color);

            svg.arrow {
                transform: rotate(180deg);
            }
        }
    }

    &.error {
        input {
            color: var(--#{$prefix}danger-color) !important;
        }
    }
}
</style>
