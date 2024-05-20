<template>
    <div v-if="operation" class="step-operation-info">
        <div class="label">
            {{ label }}
        </div>
        <div class="content">
            <div class="token-info">
                <AssetWithChain type="asset" :asset="operation.getToken('from') || {}" :chain="assetChain.from" :width="24" :height="24" />

                <template v-if="operation.getModule() === ModuleType.nft">
                    <Amount
                        :value="operation.getParamByField('count')"
                        symbol="NFT"
                        type="currency"
                        :class="{
                            'editable-amount': shortcutOpInfo.editableFromAmount,
                            'editable-amount-disabled': isEditDisabled,
                        }"
                    />
                </template>
                <template v-else>
                    <a-popconfirm
                        title="Change From amount?"
                        ok-text="Change"
                        cancel-text="No"
                        :disabled="isEditDisabled"
                        @confirm="handleOnConfirm"
                        @cancel="handleOnCancel"
                    >
                        <template #description>
                            <a-input-number
                                v-model:value="editedAmount"
                                string-mode
                                class="editable-amount-input"
                                :controls="false"
                                :min="0"
                                :max="operation.getToken('from')?.balance ? operation.getToken('from')?.balance : Infinity"
                            >
                                <template v-if="operation.getToken('from')?.balance" #addonAfter>
                                    <span class="max-balance" @click="handleOnMax">MAX: {{ operation.getToken('from')?.balance }}</span>
                                </template>
                            </a-input-number>
                        </template>
                        <Amount
                            :value="operation.getToken('from')?.amount || operation.getParamByField('amount')"
                            :symbol="operation.getToken('from')?.symbol"
                            type="currency"
                            :class="{
                                'editable-amount': shortcutOpInfo.editableFromAmount,
                                'editable-amount-disabled': isEditDisabled,
                            }"
                        />
                    </a-popconfirm>
                </template>
            </div>

            <template v-if="operation.getToken('to') && operation.getToken('to')?.id !== operation.getToken('from')?.id">
                <div class="space-between">to</div>

                <div class="token-info">
                    <AssetWithChain type="asset" :asset="operation.getToken('to') || {}" :chain="assetChain.to" :width="24" :height="24" />

                    <Amount
                        :value="operation.getToken('to')?.amount || operation.getParamByField('outputAmount') || 0"
                        :symbol="operation.getToken('to')?.symbol"
                        type="currency"
                    />
                </div>
            </template>

            <template v-if="additionalTooltips && additionalTooltips.length">
                <a-popover placement="top" class="step-additional-info-popover">
                    <template #content>
                        <StepAdditionalInfo
                            v-for="additionalInfo in additionalTooltips"
                            :key="additionalInfo"
                            :amount-info="additionalInfo?.amountSrcInfo"
                            :percentage-info="additionalInfo?.percentageInfo"
                        />
                    </template>
                    <InfoCircleOutlined class="step-operation-info-additional" />
                </a-popover>
            </template>

            <template v-if="isShowTimer">
                <a-progress type="circle" :percent="percentageToDisplay" :size="25" class="timer-for-operation">
                    <template #format>
                        <span>{{ secondToDisplay }}</span>
                    </template>
                </a-progress>
            </template>
        </div>
    </div>
</template>
<script lang="ts">
import { useStore } from 'vuex';
import { computed, ref, watch } from 'vue';

import { InfoCircleOutlined } from '@ant-design/icons-vue';

import StepAdditionalInfo from './StepAdditionalInfo.vue';

import { IBaseOperation, IOperationFactory } from '@/core/operations/models/Operations';
import { IShortcutOp } from '@/core/shortcuts/core/ShortcutOp';

