<template>
    <a-form>
        <a-form-item>
            <SwapField
                v-if="selectedSrcToken && selectedSrcNetwork && selectedSrcToken !== null"
                name="srcAmount"
                :value="srcAmount"
                :label="$t('tokenOperations.from')"
                :token="selectedSrcToken"
                :disabled="fieldStates.srcAmount.disabled"
                @set-amount="handleOnSetAmount"
            >
                <SelectRecord
                    v-if="!fieldStates.srcNetwork?.hide"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    :current="selectedSrcNetwork"
                    :disabled="fieldStates.srcNetwork.disabled"
                    @click="() => onSelectNetwork('SOURCE')"
                />

                <SelectRecord
                    v-if="!fieldStates.srcToken?.hide"
                    :placeholder="$t('tokenOperations.selectToken')"
                    :current="selectedSrcToken"
                    :disabled="fieldStates.srcToken.disabled"
                    @click="() => onSelectToken(true, 'SOURCE')"
                />
            </SwapField>
        </a-form-item>

        <EstimatePreviewInfo
            v-if="isShowEstimateInfo"
            :title="$t('tokenOperations.routeInfo')"
            :error="quoteErrorMessage"
            :is-loading="isQuoteLoading"
            :fee-in-usd="fees[FEE_TYPE.BASE] || 0"
            :main-rate="fees[FEE_TYPE.RATE] || null"
        />

        <UiButton data-qa="confirm" v-bind="opBtnState" :title="$t(opBtnState.title)" :tip="$t(opBtnState.tip)" @click="handleOnConfirm" />
    </a-form>
</template>
<script lang="ts">
import { ref, watch, computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// UI components
import UiButton from '@/components/ui/Button.vue';
import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';

// Select components
import SelectRecord from '@/components/ui/Select/SelectRecord.vue';
import SwapField from '@/components/ui/SuperSwap/SwapField.vue';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';

import { FEE_TYPE } from '@/shared/models/enums/fee.enum';

// Types
import OperationsFactory from '@/core/operations/OperationsFactory';

export default defineComponent({
    name: 'PendleSiloLayout',
    components: {
        UiButton,
        SwapField,
        SelectRecord,
        EstimatePreviewInfo,
    },
    setup() {
        const store = useStore();

        const shortcutModalState = computed(() => store.getters['app/modal']('successShortcutModal'));

        const currentShortcutId = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

        const operationsFactory = computed<OperationsFactory>(() =>
            store.getters['shortcuts/getShortcutOpsFactory'](currentShortcutId.value),
        );

        // * Init module operations, and get all necessary data, (methods, states, etc.) for the module
        // * Also, its necessary to sign the transaction (Transaction manger)
        const { handleOnConfirm, moduleInstance, isDisableConfirmButton, isDisableSelect, isTransactionSigning } = useModuleOperations(
            ModuleType.shortcut,
        );

        const {
            // - Main Data
            selectedSrcToken,
            selectedSrcNetwork,

            srcAmount,

            onlyWithBalance,

            // - Errors
            isBalanceError,

            // - Loading
            isLoading,
            isShowEstimateInfo,
            isQuoteLoading,
            isTokensLoadingForSrc,
            fees,

            isNeedInputFocus,

            quoteErrorMessage,

            // - Title for operation (Confirm, Approve, etc.)
            opTitle,

            // - Handlers
            handleOnSelectToken,
            handleOnSelectNetwork,
            handleOnSetAmount,

            fieldStates,
        } = moduleInstance;

        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        // =================================================================================================================

        const clearAddress = ref(false);
        const resetAmount = ref(false);

        // =================================================================================================================

        const opBtnState = computed(() => {
            return {
                class: 'module-layout-view-btn',
                type: isTransactionSigning.value || isLoading.value ? 'primary' : 'success',
                title: opTitle.value,
                tip: opTitle.value,
                loading: isTransactionSigning.value || isLoading.value,
                disabled: isDisableConfirmButton.value,
                size: 'large',
            };
        });

        // =================================================================================================================

        const onSelectNetwork = (direction: keyof typeof DIRECTIONS) =>
            handleOnSelectNetwork({ direction: DIRECTIONS[direction], type: null });

        const onSelectToken = (withBalance = false, direction: keyof typeof DIRECTIONS) => {
            onlyWithBalance.value = withBalance;

            handleOnSelectToken({
                direction: DIRECTIONS[direction],
                type: withBalance ? TOKEN_SELECT_TYPES.FROM : TOKEN_SELECT_TYPES.TO,
            });
        };

        const resetAmounts = async (amount: string | number) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) return;

            resetAmount.value = amount === null;
        };

        // =================================================================================================================

        watch(srcAmount, () => resetAmounts(srcAmount.value));

        watch(resetAmount, () => {
            if (resetAmount.value) {
                handleOnSetAmount('');
                setTimeout(() => (resetAmount.value = false));
            }
        });

        return {
            // Operation title
            opTitle,
            opBtnState,

            // Main Data
            selectedSrcNetwork,
            selectedSrcToken,
            srcAmount,

            isDisableSelect,

            // State for button
            isDisableConfirmButton,

            // Loading
            isLoading,
            isTransactionSigning,
            isTokensLoadingForSrc,

            // Errors
            isBalanceError,

            // Reset
            clearAddress,
            resetAmount,

            // handlers
            onSelectNetwork,
            onSelectToken,
            isShowEstimateInfo,
            handleOnSetAmount,

            // Handle Confirm (Transaction signing)
            handleOnConfirm,

            fieldStates,
            isQuoteLoading,
            fees,
            quoteErrorMessage,
            FEE_TYPE,
            DIRECTIONS,
        };
    },
});
</script>
