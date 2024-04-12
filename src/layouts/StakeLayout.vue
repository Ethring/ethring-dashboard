<template>
    <a-form>
        <SelectAddressInput
            label="tokenOperations.validator"
            :on-reset="clearAddress"
            :selected-network="selectedSrcNetwork"
            :disabled="fieldStates.receiverAddress.disabled"
            @error-status="(status) => (isAddressError = status)"
        />

        <SelectAmountInput
            :value="selectedSrcToken"
            :selected-network="selectedSrcNetwork"
            :error="!!isBalanceError"
            :label="$t('tokenOperations.asset')"
            :on-reset="resetAmount"
            :amount-value="srcAmount"
            :disabled-select="fieldStates.srcToken.disabled"
            :disabled="fieldStates.srcAmount.disabled"
            class="select-amount"
            @setAmount="handleOnSetAmount"
            @clickToken="onSelectToken"
        />

        <a-form-item v-if="isMemoAllowed">
            <MemoInput :disabled="fieldStates.memo.disabled" class="mt-8" />
        </a-form-item>

        <EstimatePreviewInfo
            v-if="isShowEstimateInfo"
            :title="$t('tokenOperations.routeInfo')"
            :is-loading="isQuoteLoading"
            :fee-in-usd="fees[FEE_TYPE.BASE] || 0"
            :main-rate="fees[FEE_TYPE.RATE] || null"
            :error="quoteErrorMessage"
        />

        <Button data-qa="confirm" v-bind="opBtnState" :title="$t(opTitle)" :tip="$t(opBtnState.tip)" @click="handleOnConfirm" />
    </a-form>
</template>
<script>
import { ref, watch, computed } from 'vue';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// UI components
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';

// Select components
import SelectRecord from '@/components/ui/Select/SelectRecord';

// Input components
import MemoInput from '@/components/ui/MemoInput.vue';
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import SelectAmountInput from '@/components/ui/Select/SelectAmountInput';

// Icons
import InfoIcon from '@/assets/icons/platform-icons/info.svg';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { FEE_TYPE } from '@/shared/models/enums/fee.enum';

export default {
    name: 'StakeLayout',
    components: {
        Button,
        Checkbox,
        SelectRecord,
        MemoInput,
        SelectAddressInput,
        SelectAmountInput,
        InfoIcon,
        EstimatePreviewInfo,
    },
    setup() {
        // * Init module operations, and get all necessary data, (methods, states, etc.) for the module
        // * Also, its necessary to sign the transaction (Transaction manger)
        const { handleOnConfirm, moduleInstance, isDisableConfirmButton, isDisableSelect, isTransactionSigning } = useModuleOperations(
            ModuleType.stake,
        );

        const {
            // - Main Data
            selectedSrcToken,
            selectedSrcNetwork,

            receiverAddress,
            srcAmount,
            memo,
            // - Memo (optional, Available only for COSMOS ecosystem)
            isMemoAllowed,
            isSendWithMemo,

            // - Errors
            isAddressError,
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

        const onSelectToken = () => handleOnSelectToken({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });
        const onSelectNetwork = () => handleOnSelectNetwork({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });

        const resetAmounts = async (amount) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) {
                return;
            }

            resetAmount.value = amount === null;

            clearAddress.value = receiverAddress.value === null;
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
            receiverAddress,
            srcAmount,

            // Loadings
            isMemoAllowed,

            isDisableSelect,

            // State for button
            isDisableConfirmButton,

            // Loading
            isLoading,
            isTransactionSigning,
            isTokensLoadingForSrc,

            // Errors
            isAddressError,
            isBalanceError,

            // Reset
            clearAddress,
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
@/shared/models/enums/modules.enum
