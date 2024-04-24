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

        <div class="switch-direction-wrap">
            <SelectAmountInput
                :value="selectedSrcToken"
                :disabled="isDisableSelect"
                :disabled-select="isDisableSelect"
                :selected-network="selectedSrcNetwork"
                :error="!!isBalanceError"
                :on-reset="resetSrcAmount"
                :is-update="isSwapDirectionAvailable"
                :label="$t('tokenOperations.pay')"
                :amount-value="srcAmount"
                @click-token="onSelectToken(true)"
                @set-amount="handleOnSetAmount"
            />

            <SwitchDirection
                class="swap-module"
                :disabled="isQuoteLoading || isDirectionSwapped || isTransactionSigning || !selectedDstToken || !isSwapDirectionAvailable"
                :on-click-switch="() => handleOnSwapDirections()"
            />

            <SelectAmountInput
                disabled
                hide-max
                :disabled-select="isDisableSelect"
                :is-amount-loading="isQuoteLoading"
                :value="selectedDstToken"
                :on-reset="resetDstAmount"
                :is-update="isSwapDirectionAvailable"
                :label="$t('tokenOperations.receive')"
                :disabled-value="dstAmount"
                :amount-value="dstAmount"
                @click-token="onSelectToken(false)"
            />
        </div>

        <Checkbox
            v-model:value="isSendToAnotherAddress"
            class="mt-8"
            :disabled="isDisableCheckbox"
            :label="$t('tokenOperations.chooseAddress')"
        />

        <SelectAddressInput
            v-if="isSendToAnotherAddress"
            class="mt-8"
            :selected-network="selectedSrcNetwork"
            :on-reset="isSendToAnotherAddress"
            :disabled="isDisableSelect"
            @error-status="(status) => (isAddressError = status)"
        />

        <EstimatePreviewInfo
            v-if="isShowEstimateInfo"
            :is-loading="isQuoteLoading"
            :services="[selectedRoute]"
            :fee-in-usd="fees[FEE_TYPE.BASE] || 0"
            :main-rate="fees[FEE_TYPE.RATE] || null"
            :is-show-expand="otherRoutes?.length > 0"
            :error="quoteErrorMessage"
            :on-click-expand="toggleRoutesModal"
            :amount="dstAmount"
        />

        <UiButton data-qa="confirm" v-bind="btnState" :title="$t(btnState.title)" :tip="$t(btnState.tip)" @click="handleOnConfirm" />
    </a-form>
</template>
<script>
import { ref, watch, inject, computed, onMounted } from 'vue';

import { useStore } from 'vuex';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// UI Components
import UiButton from '@/components/ui/Button.vue';
import SwitchDirection from '@/components/ui/SwitchDirection.vue';
import Checkbox from '@/components/ui/Checkbox';
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';

// Select Components
import SelectRecord from '@/components/ui/Select/SelectRecord';

// Input Components
import SelectAmountInput from '@/components/ui/Select/SelectAmountInput';

// Fee Component
import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';

// Slippage Component
import Slippage from '@/components/ui/Slippage.vue';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { FEE_TYPE } from '@/shared/models/enums/fee.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import useInputValidation from '@/shared/form-validations';

