<template>
    <a-form class="simple-bridge">
        <a-row class="panel-control">
            <ReloadRoute
                :dst-amount="dstAmount"
                :is-quote-loading="isQuoteLoading"
                :is-transaction-signing="isTransactionSigning"
                :get-estimate-info="getEstimateInfo"
                :route-timer="routeTimer"
            />
            <Slippage />
        </a-row>
        <a-form-item>
            <div class="select-network-group">
                <SelectRecord
                    :current="selectedSrcNetwork"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    :disabled="isDisableSelect"
                    @click="() => onSelectNetwork(DIRECTIONS.SOURCE)"
                />

                <SwitchDirection
                    :disabled="
                        isDirectionSwapped || isQuoteLoading || isTransactionSigning || !isSwapDirectionAvailable || !selectedDstNetwork
                    "
                    @click="() => handleOnSwapDirections(true)"
                />

                <SelectRecord
                    :disabled="isDisableSelect"
                    :current="selectedDstNetwork"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    class="select-group-to"
                    @click="() => onSelectNetwork(DIRECTIONS.DESTINATION)"
                />
            </div>
        </a-form-item>

        <SelectAmountInput
            :value="selectedSrcToken"
            :error="!!isBalanceError"
            :on-reset="resetSrcAmount"
            :disabled-select="isDisableSelect"
            :disabled="isDisableSelect || !selectedSrcToken"
            :label="$t('tokenOperations.transferFrom')"
            :is-update="isSwapDirectionAvailable"
            :amount-value="srcAmount"
            class="mt-8"
            @set-amount="handleOnSetAmount"
            @click-token="onSelectToken(true, DIRECTIONS.SOURCE)"
        />

        <SelectAmountInput
            v-if="selectedDstNetwork && selectedDstNetwork !== null"
            hide-max
            disabled
            :disabled-select="isDisableSelect"
            :value="selectedDstToken"
            :is-amount-loading="isQuoteLoading"
            :is-update="isSwapDirectionAvailable"
            :label="$t('tokenOperations.transferTo')"
            :disabled-value="dstAmount"
            :on-reset="resetDstAmount"
            :amount-value="dstAmount"
            class="mt-8"
            @click-token="onSelectToken(false, DIRECTIONS.DESTINATION)"
        />

        <Checkbox
            v-if="selectedDstToken && selectedDstNetwork && selectedDstNetwork !== null"
            id="isSendToAnotherAddress"
            v-model:value="isSendToAnotherAddress"
            :disabled="isDisableSelect"
            :label="`Receive ${selectedDstToken?.symbol} to another wallet`"
            class="mt-8"
        />

        <SelectAddressInput
            v-if="isSendToAnotherAddress && selectedDstNetwork && selectedDstToken && selectedDstNetwork !== null"
            class="mt-8"
            :selected-network="selectedDstNetwork"
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
            :error="quoteErrorMessage"
            :is-show-expand="otherRoutes?.length > 0"
            :on-click-expand="toggleRoutesModal"
            :amount="dstAmount"
        />

        <UiButton v-bind="opBtnState" :title="$t(opTitle)" :tip="$t(opTitle)" @click="handleOnConfirm" />
    </a-form>
</template>
<script>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// UI components
import Checkbox from '@/components/ui/Checkbox';
import UiButton from '@/components/ui/Button.vue';
import SwitchDirection from '@/components/ui/SwitchDirection.vue';

// Select components
import SelectRecord from '@/components/ui/Select/SelectRecord';
import ReloadRoute from '@/components/ui/ReloadRoute.vue';

// Input components
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
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
    name: 'SimpleBridge',
    components: {
        UiButton,
        Checkbox,
        SwitchDirection,

        SelectRecord,

        SelectAmountInput,
        SelectAddressInput,

        EstimatePreviewInfo,

        Slippage,
        ReloadRoute,
    },
    setup() {
        const store = useStore();

        const { handleOnConfirm, moduleInstance, isTransactionSigning, isDisableConfirmButton, isDisableSelect } = useModuleOperations(
            ModuleType.bridge,
        );

        // * Module values
        const {
            // --------------------------------

            isLoading,
            isEstimating,
            isQuoteLoading,
            isBalanceError,
            isShowEstimateInfo,
            isAllowanceLoading,
            isDirectionSwapped,
            isSwapDirectionAvailable,
            isTokensLoadingForSrc,
            isTokensLoadingForDst,

            // --------------------------------

            fees,
            quoteRoutes,
            otherRoutes,
            selectedRoute,
            quoteErrorMessage,
            routeTimer,

            // --------------------------------

            selectedService,
            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,
            selectedDstNetwork,

            // --------------------------------

            isAddressError,
            isSendToAnotherAddress,
            receiverAddress,

            // --------------------------------

            onlyWithBalance,

            // --------------------------------

            srcAmount,
            dstAmount,

            // --------------------------------

            opTitle,

            // --------------------------------

            handleOnSwapDirections,
            handleOnSelectToken,
            handleOnSelectNetwork,
            handleOnSetAmount,
            toggleRoutesModal,
            getEstimateInfo,
        } = moduleInstance;

        const { isSrcAmountSet, isDstTokenSet } = useInputValidation();
        // =================================================================================================================

        const clearAddress = ref(false);
        const resetSrcAmount = ref(false);
        const resetDstAmount = ref(false);

        // =================================================================================================================
        const opBtnState = computed(() => {
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

        const onSelectNetwork = (direction) => {
            return handleOnSelectNetwork({
                direction: DIRECTIONS[direction],
            });
        };

        // =================================================================================================================

        const onSelectToken = (withBalance = false, direction = DIRECTIONS.SOURCE) => {
            onlyWithBalance.value = withBalance;

            handleOnSelectToken({
                direction: DIRECTIONS[direction],
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

            clearAddress.value = receiverAddress.value === null;

            if (clearAddress.value) setTimeout(() => (clearAddress.value = false));
        };

        // =================================================================================================================

        watch(srcAmount, () => resetAmounts(DIRECTIONS.SOURCE, srcAmount.value));

        watch(dstAmount, () => resetAmounts(DIRECTIONS.DESTINATION, dstAmount.value));

        return {
            // Loading
            isLoading,
            isEstimating,

            isTokensLoadingForSrc,
            isTokensLoadingForDst,

            resetSrcAmount,
            resetDstAmount,

            isSendToAnotherAddress,
            isDirectionSwapped,
            isSwapDirectionAvailable,

            DIRECTIONS,
            opTitle,
            opBtnState,

            srcAmount,
            dstAmount,

            isAddressError,
            isBalanceError,

            receiverAddress,
            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            isShowEstimateInfo,
            isDisableSelect,

            // Information for accordion
            clearAddress,
            selectedService,

            // Handlers
            onSelectToken,
            onSelectNetwork,
            handleOnSetAmount,

            handleOnConfirm,
            handleOnSwapDirections,
            toggleRoutesModal,

            getEstimateInfo,
            routeTimer,

            fees,
            selectedRoute,
            quoteRoutes,
            otherRoutes,
            quoteErrorMessage,
            FEE_TYPE,
            isTransactionSigning,
            isQuoteLoading,
            isDisableConfirmButton,

            isSrcAmountSet,
            isDstTokenSet,
        };
    },
};
</script>
@/shared/models/enums/modules.enum
