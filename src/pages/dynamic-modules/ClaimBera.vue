<!-- eslint-disable vue/no-v-html -->
<template>
    <a-alert type="info" show-icon>
        <template #message>
            <span v-html="$t('beraAlertMessage')"></span>
        </template>
    </a-alert>
    <SelectAddressInput label="Wallet address" class="mt-8" @error-status="(status) => (isAddressError = status)" />
    <a-alert v-if="errorMessage" class="mt-8" :message="errorMessage" type="error" show-icon />
    <a-alert v-if="successMessage" class="mt-8" :message="successMessage" type="success" show-icon />
    <UiButton v-bind="opBtnState" :title="$t(opBtnState.title)" @click="handleOnConfirm" />
</template>
<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

// UI components
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import UiButton from '@/components/ui/Button.vue';

import BerachainApi from '@/modules/berachain/api/';
import { validateEthAddress } from '@/core/wallet-adapter/utils/validations';

export default {
    name: 'ClaimBera',
    components: { SelectAddressInput, UiButton },
    setup() {
        const store = useStore();
        const isAddressError = ref(false);
        const errorMessage = ref(false);
        const successMessage = ref(false);
        const loading = ref(false);

        const address = computed({
            get: () => store.getters['tokenOps/receiverAddress'],
            set: (value) => store.dispatch('tokenOps/setReceiverAddress', value),
        });

        const opBtnState = computed(() => {
            return {
                class: 'module-layout-view-btn',
                type: 'primary',
                title: 'tokenOperations.claimTokens',
                size: 'large',
                loading: loading.value,
                disabled: !address.value,
            };
        });

        const handleOnConfirm = async () => {
            try {
                loading.value = true;
                const isValid = validateEthAddress(address.value, '^0x([a-fA-F0-9]{40})$');

                if (!isValid) return (errorMessage.value = 'Invalid ETH wallet address');

                errorMessage.value = false;

                const berachainService = new BerachainApi();
                await berachainService.dripTokens(address.value);
                address.value = '';

                successMessage.value = 'You’ll receive the testnet tokens in your wallet thoon.';
            } catch (error) {
                errorMessage.value = error.message;
            }
            loading.value = false;
        };

        return {
            isAddressError,
            opBtnState,
            errorMessage,
            successMessage,

            handleOnConfirm,
        };
    },
};
</script>