import { SHORTCUT_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { onMounted } from 'vue';
import OperationFactory from '@/core/operations/OperationsFactory';

export default {
    name: 'StepOpInfo',
    components: {
        InfoCircleOutlined,
        StepAdditionalInfo,
    },
    props: {
        label: {
            type: String,
            required: true,
        },
        shortcutId: {
            type: String,
            required: true,
        },
        operationId: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const store = useStore();

        const factory = computed<IOperationFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](props.shortcutId));

        const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](props.shortcutId));
        const isTransactionSigning = computed(() => store.getters['txManager/isTransactionSigning']);

        const operation = computed<IBaseOperation>(() => {
            if (!factory.value) return {} as IBaseOperation;
            return factory.value.getOperationById(props.operationId) as IBaseOperation;
        });

        const shortcutOpInfo = computed<IShortcutOp>(() => {
            if (!props.shortcutId || !props.operationId) return {} as IShortcutOp;
            if (!operation.value) return {} as IShortcutOp;
            return store.getters['shortcuts/getShortcutOpInfoById'](props.shortcutId, props.operationId);
        });

        const isEditDisabled = computed(() => {
            return (
                isTransactionSigning.value ||
                ![SHORTCUT_STATUSES.PENDING].includes(shortcutStatus.value) ||
                !shortcutOpInfo.value.editableFromAmount
            );
        });

        const assetChain = computed(() => {
            const fromAssetChain = {
                symbol: operation.value.getToken('from')?.chain,
                logo: store.getters['configs/getChainLogoByNet'](operation.value.getToken('from')?.chain),
            };

            const toAssetChain = {
                symbol: operation.value.getToken('to')?.chain,
                logo: store.getters['configs/getChainLogoByNet'](operation.value.getToken('to')?.chain),
            };

            return {
                from: fromAssetChain,
                to: toAssetChain,
            };
        });

        const editedAmount = ref(operation.value?.getParamByField('amount') || 0);

        const additionalTooltips = computed(() => {
            if (!operation.value) return [];

            return factory.value.getOperationAdditionalTooltipById(props.operationId) || [];
        });

        const handleOnConfirm = () => {
            if (!editedAmount.value) editedAmount.value = 0;
            console.log('handleOnConfirm', editedAmount.value.toString());
            const opsFullFlow = factory.value.getFullOperationFlow() || {};

            const [firstOp] = opsFullFlow || [];

            const { moduleIndex } = firstOp || {};

            if (moduleIndex === operation.value.getUniqueId()) {
                operation.value.setParamByField('amount', editedAmount.value.toString());
                store.dispatch(`tokenOps/setFieldValue`, { field: 'srcAmount', value: editedAmount.value.toString() });
            } else {
                operation.value.setParamByField('amount', editedAmount.value.toString());
                console.log('setIsCallEstimate', props.shortcutId, true);
                store.dispatch('shortcuts/setIsCallEstimate', {
                    shortcutId: props.shortcutId,
                    value: true,
                });
            }
        };

        const handleOnCancel = () => {
            editedAmount.value = operation.value.getParamByField('amount');
            console.log('handleOnCancel', editedAmount.value);
        };

        const handleOnMax = () => {
            editedAmount.value = operation.value.getToken('from')?.balance || 0;
        };

        const percentageToDisplay = ref(100);
        const secondToDisplay = ref(operation.value.getWaitTime());
        const timer = ref();

        const startTimer = () => {
            timer.value = setInterval(() => {
                const step = 100 / operation.value.getWaitTime();
                percentageToDisplay.value -= step;
                secondToDisplay.value -= 1;
            }, 1000);
        };

        const isShowTimer = ref(false);

        watch(
            () => factory.value.getOperationsStatusById(props.operationId),
            () => {
                if (factory.value.getOperationsStatusById(props.operationId) === STATUSES.SUCCESS) {
                    isShowTimer.value = true;
                    percentageToDisplay.value = 100;
                    secondToDisplay.value = operation.value.getWaitTime();
                    startTimer();
                }
            },
        );

        watch(percentageToDisplay, () => {
            if (percentageToDisplay.value <= 0 && timer.value) {
                clearInterval(timer.value);
                percentageToDisplay.value = operation.value.getWaitTime();
                secondToDisplay.value = operation.value.getWaitTime();
                isShowTimer.value = false;
            }
        });

        return {
            factory,
            operation,
            assetChain,
            additionalTooltips,
            isEditDisabled,
            editedAmount,

            ModuleType,

            handleOnCancel,
            handleOnConfirm,
            shortcutOpInfo,
            handleOnMax,

            percentageToDisplay,
            secondToDisplay,
            isShowTimer,
        };
    },
};
</script>
