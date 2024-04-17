<template>
    <a-form-item
        class="select-panel"
        :class="{ active: active, focused, error: isError, disabled }"
        @click="active = true"
        v-click-away="(active = false)"
    >
        <div class="input-label">{{ $t(label) }}</div>

        <a-input-group compact class="input-group">
            <div v-if="selectedNetwork">
                <TokenIcon :token="selectedNetwork" class="network" width="32" height="32" />
            </div>
            <a-input
                allow-clear
                v-model:value="contractAddress"
                class="base-input"
                data-qa="input-address"
                :disabled="disabled"
                :bordered="false"
                :placeholder="placeholder"
                v-debounce:1s="onInput"
                @focus="focused = true"
                @blur="onBlur"
            >
                <template #clearIcon>
                    <ClearIcon class="input-clear-icon" />
                </template>
            </a-input>
        </a-input-group>

        <div class="bottom">
            <a-tooltip v-if="contractAddress" placement="topLeft">
                <template #title>{{ contractAddress }}</template>
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
    name: 'SelectContractAddressInput',
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
            required: false,
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
    components: {
        ClearIcon,
        TokenIcon,
    },
    setup(props, { emit }) {
        const MAX_LENGTH = 40;

        const store = useStore();
        const useAdapter = inject('useAdapter');

        const active = ref(false);
        const focused = ref(false);

        const resetFields = computed(() => props.onReset);

        const { validateAddress } = useAdapter();

        const contractAddress = computed({
            get: () => store.getters['tokenOps/contractAddress'],
            set: (value) => store.dispatch('tokenOps/contractAddress', value),
        });

        const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);

        const isError = computed(() => {
            if (!contractAddress.value || !selectedSrcNetwork.value || contractAddress.value?.length <= 0) {
                emit('error-status', false);
                return false;
            }

            const isAllow =
                contractAddress.value?.length > 0 && validateAddress(contractAddress.value, { chainId: selectedSrcNetwork?.value?.net });

            emit('error-status', !isAllow);

            return !isAllow;
        });

        const addressPlaceholder = computed(() => {
            const target = selectedSrcNetwork.value;

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
            if (!resetFields.value) {
                return;
            }

            contractAddress.value = '';
            active.value = false;
        };

        const onInput = () => (active.value = false);

        const onBlur = () => {
            emit('setAddress', contractAddress.value);
            focused.value = false;
        };

        const selectAddress = (addr) => {
            contractAddress.value = addr;
        };

        const displayAddress = computed(() => {
            if (!contractAddress.value) {
                return addressPlaceholder.value;
            }

            if (contractAddress.value?.length < MAX_LENGTH) {
                return contractAddress.value;
            }

            return contractAddress.value.slice(0, 12) + '...' + contractAddress.value.slice(-6);
        });

        // =================================================================================================================

        if (props.onReset) {
            resetAddress();
        }

        watch(
            () => props.onReset,
            () => resetAddress(),
        );

        return {
            active,
            focused,
            isError,

            contractAddress,
            displayAddress,

            placeholder: addressPlaceholder,

            selectAddress,

            onInput,
            onBlur,
        };
    },
};
</script>
