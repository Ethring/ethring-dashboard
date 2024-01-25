<template>
    <a-form-item
        class="select-panel"
        :class="{ active: active, focused, error: isError }"
        @click="active = true"
        v-click-away="(active = false)"
    >
        <div class="input-label">{{ $t('tokenOperations.recipient') }}</div>

        <a-input-group compact class="input-group">
            <div>
                <TokenIcon :token="selectedNetwork" class="network" width="32" height="32" />
            </div>
            <a-input
                allow-clear
                v-model:value="address"
                class="base-input"
                data-qa="input-address"
                :bordered="false"
                :placeholder="placeholder"
                v-debounce:1s="onInput"
                @focus="focused = true"
                @blur="onBlur"
            >
                <template #clearIcon>
                    <ClearIcon />
                </template>
            </a-input>
        </a-input-group>

        <div class="bottom">
            <a-tooltip v-if="address" placement="topLeft">
                <template #title>{{ address }}</template>
                {{ displayAddress }}
            </a-tooltip>
            <template v-else>
                {{ displayAddress }}
            </template>
        </div>
    </a-form-item>
</template>
<script>
import ClearIcon from '@/assets/icons/app/xmark.svg';
import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'SelectAddressInput',
    props: {
        value: {
            type: String,
            default: '',
        },
        selectedNetwork: {
            required: true,
            default: () => {},
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
        TokenIcon,
    },
    setup(props, { emit }) {
        const store = useStore();

        const active = ref(false);
        const focused = ref(false);
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

        const clearValue = () => {
            address.value = '';
            isError.value = false;

            emit('setAddress', address.value);
        };

        const displayAddress = computed(() => {
            if (!address.value) {
                return addressPlaceholder.value;
            }

            if (address.value?.length < 55) {
                return address.value;
            }

            return address.value.slice(0, 12) + '...' + address.value.slice(-6);
        });

        // =================================================================================================================

        watch(
            () => props.onReset,
            () => resetAddress()
        );

        watch(
            () => props.error,
            () => {
                isError.value = props.error;
            }
        );

        return {
            active,
            focused,
            isError,

            address,
            displayAddress,

            placeholder: addressPlaceholder,

            selectAddress,

            onInput,
            onBlur,

            clearValue,
        };
    },
};
</script>
