<template>
    <a-table :columns="columns" :data-source="vaults" class="rewards-table" :loading="isLoading" :pagination="false">
        <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'vault'">
                <a-avatar :src="record.logoURI" />
                <a :href="record.url" target="_blank" class="rewards-table__link">
                    {{ record.name }}
                </a>
            </template>
            <template v-else-if="column.key === 'amount'">
                <Amount type="currency" :value="formatNumber(record.bgtEarned, 3) || '<0.001'" symbol="BGT" :decimals="3" />
            </template>
            <template v-else-if="column.key === 'action'">
                <UiButton v-bind="opBtnState" title="Claim BGT" @click="() => handleOnConfirm(record)" />
            </template>
        </template>
    </a-table>
</template>
<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useModuleOperations from '@/compositions/useModuleOperation';

// UI components
import UiButton from '@/components/ui/Button.vue';
import Amount from '@/components/app/Amount.vue';

import { ModuleType } from '@/shared/models/enums/modules.enum';
import { formatNumber } from '@/shared/utils/numbers';

export default {
    name: 'ClaimBGTRewards',
    components: { UiButton, Amount },
    setup() {
        const store = useStore();
        const { walletAddress } = useAdapter();

        const errorMessage = ref(false);
        const successMessage = ref(false);
        const isLoading = computed(() => store.getters['shortcuts/getIsVaultsLoading']);

        const vaults = computed(() => store.getters['shortcuts/getVaultsInfo'](walletAddress.value));

        const { handleOnConfirm, isTransactionSigning } = useModuleOperations(ModuleType.claim);

        const opBtnState = computed(() => {
            return {
                type: 'primary',
                title: 'tokenOperations.claimTokens',
                size: 'small',
                loading: isTransactionSigning.value,
            };
        });

        const columns = [
            {
                title: 'Vaults',
                key: 'vault',
            },
            {
                title: 'BGT rewards',
                key: 'amount',
            },
            {
                title: 'Incentives',
                key: 'action',
            },
        ];

        return {
            isLoading,
            opBtnState,
            errorMessage,
            successMessage,
            columns,
            vaults,

            handleOnConfirm,
            formatNumber,
        };
    },
};
</script>
