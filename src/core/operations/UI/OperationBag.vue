<template>
    <a-drawer
        v-model:open="isOpen"
        root-class-name="operation-bag"
        :title="operationBagTitle"
        placement="right"
        :width="480"
        :closable="false"
    >
        <template #extra>
            <div class="operation-bag__actions">
                <div
                    class="operation-bag__radio operation-bag__radio--deposit"
                    :class="{
                        'operation-bag__radio--active': activeRadio === 'deposit',
                    }"
                    @click="activeRadio = 'deposit'"
                >
                    <DepositIcon />
                    <span>
                        {{ depositOperationsCount }}
                    </span>
                </div>
                <div
                    class="operation-bag__radio operation-bag__radio--withdraw"
                    :class="{
                        'operation-bag__radio--active': activeRadio === 'withdraw',
                    }"
                    @click="activeRadio = 'withdraw'"
                >
                    <WithdrawIcon />
                    <span>
                        {{ withdrawOperationsCount }}
                    </span>
                </div>
            </div>
        </template>

        <div v-if="operations.length" class="operation-bag__header">
            <div class="operation-bag__header__title">
                <span> Bag </span>
            </div>
            <div class="operation-bag__header__clear" @click="onClickClearAllOperations">
                <span> Clear All </span>
            </div>
        </div>

        <div class="operation-list">
            <a-card
                v-for="(operation, index) in operations"
                :key="index"
                hoverable
                class="operation-card"
                :class="{
                    'operation-card--active': currentOpId.includes(operation.id),
                }"
                @click="onClickSelectCurrentOperation(operation)"
            >
                <a-card-meta>
                    <template #title>
                        <div class="operation-card__info">
                            <div class="operation-card__title">
                                <span> {{ operation.symbol }} </span>
                                <div class="operation-card__protocol">
                                    <TokenIcon :token="operation.protocol" :width="18" :height="18" />
                                    <span class="operation-card__protocol-name">
                                        {{ operation.protocol.name }}
                                    </span>
                                </div>
                            </div>

                            <RemoveIcon
                                class="operation-card__action operation-card__action--remove"
                                @click="onClickRemoveOperation(operation)"
                            />

                            <ArrowIcon
                                class="operation-card__action operation-card__action--start"
                                @click="onClickSelectCurrentOperation(operation)"
                            />
                        </div>
                    </template>
                    <template #avatar>
                        <AssetWithChain
                            type="asset"
                            :chain="operation.chainInfo"
                            :asset="operation"
                            :width="40"
                            :height="40"
                            :divider="2"
                        />
                    </template>
                </a-card-meta>
            </a-card>
        </div>

        <template v-if="currentOpId && currentOpId.includes(activeRadio)" #footer>
            <AmountAndTokenSelector
                :asset="selectedSrcToken"
                :chain="selectedSrcNetwork"
                :value="srcAmount"
                :on-select-token="() => onSelectToken(true, DIRECTIONS.SOURCE)"
                @set-amount="handleOnSetAmount"
            />

            <QuotePreview :fees="fees" :quote="selectedRoute" />

            <UiButton
                :title="$t(opTitle)"
                :disabled="isDisableConfirmButton"
                :tip="$t(opTitle)"
                :loading="isAllowanceLoading || isTransactionSigning"
                class="operation__bag--execute module-layout-view-btn"
                data-qa="confirm"
                size="large"
                @click="handleOnConfirmOperation"
            />
        </template>
    </a-drawer>
</template>
<script>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

import useModuleOperations from '@/compositions/useModuleOperation';

import { ModuleType } from '@/shared/models/enums/modules.enum';
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { FEE_TYPE } from '@/shared/models/enums/fee.enum';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';
import UiButton from '@/components/ui/Button.vue';
import AssetWithChain from '@/components/app/assets/AssetWithChain.vue';

import RemoveIcon from '@/assets/icons/operations-bag/remove.svg';
import DepositIcon from '@/assets/icons/dashboard/deposit.svg';
import WithdrawIcon from '@/assets/icons/dashboard/withdraw.svg';
import ArrowIcon from '@/assets/icons/operations-bag/arrow.svg';

import AmountAndTokenSelector from '@/components/ui/AmountAndTokenSelector/index.vue';
import QuotePreview from '@/components/ui/QuotePreview/index.vue';

