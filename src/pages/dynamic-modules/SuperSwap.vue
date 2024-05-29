<template>
    <a-form class="super-swap superswap-panel">
        <a-row v-if="!isHideActions && !fieldStates.isReload?.hide" class="panel-control">
            <ReloadRoute
                :dst-amount="dstAmount"
                :is-quote-loading="isQuoteLoading"
                :is-transaction-signing="isTransactionSigning"
                :get-estimate-info="getEstimateInfo"
            />
            <Slippage />
        </a-row>
        <a-form-item class="switch-direction-wrap">
            <a-form-item>
                <SwapField
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
                        @click="() => onSelectNetwork(DIRECTIONS.SOURCE)"
                    />
                    <SelectRecord
                        v-if="!fieldStates.srcToken?.hide"
                        :placeholder="$t('tokenOperations.selectToken')"
                        :current="selectedSrcToken"
                        :disabled="fieldStates.srcToken.disabled"
                        @click="() => onSelectToken(true, DIRECTIONS.SOURCE)"
                    />
                </SwapField>
            </a-form-item>
            <SwitchDirection
                v-if="!fieldStates.switchDirection?.hide"
                icon="SwapIcon"
                :disabled="
                    fieldStates.switchDirection?.disabled ||
                    isDirectionSwapped ||
                    isQuoteLoading ||
                    isTransactionSigning ||
                    !isSwapDirectionAvailable ||
                    !selectedDstNetwork ||
                    !selectedDstToken
                "
                class="switch-direction"
                @click="() => handleOnSwapDirections(true)"
            />

            <SwapField
                name="dstAmount"
                :label="$t('tokenOperations.to')"
                :value="dstAmount"
                :token="selectedDstToken"
                :is-amount-loading="isQuoteLoading"
                :percentage="differPercentage"
                :disabled="fieldStates.dstAmount.disabled"
                hide-max
            >
                <SelectRecord
                    v-if="!fieldStates.dstNetwork?.hide"
                    :disabled="fieldStates.dstNetwork.disabled"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    :current="selectedDstNetwork"
                    @click="() => onSelectNetwork(DIRECTIONS.DESTINATION)"
                />
                <SelectRecord
                    v-if="!fieldStates.dstToken?.hide"
                    :disabled="fieldStates.dstToken.disabled"
                    :placeholder="$t('tokenOperations.selectToken')"
                    :current="selectedDstToken"
                    @click="() => onSelectToken(false, DIRECTIONS.DESTINATION)"
                />
            </SwapField>
        </a-form-item>

        <Checkbox
            v-if="!fieldStates.isSendToAnotherAddress?.hide && selectedDstToken && selectedDstNetwork && !isSameNetwork"
            v-model:value="isSendToAnotherAddress"
            :disabled="isDisableSelect"
            :label="$t('tokenOperations.chooseAddress')"
        />

        <SelectAddressInput
            v-if="!fieldStates.receiverAddress?.hide && isSendToAnotherAddress && selectedDstNetwork && selectedDstToken"
            class="mt-8"
            :selected-network="selectedDstNetwork"
            :on-reset="isSendToAnotherAddress"
            :disabled="isDisableSelect"
            @error-status="(status) => (isAddressError = status)"
        />

        <EstimatePreviewInfo
            v-if="isShowEstimateInfo"
            :is-loading="isQuoteLoading"
            :fee-in-usd="fees[FEE_TYPE.BASE] || 0"
            :main-rate="fees[FEE_TYPE.RATE] || null"
            :services="[selectedRoute]"
            :is-show-expand="otherRoutes?.length > 0"
            :error="quoteErrorMessage"
            :on-click-expand="toggleRoutesModal"
            :amount="dstAmount"
        />

        <UiButton
            :title="$t(opTitle)"
            :disabled="isDisableConfirmButton"
            :tip="$t(opTitle)"
            :loading="isAllowanceLoading || isTransactionSigning || isSwapLoading"
            class="module-layout-view-btn"
            data-qa="confirm"
            size="large"
            @click="handleOnConfirm"
        />
    </a-form>
