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

        <OperationBagHeader v-if="operations.length" :operation-type="activeRadio" />

        <div v-if="operations.length" class="operation-list">
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
                        <div class="operation-card__content">
                            <AssetWithChain
                                type="asset"
                                :chain="operation.chainInfo || null"
                                :asset="operation"
                                :width="30"
                                :height="30"
                                :divider="1.875"
                            />

                            <div class="operation-card__info">
                                <div class="operation-card__title">
                                    <div>{{ operation.symbol }}</div>
                                    <div class="operation-card__protocol">
                                        <TokenIcon :token="operation.protocol" :width="16" :height="16" />
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
                        </div>
                    </template>

                    <template v-if="currentOpId.includes(operation.id) && activeRadio === 'withdraw'" #description>
                        <div class="operation-card__withdraw">
                            <AmountAndTokenSelector
                                :asset="selectedSrcToken"
                                :chain="selectedSrcNetwork"
                                :value="srcAmount"
                                :hide-token-selector="true"
                                :disabled="!selectedSrcToken?.id || !selectedDstToken?.id"
                                class="operation-card__withdraw-select"
                                @set-amount="handleOnSetAmount"
                            />
                        </div>
                    </template>
                </a-card-meta>
            </a-card>
        </div>

        <div v-else class="operation-bag__empty">
            <EmptyBagIcon />

            <span class="operation-bag__empty__title"> Bag is empty </span>
            <router-link
                :to="activeRadio === 'deposit' ? '/earn' : '/dashboard'"
                class="operation-bag__empty__link"
                @click="isOpen = false"
            >
                {{ activeRadio === 'deposit' ? 'Start earn' : 'Withdraw Liquidity' }}
            </router-link>
        </div>

        <template v-if="currentOpId && currentOpId.includes(activeRadio) && currentOpId !== ''" #footer>
            <AmountAndTokenSelector
                v-if="activeRadio === 'deposit'"
                :asset="selectedSrcToken"
                :chain="selectedSrcNetwork"
                :value="srcAmount"
                :disabled="!selectedSrcToken?.id || !selectedDstToken?.id"
                :on-select-token="() => onSelectToken(true, DIRECTIONS.SOURCE)"
                @set-amount="handleOnSetAmount"
            />

            <template v-else>
                <div class="amount-and-token-selector--label">
                    <span>Target token</span>
                </div>

                <a-card hoverable class="operation-card withdraw-card" @click="onSelectToken(false, DIRECTIONS.DESTINATION)">
                    <a-card-meta>
                        <template #title>
                            <div class="operation-card__content">
                                <AssetWithChain
                                    type="asset"
                                    :chain="(selectedDstToken?.id && selectedDstNetwork) || null"
                                    :asset="selectedDstToken"
                                    :width="30"
                                    :height="30"
                                    :divider="1.875"
                                />

                                <div class="operation-card__info">
                                    <div class="operation-card__title">
                                        <span v-if="!selectedDstToken" class="operation-card__placeholder"> Select Chain and Token </span>
                                        <div v-else class="operation-card__token-info">
                                            <span class="operation-card__token">
                                                {{ selectedDstToken?.symbol }}
                                            </span>
                                            <span class="operation-card__chain">
                                                {{ selectedDstNetwork?.name }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </a-card-meta>
                </a-card>
            </template>
            <QuotePreview :fees="fees" :quote="selectedRoute" :error="quoteErrorMessage" :asset="selectedDstToken" />

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
import { computed, ref, watch, shallowRef } from 'vue';
import { useStore } from 'vuex';

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
import EmptyBagIcon from '@/assets/icons/operations-bag/empty-bag.svg';

import AmountAndTokenSelector from '@/core/operations/UI/components/AmountAndTokenSelector/index.vue';
import QuotePreview from '@/core/operations/UI/components/QuotePreview/index.vue';
import OperationBagHeader from '@/core/operations/UI/components/OperationBag/Header.vue';
import BalancesDB from '@/services/indexed-db/balances';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import { getTokenPriceFromProvider } from '@/core/balance-provider';

export default {
    name: 'OperationBag',
    components: {
        AssetWithChain,
        UiButton,

        AmountAndTokenSelector,
        QuotePreview,

        OperationBagHeader,

        ArrowIcon,
        DepositIcon,
        RemoveIcon,
        WithdrawIcon,
        EmptyBagIcon,
    },
    setup() {
        const TITLES = {
            deposit: 'Deposit',
            withdraw: 'Withdraw',
        };

        const assetBalance = shallowRef({});

        const store = useStore();

        const { walletAddress } = useAdapter();

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

        const onClickSelectCurrentOperation = async (record) => {
            await store.dispatch('operationBag/setCurrentOperation', record.id);
            await setTokenInfoForOperation(true);
        };

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
            handleOnSetAmount(null);
            handleOnSelectToken({
                direction: DIRECTIONS[direction],
                type: withBalance ? TOKEN_SELECT_TYPES.FROM : TOKEN_SELECT_TYPES.TO,
            });
        };

        const setDepositInfo = async (config) => {
            selectedDstNetwork.value = config;

            const price = !currentOperation.value?.price
                ? await getTokenPriceFromProvider(currentOperation.value.chain, currentOperation.value.address)
                : currentOperation.value?.price;

            selectedDstToken.value = {
                ...currentOperation.value,
                price: price || 0,
            };
        };

        const setWithdrawInfo = async (config) => {
            selectedSrcNetwork.value = config;

            const dateType = currentOperation.value.id.includes('tokens') ? 'tokens' : 'pools';

            assetBalance.value = await BalancesDB.getBalanceById(walletAddress.value, dateType, currentOperation.value);

            selectedSrcToken.value = {
                ...currentOperation.value,
                balance: assetBalance.value?.balance || 0,
                price: assetBalance.value?.price || 0,
            };
        };

        const setTokenInfoForOperation = async (withResetToken = false) => {
            if (!currentOperation.value) return;

            withResetToken && (srcAmount.value = 0);
            withResetToken && (dstAmount.value = 0);

            const { chain } = currentOperation.value || {};

            const config = store.getters['configs/getChainConfigByChainOrNet'](chain, Ecosystem.EVM);

            switch (activeRadio.value) {
                case 'deposit':
                    await setDepositInfo(config);
                    withResetToken && (selectedSrcToken.value = null);
                    break;
                case 'withdraw':
                    await setWithdrawInfo(config);
                    withResetToken && (selectedDstToken.value = null);
                    break;
            }
        };

        const handleOnConfirmOperation = async () => {
            if (!currentOperation.value) return;

            await store.dispatch('operationBag/setCurrentProcessOperation', {
                type: activeRadio.value,
                id: currentOperation.value.id,
            });

            await handleOnConfirm();
        };

        watch(isOpen, () => {
            if (!isOpen.value) {
                store.dispatch('operationBag/clearCurrentOperation');
                srcAmount.value = 0;
                dstAmount.value = 0;
                quoteErrorMessage.value = '';
                selectedDstToken.value = null;
                selectedDstNetwork.value = null;
                selectedSrcNetwork.value = null;
                selectedSrcToken.value = null;
            }

            if (isOpen.value && depositOperationsCount.value > 0) activeRadio.value = 'deposit';
            else if (isOpen.value && withdrawOperationsCount.value > 0) activeRadio.value = 'withdraw';
        });

        watch(selectedDstToken, async () => {
            if (activeRadio.value === 'deposit' && selectedDstToken.value?.id !== currentOperation.value?.id)
                await setTokenInfoForOperation();
        });

        watch(selectedSrcToken, async () => {
            if (activeRadio.value === 'withdraw' && selectedSrcToken.value?.id !== currentOperation.value?.id)
                await setTokenInfoForOperation();
        });

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
            onClickSelectCurrentOperation,
        };
    },
};
</script>
