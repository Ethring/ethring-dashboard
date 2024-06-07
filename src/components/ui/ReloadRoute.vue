<template>
    <div
        class="reload-btn mr-8"
        data-qa="reload-route"
        :class="{
            active: dstAmount && !isQuoteLoading && !isTransactionSigning,
            timer: routeTimer.seconds && !isQuoteLoading,
        }"
        @click="() => getEstimateInfo(true)"
    >
        <SyncOutlined v-if="!routeTimer.seconds || Boolean(isQuoteLoading)" :spin="isQuoteLoading" />
        <a-progress
            v-else-if="routeTimer.seconds && !isQuoteLoading"
            type="circle"
            :percent="routeTimer.percent"
            :stroke-width="16"
            :size="18"
        >
            <template #format>
                Routes available in {{ routeTimer.seconds }}s
                <p>Click to reload</p>
            </template>
        </a-progress>
    </div>
</template>
<script>
import { SyncOutlined } from '@ant-design/icons-vue';

export default {
    name: 'ReloadRoute',
    components: {
        SyncOutlined,
    },
    props: {
        dstAmount: {
            type: [String, Number],
            default: 0,
        },
        isQuoteLoading: {
            type: Boolean,
            default: false,
        },
        isTransactionSigning: {
            type: Boolean,
            default: false,
        },
        getEstimateInfo: {
            type: Function,
            default: () => {},
        },
        routeTimer: {
            type: Object,
            default: () => ({
                seconds: 0,
                percent: 0,
            }),
        },
    },
};
</script>
