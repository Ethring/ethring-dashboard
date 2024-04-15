<template>
    <div class="step-operation-info" v-if="operation">
        <div class="label">
            {{ label }}
        </div>
        <div class="content">
            <div class="token-info">
                <AssetWithChain type="asset" :asset="operation.getToken('from') || {}" :chain="assetChain.from" :width="24" :height="24" />

                <a-popconfirm
                    title="Change From amount?"
                    ok-text="Change"
                    cancel-text="No"
                    @confirm="handleOnConfirm"
                    @cancel="handleOnCancel"
                    :disabled="isEditDisabled"
                >
                    <template #description>
                        <a-input-number
                            string-mode
                            class="editable-amount-input"
                            v-model:value="editedAmount"
                            :value="operation.getParamByField('amount')"
                            :controls="false"
                            :min="0"
                            :max="operation.getToken('from')?.balance ? operation.getToken('from')?.balance : Infinity"
                        >
                            <template #addonAfter v-if="operation.getToken('from')?.balance">
                                <span class="max-balance" @click="handleOnMax">MAX: {{ operation.getToken('from')?.balance }}</span>
                            </template>
                        </a-input-number>
                    </template>
                    <Amount
                        :value="operation.getParamByField('amount')"
                        :symbol="operation.getToken('from')?.symbol"
                        type="currency"
                        :class="{
                            'editable-amount': shortcutOpInfo.editableFromAmount,
                            'editable-amount-disabled': isEditDisabled,
                        }"
                    />
                </a-popconfirm>
            </div>

            <template v-if="operation.getToken('to') && operation.getToken('to')?.id !== operation.getToken('from')?.id">
                <div class="space-between">to</div>

                <div class="token-info">
                    <AssetWithChain type="asset" :asset="operation.getToken('to') || {}" :chain="assetChain.to" :width="24" :height="24" />

                    <Amount
                        :value="operation.getParamByField('outputAmount') || 0"
                        :symbol="operation.getToken('to')?.symbol"
                        type="currency"
                    />
                </div>
            </template>

            <template v-if="additionalTooltips && additionalTooltips.length">
                <a-popover placement="top" class="step-additional-info-popover">
                    <template #content class="step-additional-info-popover">
                        <StepAdditionalInfo
                            v-for="additionalInfo in additionalTooltips"
                            :amount-info="additionalInfo?.amountSrcInfo"
                            :percentage-info="additionalInfo?.percentageInfo"
                        />
                    </template>
                    <InfoCircleOutlined class="step-operation-info-additional" />
                </a-popover>
            </template>
        </div>
    </div>
</template>
<script lang="ts">
import { useStore } from 'vuex';
import { computed, ref, h } from 'vue';
import { IBaseOperation } from '@/modules/operations/models/Operations';
import { InfoCircleOutlined } from '@ant-design/icons-vue';

import StepAdditionalInfo from './StepAdditionalInfo.vue';
import { IShortcutOp } from '../../../modules/shortcuts/core/ShortcutOp';
import { SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';

export default {
    name: 'StepOpInfo',
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
    components: {
        InfoCircleOutlined,
        StepAdditionalInfo,
    },
    setup(props) {
        const store = useStore();

        const factory = computed(() => store.getters['shortcuts/getShortcutOpsFactory'](props.shortcutId));

        const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](props.shortcutId));
        const isTransactionSigning = computed(() => store.getters['txManager/isTransactionSigning']);

        const operation = computed<IBaseOperation>(() => {
            if (!factory.value) return {} as IBaseOperation;

            return factory.value.getOperationById(props.operationId);
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

        return {
            factory,
            operation,
            assetChain,
            additionalTooltips,
            isEditDisabled,
            editedAmount,

            handleOnCancel,
            handleOnConfirm,
            shortcutOpInfo,
            handleOnMax,
        };
    },
};
</script>
