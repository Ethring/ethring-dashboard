<template>
    <a-form-item
        v-click-away="(active = false)"
        class="select-panel"
        :class="{ active: active, focused, error: isError, disabled }"
        @click="active = true"
    >
        <div class="input-label">{{ $t(label) }}</div>

        <a-input-group compact class="input-group">
            <div v-if="selectedNetwork" class="mr-8">
                <TokenIcon :token="selectedNetwork" class="network" width="32" height="32" />
            </div>
            <a-input
                v-model:value="address"
                v-debounce:1s="onInput"
                allow-clear
                class="base-input"
                data-qa="input-address"
                :disabled="disabled"
                :bordered="false"
                :placeholder="placeholder"
                @focus="focused = true"
                @blur="onBlur"
            >
                <template #clearIcon>
                    <ClearIcon class="input-clear-icon" />
                </template>
            </a-input>
        </a-input-group>

        <div v-if="selectedNetwork" class="bottom">
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
import ClearIcon from '@/assets/icons/form-icons/clear.svg';
import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

import { ref, watch, computed, inject } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'SelectAddressInput',
    components: {
        ClearIcon,
        TokenIcon,
    },
    props: {
        value: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: 'tokenOperations.recipient',
        },
        selectedNetwork: {
            type: [Object, null],
            required: true,
            default: () => {},
        },
        onReset: {
            type: [Boolean, String],
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['setAddress', 'error-status'],
    setup(props, { emit }) {
        const MAX_LENGTH = 40;

        const store = useStore();
        const useAdapter = inject('useAdapter');

        const active = ref(false);
        const focused = ref(false);

        const resetFields = computed(() => props.onReset);

        const { validateAddress } = useAdapter();

        const selectedNet = computed(() => props.selectedNetwork);

        const address = computed({
            get: () => store.getters['tokenOps/receiverAddress'],
            set: (value) => store.dispatch('tokenOps/setReceiverAddress', value),
        });

        const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);
        const selectedDstNetwork = computed(() => store.getters['tokenOps/dstNetwork']);

        const isError = computed(() => {
            if (!address.value || !selectedNet.value || address.value?.length <= 0) {
                emit('error-status', false);
                return false;
            }

            const isAllow = address.value?.length > 0 && validateAddress(address.value, { chainId: selectedNet?.value?.net });

            emit('error-status', !isAllow);

            return !isAllow;
        });

        const addressPlaceholder = computed(() => {
            const target = selectedDstNetwork.value || selectedSrcNetwork.value;

            const { bech32_prefix = null, address_validating = null } = target || {};

            if (bech32_prefix) return `${bech32_prefix}1abc...`;

            if (address_validating) return '0x1234abcd...';

            return 'Address';
        });

        const inputPlaceholder = computed(() => {
            return focused.value ? '' : addressPlaceholder.value;
        });

        const resetAddress = () => {
            if (!resetFields.value) return;

            address.value = '';
            active.value = false;
        };

        const onInput = () => (active.value = false);

        const onBlur = () => {
            emit('setAddress', address.value);
            focused.value = false;
        };

        const selectAddress = (addr) => {
            address.value = addr;
        };

        const displayAddress = computed(() => {
            if (!address.value) return addressPlaceholder.value;

            if (address.value?.length < MAX_LENGTH) return address.value;

            return address.value.slice(0, 12) + '...' + address.value.slice(-6);
        });

        // =================================================================================================================

        if (props.onReset) resetAddress();

        watch(
            () => props.onReset,
            () => resetAddress(),
        );

        return {
            active,
            focused,
            isError,

            address,
            displayAddress,

            placeholder: inputPlaceholder,

            selectAddress,

            onInput,
            onBlur,
        };
    },
};
</script>
