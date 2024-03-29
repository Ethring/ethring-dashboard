<template>
    <div class="step-operation-info">
        <div class="label">{{ label }}</div>
        <div class="content">
            <div class="token-info">
                <AssetWithChain type="asset" :asset="operation.getToken('from') || {}" :chain="assetChain.from" :width="24" :height="24" />

                <Amount :value="operation.getParamByField('amount') || 0" :symbol="operation.getToken('from')?.symbol" type="currency" />
            </div>

            <template v-if="operation.getToken('to')">
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
        </div>
    </div>
</template>
<script lang="ts">
import { useStore } from 'vuex';
import { computed } from 'vue';
import { IBaseOperation } from '@/modules/operations/models/Operations';

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
        assetChain: {
            type: Object,
            required: true,
            default: () => ({
                from: {},
                to: {},
            }),
        },
    },
    setup(props) {
        const store = useStore();

        const operation = computed<IBaseOperation>(() => {
            const factory = store.getters['shortcuts/getShortcutOpsFactory'](props.shortcutId);

            if (!factory) return {} as IBaseOperation;

            return factory.getOperationById(props.operationId);
        });

        return {
            operation,
        };
    },
};
</script>
