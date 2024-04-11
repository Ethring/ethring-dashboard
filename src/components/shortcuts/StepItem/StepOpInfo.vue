<template>
    <div class="step-operation-info" v-if="operation">
        <div class="label">
            {{ label }}
        </div>
        <div class="content">
            <div class="token-info">
                <AssetWithChain type="asset" :asset="operation.getToken('from') || {}" :chain="assetChain.from" :width="24" :height="24" />

                <Amount :value="operation.getParamByField('amount')" :symbol="operation.getToken('from')?.symbol" type="currency" />
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
import { computed } from 'vue';
import { IBaseOperation } from '@/modules/operations/models/Operations';
import { InfoCircleOutlined } from '@ant-design/icons-vue';

import StepAdditionalInfo from './StepAdditionalInfo.vue';

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

        const operation = computed<IBaseOperation>(() => {
            if (!factory.value) return {} as IBaseOperation;

            return factory.value.getOperationById(props.operationId);
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

        const additionalTooltips = computed(() => {
            if (!operation.value) return [];

            return factory.value.getOperationAdditionalTooltipById(props.operationId) || [];
        });

        return {
            factory,
            operation,
            assetChain,
            additionalTooltips,
        };
    },
};
</script>
