<template>
    <a-drawer
        v-model:open="isOpen"
        root-class-name="operation-bag"
        :title="operationBagTitle"
        placement="right"
        :width="420"
        :closable="false"
    >
        <template #extra>
            <div class="operation-bag__actions">
                <a-segmented v-model:value="activeRadio" :options="radioOptions">
                    <template #label="{ payload }">
                        <a-tooltip placement="bottom">
                            <template #title>
                                {{ payload.title }}
                            </template>
                            <component :is="payload.icon"></component>
                        </a-tooltip>
                    </template>
                </a-segmented>
            </div>
        </template>
        <div class="operation-list">
            <a-card v-for="(operation, index) in operations" :key="index" hoverable class="operation-card">
                <a-card-meta>
                    <template #title>
                        <div class="operation-card__info">
                            <span>Deposit {{ operation.symbol }}</span>

                            <a-button
                                type="primary"
                                class="operation-card__action operation-card__action--remove"
                                @click="onClickRemoveOperation(operation)"
                            >
                                <DeleteOutlined />
                            </a-button>

                            <a-button type="primary" class="operation-card__action operation-card__action--start" @click="isOpen = false">
                                <PlayCircleOutlined />
                            </a-button>
                        </div>
                    </template>
                    <template #avatar>
                        <TokenIcon :token="operation" />
                    </template>
                </a-card-meta>
            </a-card>
        </div>

        <!-- <div>
            <SwapField name="srcAmount" :value="srcAmount" :token="selectedSrcToken" @set-amount="handleOnSetAmount">
                <SelectRecord
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    :current="selectedSrcNetwork"
                    @click="() => onSelectNetwork(DIRECTIONS.SOURCE)"
                />
                <SelectRecord
                    :placeholder="$t('tokenOperations.selectToken')"
                    :current="selectedSrcToken"
                    @click="() => onSelectToken(true, DIRECTIONS.SOURCE)"
                />
            </SwapField>

            <a-divider type="horizontal" />

            <SwapField
                :disabled="true"
                name="dstAmount"
                :value="dstAmount"
                :token="selectedDstToken"
                :is-amount-loading="isQuoteLoading"
                hide-max
            >
                <SelectRecord
                    :disabled="true"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    :current="selectedDstNetwork"
                    @click="() => onSelectNetwork(DIRECTIONS.DESTINATION)"
                />
                <SelectRecord
                    :disabled="true"
                    :placeholder="$t('tokenOperations.selectToken')"
                    :current="selectedDstToken"
                    @click="() => onSelectToken(false, DIRECTIONS.DESTINATION)"
                />
            </SwapField>

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
        </div> -->
    </a-drawer>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons-vue';
import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';
import useModuleOperations from '@/compositions/useModuleOperation';

import { ModuleType } from '@/shared/models/enums/modules.enum';
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { FEE_TYPE } from '@/shared/models/enums/fee.enum';

import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';
import SwapField from '@/components/ui/SuperSwap/SwapField.vue';
import SelectRecord from '@/components/ui/Select/SelectRecord.vue';
import { disable } from 'mixpanel-browser';

export default {
    name: 'OperationBag',
    components: {
        ArrowDownOutlined,
        ArrowUpOutlined,
        DeleteOutlined,
        PlayCircleOutlined,
        SwapField,
        SelectRecord,
        TokenIcon,
        EstimatePreviewInfo,
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

        const operations = computed(() => store.getters['operationBag/getOperations'](activeRadio.value));

        const radioOptions = [
            {
                value: 'deposit',
                payload: {
                    title: 'Deposit',
                    icon: 'ArrowUpOutlined',
                },
            },
            {
                value: 'withdraw',
                payload: {
                    title: 'Withdraw',
                    icon: 'ArrowDownOutlined',
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

        return {
            isOpen,
            currentStage,
            activeRadio,
            operations,
            radioOptions,
            operationBagTitle,

            DIRECTIONS,
            TOKEN_SELECT_TYPES,

            // * Module values
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

            onSelectNetwork,
            onSelectToken,

            onClickRemoveOperation,
        };
    },
};
</script>
