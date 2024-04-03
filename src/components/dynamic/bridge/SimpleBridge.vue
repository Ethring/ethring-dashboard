<template>
    <a-form class="simple-bridge">
        <Slippage class="panel-control" />
        <a-form-item>
            <div class="select-network-group">
                <SelectRecord
                    :current="selectedSrcNetwork"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    @click="() => onSelectNetwork(DIRECTIONS.SOURCE)"
                    :disabled="isDisableSelect"
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
            @setAmount="handleOnSetAmount"
            @clickToken="onSelectToken(true, DIRECTIONS.SOURCE)"
        />

        <SelectAmountInput
            v-if="selectedDstNetwork"
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
            @clickToken="onSelectToken(false, DIRECTIONS.DESTINATION)"
        />

        <Checkbox
            v-if="selectedDstToken && selectedDstNetwork"
            id="isSendToAnotherAddress"
            :disabled="isDisableSelect"
            v-model:value="isSendToAnotherAddress"
            :label="`Receive ${selectedDstToken?.symbol} to another wallet`"
            class="mt-8"
        />

        <SelectAddressInput
            v-if="isSendToAnotherAddress && selectedDstNetwork && selectedDstToken"
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

        <Button v-bind="opBtnState" :title="$t(opTitle)" :tip="$t(opTitle)" @click="handleOnConfirm" />
    </a-form>
</template>
<script>
import { ref, watch, computed } from 'vue';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// UI components
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import SwitchDirection from '@/components/ui/SwitchDirection.vue';

// Select components
import SelectRecord from '@/components/ui/Select/SelectRecord';

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
import { ModuleType } from '../../../modules/bridge-dex/enums/ServiceType.enum';
import useInputValidation from '@/shared/form-validations';

export default {
    name: 'SimpleBridge',
    components: {
        Button,
        Checkbox,
        SwitchDirection,

        SelectRecord,

        SelectAmountInput,
        SelectAddressInput,

        EstimatePreviewInfo,

        Slippage,
    },
    setup() {
        const { handleOnConfirm, moduleInstance, isTransactionSigning, isDisableConfirmButton, isDisableSelect } = useModuleOperations(
            ModuleType.bridge
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

            if (allowDataTypes.includes(typeof amount)) {
                return;
            }

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

            if (clearAddress.value) {
                setTimeout(() => (clearAddress.value = false));
            }
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