export default {
    name: 'SimpleSwap',

    components: {
        UiButton,
        SwitchDirection,
        SelectRecord,
        SelectAmountInput,
        EstimatePreviewInfo,
        SelectAddressInput,
        Checkbox,
        Slippage,
    },

    setup() {
        const store = useStore();

        const useAdapter = inject('useAdapter');

        const { walletAccount } = useAdapter();

        const servicesHash = computed(() => store.getters['bridgeDexAPI/getAllServicesHash']);

        // =================================================================================================================
        // * Module Operations composition
        // =================================================================================================================

        const { handleOnConfirm, moduleInstance, isTransactionSigning, isDisableSelect, isDisableConfirmButton } = useModuleOperations(
            ModuleType.swap,
        );

        // =================================================================================================================
        // * Module values
        // =================================================================================================================

        const {
            // - Main Data
            selectedSrcNetwork,
            selectedSrcToken,
            selectedDstToken,
            srcAmount,
            dstAmount,

            // - Loadings
            isLoading,
            isEstimating,
            isQuoteLoading,
            isAllowanceLoading,

            // - Swap direction
            isSwapDirectionAvailable,
            isDirectionSwapped,

            // - Fee Info
            fees,
            isShowEstimateInfo,

            // - Errors
            isBalanceError,
            quoteErrorMessage,

            // - Current Selected service route and other routes
            selectedRoute,
            quoteRoutes,
            otherRoutes,

            // - other flags
            onlyWithBalance,

            isAddressError,
            isSendToAnotherAddress,

            // Operation title
            opTitle,

            // - Handlers
            toggleRoutesModal,
            handleOnSelectToken,
            handleOnSelectNetwork,
            handleOnSwapDirections,
            handleOnSetAmount,
        } = moduleInstance;

        const { isDstTokenSet, isSrcAmountSet } = useInputValidation();

        // =================================================================================================================

        const resetSrcAmount = ref(false);
        const resetDstAmount = ref(false);

        // =================================================================================================================

        const btnState = computed(() => {
            return {
                class: 'module-layout-view-btn',
                type: isTransactionSigning.value || isLoading.value ? 'primary' : 'success',
                title: opTitle.value,
                tip: isAllowanceLoading.value ? '' : opTitle.value,
                loading: isTransactionSigning.value || isAllowanceLoading.value || isLoading.value,
                disabled: isDisableConfirmButton.value,
                size: 'large',
            };
        });

        // =================================================================================================================

        const isDisableCheckbox = computed(() => {
            if (!selectedRoute.value) return isDisableSelect.value;

            if (servicesHash.value[selectedRoute.value?.serviceId]) {
                if (isSendToAnotherAddress.value)
                    isSendToAnotherAddress.value = servicesHash.value[selectedRoute.value?.serviceId].features_support?.receiver;

                return !servicesHash.value[selectedRoute.value?.serviceId].features_support?.receiver;
            }

            return isDisableSelect.value;
        });

        // =================================================================================================================

        const onSelectNetwork = () => {
            handleOnSelectNetwork({
                direction: DIRECTIONS.SOURCE,
            });
        };

        const onSelectToken = (withBalance = true) => {
            onlyWithBalance.value = withBalance;

            handleOnSelectToken({
                direction: DIRECTIONS.SOURCE,
                type: withBalance ? TOKEN_SELECT_TYPES.FROM : TOKEN_SELECT_TYPES.TO,
            });
        };

        const resetAmounts = async (type = DIRECTIONS.SOURCE, amount) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) return;

            const direction = {
                [DIRECTIONS.SOURCE]: resetSrcAmount,
                [DIRECTIONS.DESTINATION]: resetDstAmount,
            };

            const isEmpty = amount === null;

            if (direction[type] && isEmpty) {
                direction[type].value = false;
                direction[type].value = isEmpty;
                setTimeout(() => (direction[type].value = false));
            }
        };

        watch(srcAmount, () => resetAmounts(DIRECTIONS.SOURCE, srcAmount.value));

        watch(dstAmount, () => resetAmounts(DIRECTIONS.DESTINATION, dstAmount.value));

        watch(walletAccount, () => {
            isEstimating.value = false;
            isLoading.value = false;
        });

        // =================================================================================================================

        onMounted(() => store.dispatch('txManager/setCurrentRequestID', null));

        return {
            // Main Data
            selectedSrcNetwork,
            selectedSrcToken,
            selectedDstToken,
            srcAmount,
            dstAmount,

            // Loadings
            isLoading,
            isEstimating,
            isTransactionSigning,

            // Operation title
            opTitle,
            btnState,

            resetSrcAmount,
            resetDstAmount,

            // Flags
            isBalanceError,
            isShowEstimateInfo,
            isSwapDirectionAvailable,
            isDirectionSwapped,
            isDisableSelect,
            isDisableCheckbox,

            // Handlers
            handleOnSwapDirections,
            onSelectToken,
            onSelectNetwork,
            handleOnSetAmount,
            toggleRoutesModal,

            // * Transaction Manager
            isDisableConfirmButton,
            handleOnConfirm,

            // - BridgeDex
            fees,
            // - BridgeDex Loadings
            isQuoteLoading,
            isAllowanceLoading,

            isSendToAnotherAddress,
            isAddressError,

            // - BridgeDex Current Selected service route and other routes
            selectedRoute,
            quoteRoutes,
            otherRoutes,

            // - BridgeDex other flags
            FEE_TYPE,

            // - BridgeDex Errors
            quoteErrorMessage,

            isSrcAmountSet,
            isDstTokenSet,
        };
    },
};
</script>
@/shared/models/enums/modules.enum
