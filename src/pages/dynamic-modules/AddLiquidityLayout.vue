<template>
    <a-form>
        <a-form-item>
            <a-row justify="space-between">
                <SelectRecord
                    :disabled="isDisableSelect"
                    :current="selectedSrcNetwork"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    @click="onSelectNetwork"
                />
                <Slippage />
            </a-row>
        </a-form-item>
        <SelectAmountInput
            :value="selectedSrcToken"
            :selected-network="selectedSrcNetwork"
            :error="!!isBalanceError"
            :label="$t('tokenOperations.asset')"
            :on-reset="resetAmount"
            :amount-value="srcAmount"
            class="select-amount"
            @set-amount="handleOnSetAmount"
            @click-token="onSelectToken"
        />

        <EstimatePreviewInfo
            v-if="isShowEstimateInfo"
            :title="$t('tokenOperations.routeInfo')"
            :is-loading="isQuoteLoading"
            :fee-in-usd="fees[FEE_TYPE.BASE] || 0"
            :main-rate="fees[FEE_TYPE.RATE] || null"
            :error="quoteErrorMessage"
        />

        <UiButton data-qa="confirm" v-bind="opBtnState" :title="$t(opTitle)" :tip="$t(opBtnState.tip)" @click="handleOnConfirm" />
    </a-form>
</template>
<script>
import { ref, watch, computed } from 'vue';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// UI components
import UiButton from '@/components/ui/Button.vue';
import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';

// Input components
import SelectAmountInput from '@/components/ui/Select/SelectAmountInput';

// Slippage Component
import Slippage from '@/components/ui/Slippage.vue';

// Select Components
import SelectRecord from '@/components/ui/Select/SelectRecord';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { FEE_TYPE } from '@/shared/models/enums/fee.enum';

export default {
    name: 'AddLiquidityLayout',
    components: {
        UiButton,
        SelectAmountInput,
        EstimatePreviewInfo,
        Slippage,
        SelectRecord,
    },
    setup() {
        // * Init module operations, and get all necessary data, (methods, states, etc.) for the module
        // * Also, its necessary to sign the transaction (Transaction manger)
        const { handleOnConfirm, moduleInstance, isDisableConfirmButton, isDisableSelect, isTransactionSigning } = useModuleOperations(
            ModuleType.liquidityProvider,
        );

        const {
            // - Main Data
            selectedSrcToken,
            selectedSrcNetwork,

            srcAmount,

            // - Errors
            isBalanceError,

            // - Loading
            isLoading,
            isTokensLoadingForSrc,
            isShowEstimateInfo,
            isQuoteLoading,
            fees,

            quoteErrorMessage,

            // - Title for operation (Confirm, Approve, etc.)
            opTitle,

            // - Handlers
            handleOnSelectToken,
            handleOnSelectNetwork,
            handleOnSetAmount,

            fieldStates,
        } = moduleInstance;

        // =================================================================================================================

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

        const onSelectToken = () => handleOnSelectToken({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });
        const onSelectNetwork = () => handleOnSelectNetwork({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });

        const resetAmounts = async (amount) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) return;

            resetAmount.value = amount === null;
        };

        // =================================================================================================================

        watch(srcAmount, () => resetAmounts(srcAmount.value));

        watch(resetAmount, () => {
            if (resetAmount.value) {
                handleOnSetAmount(null);
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
            resetAmount,

            // handlers
            onSelectNetwork,
            onSelectToken,

            handleOnSetAmount,

            // Handle Confirm (Transaction signing)
            handleOnConfirm,

            fieldStates,

            isQuoteLoading,
            fees,
            quoteErrorMessage,
            FEE_TYPE,
            isShowEstimateInfo,
        };
    },
};
</script>
