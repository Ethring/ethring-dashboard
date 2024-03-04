<template>
    <a-form class="super-swap superswap-panel">
        <div
            class="reload-btn"
            :class="{ active: dstAmount && (!isQuoteLoading || !isTransactionSigning) }"
            @click="() => getEstimateInfo(true)"
        >
            <SyncOutlined />
        </div>

        <a-form-item class="switch-direction-wrap">
            <a-form-item>
                <SwapField
                    :value="srcAmount"
                    :label="$t('tokenOperations.from')"
                    :token="selectedSrcToken"
                    :disabled="isQuoteLoading || isTransactionSigning"
                    @setAmount="onSetAmount"
                >
                    <SelectRecord
                        :placeholder="$t('tokenOperations.selectNetwork')"
                        :current="selectedSrcNetwork"
                        @click="() => onSelectNetwork(DIRECTIONS.SOURCE)"
                        :disabled="isQuoteLoading || isTransactionSigning"
                    />
                    <SelectRecord
                        :placeholder="$t('tokenOperations.selectToken')"
                        :current="selectedSrcToken"
                        @click="() => onSelectToken(true, DIRECTIONS.SOURCE)"
                        :disabled="isQuoteLoading || isTransactionSigning || !selectedSrcNetwork"
                    />
                </SwapField>
            </a-form-item>
            <SwitchDirection
                icon="SwapIcon"
                :disabled="
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
                :label="$t('tokenOperations.to')"
                :value="dstAmount"
                :token="selectedDstToken"
                :isAmountLoading="isQuoteLoading"
                :percentage="differPercentage"
                disabled
                hide-max
            >
                <SelectRecord
                    :disabled="isQuoteLoading || isTransactionSigning"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    :current="selectedDstNetwork"
                    @click="() => onSelectNetwork(DIRECTIONS.DESTINATION)"
                />
                <SelectRecord
                    :disabled="isQuoteLoading || isTransactionSigning || !selectedDstNetwork"
                    :placeholder="$t('tokenOperations.selectToken')"
                    :current="selectedDstToken"
                    @click="() => onSelectToken(false, DIRECTIONS.DESTINATION)"
                />
            </SwapField>
        </a-form-item>

        <Checkbox
            v-if="selectedDstToken && selectedDstNetwork"
            v-model:value="isSendToAnotherAddress"
            :disabled="isQuoteLoading || isTransactionSigning"
            :label="$t('tokenOperations.chooseAddress')"
        />

        <SelectAddressInput
            v-if="isSendToAnotherAddress && selectedDstNetwork && selectedDstToken"
            class="mt-8"
            :selected-network="selectedDstNetwork"
            :on-reset="isSendToAnotherAddress"
            :disabled="isQuoteLoading || isTransactionSigning"
            @error-status="(status) => (isAddressError = status)"
        />

        <EstimatePreviewInfo
            v-if="isShowEstimateInfo || (selectedDstToken && srcAmount)"
            :title="$t('tokenOperations.routeInfo')"
            :is-loading="isQuoteLoading"
            :fee-in-usd="fees[FEE_TYPE.BASE] || 0"
            :main-rate="fees[FEE_TYPE.RATE] || null"
            :services="bestRouteInfo?.routes"
            :is-show-expand="otherRoutesInfo?.length"
            :error="quoteErrorMessage"
            :on-click-expand="toggleRoutesModal"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="isDisableConfirmButton"
            :tip="$t(opTitle)"
            :loading="isQuoteLoading || isTransactionSigning || isSwapLoading"
            class="module-layout-view-btn"
            data-qa="confirm"
            @click="handleOnConfirm"
            size="large"
        />
    </a-form>
</template>
<script>
import { computed, ref, inject, watch, h } from 'vue';
import { useStore } from 'vuex';

import BigNumber from 'bignumber.js';

import SelectRecord from '@/components/ui/Select/SelectRecord';
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';

import Checkbox from '@/components/ui/Checkbox';

import Button from '@/components/ui/Button';
import SwitchDirection from '@/components/ui/SwitchDirection.vue';

import SwapField from './SwapField';

import { formatNumber } from '@/shared/utils/numbers';

import { SyncOutlined } from '@ant-design/icons-vue';

import useModuleOperations from '@/compositions/useModuleOperation';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { FEE_TYPE } from '@/shared/models/enums/fee.enum';
import { ModuleType } from '@/modules/bridge-dex/enums/ServiceType.enum';

export default {
    name: 'SuperSwap',
    components: {
        Button,
        Checkbox,
        SwapField,
        SyncOutlined,

        SelectRecord,
        SelectAddressInput,
        SwitchDirection,
        EstimatePreviewInfo,
    },
    setup() {
        const store = useStore();

        const useAdapter = inject('useAdapter');

        const { moduleInstance, isTransactionSigning, isDisableConfirmButton, handleOnConfirm } = useModuleOperations(ModuleType.superSwap);

        // =================================================================================================================

        const isSwapLoading = ref(false);

        const routeInfo = computed(() => store.getters['bridgeDex/selectedRoute']);
        const bestRouteInfo = computed(() => routeInfo.value?.bestRoute);
        const otherRoutesInfo = computed(() => routeInfo.value?.otherRoutes);

        // * Module values
        const {
            // --------------------------------

            isLoading,
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
            toggleRoutesModal,
        } = moduleInstance;

        //  =================================================================================================================

        const successHash = ref('');

        const differPercentage = computed(() => {
            const { price: srcPrice = 0 } = selectedSrcToken.value || {};
            const { price: dstPrice = 0 } = selectedDstToken.value || {};

            if (!srcPrice || !dstPrice || !srcAmount.value || !dstAmount.value) {
                return 0;
            }

            const fromUsdValue = BigNumber(srcPrice).multipliedBy(srcAmount.value);
            const toUsdValue = BigNumber(dstPrice).multipliedBy(dstAmount.value);

            if (!fromUsdValue || !toUsdValue) {
                return 0;
            }

            return toUsdValue.minus(fromUsdValue).dividedBy(toUsdValue).multipliedBy(100).toFixed(2) || 0;
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

        const onSetAmount = (value) => {
            srcAmount.value = value;

            if (!value) {
                dstAmount.value = 0;
                return (isQuoteLoading.value = false);
            }
        };

        const getEstimateInfo = async (isReload = false) => {
            dstAmount.value = null;
            store.dispatch('bridgeDexAPI/setReloadRoutes', isReload);
        };

        watch(srcAmount, async () => {
            if (!selectedDstToken.value || !srcAmount.value) {
                return (isQuoteLoading.value = false);
            }

            return await getEstimateInfo();
        });

        return {
            isLoading,
            isSwapLoading,

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

            bestRouteInfo,
            otherRoutesInfo,

            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            DIRECTIONS,
            TOKEN_SELECT_TYPES,

            successHash,

            differPercentage,

            onSetAmount,
            isDisableConfirmButton,

            getEstimateInfo,
            toggleRoutesModal,
            formatNumber,

            onSelectNetwork,

            handleOnConfirm,
            onSelectToken,

            FEE_TYPE,
            fees,

            isQuoteLoading,
            quoteErrorMessage,
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