</template>
<script>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// Components
import SelectRecord from '@/components/ui/Select/SelectRecord';
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';
import Checkbox from '@/components/ui/Checkbox';
import UiButton from '@/components/ui/Button.vue';
import SwitchDirection from '@/components/ui/SwitchDirection.vue';
import Slippage from '@/components/ui/Slippage.vue';
import ReloadRoute from '@/components/ui/ReloadRoute.vue';
import SwapField from '@/components/ui/SuperSwap/SwapField.vue';

// Icons

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { FEE_TYPE } from '@/shared/models/enums/fee.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import useInputValidation from '@/shared/form-validations';
import { differenceInPercentage } from '@/shared/calculations/percentage-diff';
import { formatNumber } from '@/shared/utils/numbers';

export default {
    name: 'SuperSwap',
    components: {
        UiButton,
        Checkbox,
        SwapField,
        ReloadRoute,

        SelectRecord,
        SelectAddressInput,
        SwitchDirection,
        EstimatePreviewInfo,
        Slippage,
    },
    props: {
        isHideActions: {
            type: Boolean,
            default: false,
        },
    },
    setup() {
        const store = useStore();

        const { moduleInstance, isTransactionSigning, isDisableConfirmButton, isDisableSelect, handleOnConfirm } = useModuleOperations(
            ModuleType.superSwap,
        );

        // =================================================================================================================

        const isSwapLoading = ref(false);

        const servicesHash = computed(() => store.getters['bridgeDexAPI/getAllServicesHash']);

        // * Module values
        const {
            // --------------------------------

            isLoading,
            isQuoteLoading,
            isShowEstimateInfo,
            isAllowanceLoading,
            isDirectionSwapped,
            isSwapDirectionAvailable,
            isTokensLoadingForSrc,
            isTokensLoadingForDst,

            // --------------------------------

            fees,
            quoteRoutes,
            selectedRoute,
            otherRoutes,
            quoteErrorMessage,

            // --------------------------------
            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,
            selectedDstNetwork,

            // --------------------------------

            isAddressError,
            isSendToAnotherAddress,

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
            toggleRoutesModal,
            handleOnSetAmount,
            getEstimateInfo,
            fieldStates,
        } = moduleInstance;

        const { isSrcAmountSet, isDstTokenSet, isSameNetwork } = useInputValidation();

        //  =================================================================================================================

        const successHash = ref('');

        const differPercentage = computed(() => {
            return differenceInPercentage({
                srcNetwork: selectedSrcNetwork.value,
                dstNetwork: selectedDstNetwork.value,
                srcToken: selectedSrcToken.value,
                dstToken: selectedDstToken.value,
                srcAmount: srcAmount.value,
                dstAmount: dstAmount.value,
            });
        });

        // =================================================================================================================

        const onSelectNetwork = (direction) => handleOnSelectNetwork({ direction: DIRECTIONS[direction] });

        const onSelectToken = (withBalance = false, direction = DIRECTIONS.SOURCE) => {
            onlyWithBalance.value = withBalance;

            handleOnSelectToken({
                direction: DIRECTIONS[direction],
                type: withBalance ? TOKEN_SELECT_TYPES.FROM : TOKEN_SELECT_TYPES.TO,
            });
        };

        // =================================================================================================================

        const isDisableCheckbox = computed(() => {
            if (!selectedRoute.value) return isDisableSelect.value;

            if (servicesHash.value[selectedRoute.value?.serviceId])
                return !servicesHash.value[selectedRoute.value?.serviceId].features_support?.receiver;

            return isDisableSelect.value;
        });

        // =================================================================================================================

        watch(srcAmount, async () => {
            if (!selectedDstToken.value || !srcAmount.value) return (isQuoteLoading.value = false);

            return await getEstimateInfo();
        });

        watch(isDisableSelect, () => {
            for (const field of ['srcNetwork', 'dstNetwork', 'srcToken', 'dstToken', 'srcAmount', 'dstAmount'])
                store.dispatch('moduleStates/setDisabledField', {
                    module: ModuleType.superSwap,
                    field,
                    attr: 'disabled',
                    value: isDisableSelect.value,
                });
        });

        watch(selectedRoute, () => {
            if (servicesHash.value[selectedRoute.value?.serviceId] && isSendToAnotherAddress.value)
                isSendToAnotherAddress.value = servicesHash.value[selectedRoute.value?.serviceId].features_support?.receiver;
        });

        return {
            isLoading,
            isSwapLoading,

            isSameNetwork,

            isSwapDirectionAvailable,
            isDirectionSwapped,
            handleOnSwapDirections,

            isTokensLoadingForSrc,
            isTokensLoadingForDst,

            isTransactionSigning,

            isSendToAnotherAddress,

            isQuoteLoading,
            isShowEstimateInfo,

            dstAmount,
            srcAmount,

            opTitle,

            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            DIRECTIONS,
            TOKEN_SELECT_TYPES,

            successHash,

            differPercentage,

            isDisableConfirmButton,
            isDisableCheckbox,

            getEstimateInfo,
            toggleRoutesModal,
            formatNumber,

            onSelectNetwork,

            handleOnConfirm,
            onSelectToken,

            FEE_TYPE,
            fees,

            quoteRoutes,
            selectedRoute,
            otherRoutes,
            isAddressError,
            handleOnSetAmount,

            isDisableSelect,
            isAllowanceLoading,
            quoteErrorMessage,

            isSrcAmountSet,
            isDstTokenSet,

            fieldStates,
        };
    },
};
</script>
<style lang="scss">
.superswap-panel {
    .route-info {
        @include pageFlexRow;

        * {
            margin: 0;
        }

        p {
            color: var(--#{$prefix}accordion-title);
            font-size: var(--#{$prefix}small-lg-fs);
            line-height: var(--#{$prefix}default-fs);
            font-weight: 600;
        }

        .error-text {
            margin-left: 8px;
            font-weight: 500;
            color: var(--#{$prefix}warning);
            opacity: 0.8;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            max-width: 400px;
        }

        .fee {
            color: var(--#{$prefix}warning);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 600;
        }

        .symbol {
            font-weight: 300;
            color: var(--#{$prefix}base-text);
        }

        svg {
            margin: 0 4px 0 12px;
        }

        svg path {
            fill: var(--#{$prefix}base-text);
        }

        h4 {
            margin-left: 16px;
            font-weight: 400;
            color: var(--#{$prefix}base-text);

            span {
                color: var(--#{$prefix}base-text);
                font-weight: 600;
            }
        }
    }

    .routes {
        @include pageFlexRow;
        padding: 12px 0;
        width: 96%;

        border-top: 2px solid var(--#{$prefix}collapse-border-color);

        div {
            @include pageFlexRow;
        }

        img {
            width: 22px;
            height: 22px;
            margin-right: 8px;
            border-radius: 50%;
        }

        .name {
            font-size: var(--#{$prefix}small-lg-fs);
            color: var(--#{$prefix}base-text);
            font-weight: 600;
            margin: 0 10px 0 2px;
        }

        svg.arrow {
            fill: var(--#{$prefix}select-icon-color);
            transform: rotate(-90deg) scale(0.7);
            @include animateEasy;
        }

        svg.expand {
            cursor: pointer;
            fill: var(--#{$prefix}base-text);
            margin-left: 4px;
            @include animateEasy;
        }
    }

    .accordion__content {
        img {
            width: 16px;
            height: 16px;
        }
    }

    .accordion-item {
        position: relative;

        &__value {
            .route {
                @include pageFlexRow;
                margin-left: 6px;

                .name {
                    margin-left: 6px;
                }
            }
        }

        &__row {
            display: flex;
        }
    }

    &__btn {
        height: 64px;
        width: 100%;
    }
}
</style>