export default {
    name: 'OperationBag',
    components: {
        TokenIcon,
        AssetWithChain,
        UiButton,

        AmountAndTokenSelector,
        QuotePreview,

        DepositIcon,
        WithdrawIcon,
        RemoveIcon,
        ArrowIcon,
    },
    setup() {
        const TITLES = {
            deposit: 'Deposit',
            withdraw: 'Withdraw',
        };

        const store = useStore();

        const activeRadio = ref('deposit');
        const currentStage = ref('1');
        const operationBagTitle = computed(() => TITLES[activeRadio.value]);

        const depositOperationsCount = computed(() => store.getters['operationBag/getDepositOperationsCount']);
        const withdrawOperationsCount = computed(() => store.getters['operationBag/getWithdrawOperationsCount']);

        const operations = computed(() => store.getters['operationBag/getOperations'](activeRadio.value));
        const currentOpId = computed(() => store.getters['operationBag/getCurrentOperationId']);
        const operationInProgress = computed(() => store.getters['operationBag/getOperationInProgress']);

        const currentOperation = computed(() => store.getters['operationBag/getOperationById'](currentOpId.value));

        const radioOptions = [
            {
                value: 'deposit',
                payload: {
                    title: 'Deposit',
                    icon: 'DepositIcon',
                },
            },
            {
                value: 'withdraw',
                payload: {
                    title: 'Withdraw',
                    icon: 'WithdrawIcon',
                },
            },
        ];

        const isOpen = computed({
            get: () => store.getters['operationBag/isOpen'],
            set: (value) => store.dispatch('operationBag/setIsOpen', value),
        });

        const onClickRemoveOperation = (record) => {
            return store.dispatch('operationBag/removeOperation', {
                type: activeRadio.value,
                id: record.id,
            });
        };

        const onClickSelectCurrentOperation = (record) => store.dispatch('operationBag/setCurrentOperation', record.id);

        const onClickClearAllOperations = () => store.dispatch('operationBag/clearAllOperations');

        const { moduleInstance, isTransactionSigning, isDisableConfirmButton, isDisableSelect, handleOnConfirm } = useModuleOperations(
            ModuleType.superSwap,
        );

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
            routeTimer,

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
        } = moduleInstance;

        const onSelectNetwork = (direction) => handleOnSelectNetwork({ direction: DIRECTIONS[direction] });

        const onSelectToken = (withBalance = true, direction = DIRECTIONS.SOURCE) => {
            handleOnSelectToken({
                direction: DIRECTIONS[direction],
                type: withBalance ? TOKEN_SELECT_TYPES.FROM : TOKEN_SELECT_TYPES.TO,
            });
        };

        const setSelectedDstInfo = () => {
            srcAmount.value = 0;
            dstAmount.value = 0;

            if (!currentOperation.value) return;

            const { chain } = currentOperation.value || {};
            const config = store.getters['configs/getChainConfigByChainOrNet'](chain, Ecosystem.EVM);

            if (currentOpId.value.includes('deposit')) {
                selectedDstNetwork.value = config;
                selectedSrcNetwork.value = config;
            } else {
                // selectedSrcNetwork.value = config;
                // selectedDstNetwork.value = config;
            }
        };

        watch(currentOpId, () => setSelectedDstInfo());
        watch(selectedDstToken, () => {
            if (selectedDstToken.value?.id !== currentOperation.value?.id) selectedDstToken.value = currentOperation.value;
        });

        const handleOnConfirmOperation = async () => {
            if (!currentOperation.value) return;
            await store.dispatch('operationBag/setCurrentProcessOperation', {
                type: activeRadio.value,
                id: currentOperation.value.id,
            });
            await handleOnConfirm();
        };

        return {
            isOpen,
            currentStage,
            activeRadio,
            operations,
            currentOpId,
            operationInProgress,

            depositOperationsCount,
            withdrawOperationsCount,

            radioOptions,
            operationBagTitle,

            DIRECTIONS,
            TOKEN_SELECT_TYPES,

            // * Module values
            opTitle,
            isDisableSelect,
            isDisableConfirmButton,
            isAllowanceLoading,
            isTransactionSigning,

            srcAmount,
            dstAmount,
            selectedDstToken,
            selectedDstNetwork,
            selectedSrcNetwork,
            selectedSrcToken,
            isShowEstimateInfo,
            isQuoteLoading,
            fees,
            FEE_TYPE,
            quoteErrorMessage,
            toggleRoutesModal,
            otherRoutes,
            selectedRoute,

            // * Module methods
            handleOnSetAmount,
            handleOnConfirmOperation,

            onSelectNetwork,
            onSelectToken,

            onClickRemoveOperation,
            onClickClearAllOperations,
            onClickSelectCurrentOperation,
        };
    },
};
</script>
