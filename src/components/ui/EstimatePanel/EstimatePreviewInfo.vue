<template>
    <a-collapse
        v-model:activeKey="activeKey"
        expand-icon-position="end"
        :class="{ isActive }"
        :bordered="false"
        class="estimate-info"
        @change="() => (isActive = !isActive)"
    >
        <template #expandIcon>
            <ArrowDownIcon class="arrow" />
        </template>

        <a-collapse-panel
            key="estimate-info"
            :collapsible="(isCollapsible || isShowExpand) && !isLoading ? '' : 'disabled'"
            :show-arrow="isCollapsible || (isShowExpand && !isLoading)"
            data-qa="estimate-info"
        >
            <template #header>
                <div class="top-block">
                    <template v-if="isLoading">
                        <a-space>
                            <a-skeleton-input active size="small" class="skeleton" />
                        </a-space>
                    </template>
                    <template v-else>
                        <div class="preview-header">
                            <div v-if="!error && !isLoading" class="preview-row">
                                <div v-if="mainRate && (mainRate?.toAmount != 0 || mainRate?.fromAmount != 0)">
                                    <EstimateStats v-bind="mainRate" class="preview-custom-rate" />
                                </div>
                            </div>

                            <div v-if="isActive">
                                <div v-if="feeInUsd" class="preview-custom-fee">
                                    <FeeIcon />
                                    <Amount v-if="feeInUsd > 0" :value="feeInUsd" :decimals="2" symbol="$" type="usd" />
                                    <div v-else class="text">{{ $t('tokenOperations.unknownGas') }}</div>
                                </div>
                            </div>

                            <a-tooltip
                                v-else-if="error && !isLoading"
                                class="error"
                                :title="!error ? $t('tokenOperations.noAvailableRoute') : error"
                            >
                                <template v-if="error.length <= MAX_LENGTH">
                                    <a-row align="middle" class="route-error">
                                        <RouteIcon />
                                        {{ error }}
                                    </a-row>
                                </template>
                                <template v-else>
                                    <a-tooltip placement="topLeft">
                                        <template #title>
                                            <a-row align="middle" class="route-error">
                                                <RouteIcon />
                                                {{ error }}
                                            </a-row>
                                        </template>
                                        <a-row align="middle" class="route-error">
                                            <RouteIcon />
                                            {{ error }}
                                        </a-row>
                                    </a-tooltip>
                                </template>
                            </a-tooltip>
                        </div>
                    </template>
                </div>
            </template>

            <!-- Collapse content -->
            <template v-if="((isCollapsible && !isLoading) || isShowExpand) && services">
                <EstimateStats
                    :title="$t('tokenOperations.minReceived')"
                    :from-amount="minOutAmount(amount)"
                    :from-symbol="mainRate?.toSymbol"
                />
                <EstimateStats :title="$t('tokenOperations.maxSlippage')" :from-amount="slippage" from-symbol="%" />

                <a-row justify="space-between" align="middle">
                    <div class="preview-title">{{ $t('tokenOperations.fee') }}</div>
                    <div v-if="feeInUsd" class="preview-custom-fee">
                        <FeeIcon />
                        <Amount v-if="feeInUsd > 0" :value="feeInUsd" :decimals="2" symbol="$" type="usd" />
                        <div v-else class="text">{{ $t('tokenOperations.unknownGas') }}</div>
                    </div>
                </a-row>

                <div class="preview-services-wrap">
                    <div class="preview-services-row">
                        <div class="preview-title">{{ $t('tokenOperations.route') }}</div>

                        <a-row>
                            <div
                                v-for="tag in estimatedTag(services)"
                                :key="tag"
                                :class="{ 'preview-services-tag': true, [tag.class]: true }"
                            >
                                {{ tag.status }}
                            </div>

                            <template v-for="(route, index) in services" :key="route">
                                <ServiceIcon
                                    :icon="servicesHash[route.serviceId]?.icon"
                                    :name="servicesHash[route.serviceId]?.name"
                                    :show-title="true"
                                    class="services-icon"
                                />
                                <ArrowDownIcon v-if="index !== services?.length - 1" class="arrow" />
                            </template>
                        </a-row>
                    </div>
                    <ExpandIcon v-if="isShowExpand" class="expand-services" @click="onClickExpand" />
                </div>
            </template>
        </a-collapse-panel>
    </a-collapse>
</template>
<script>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

import ArrowDownIcon from '@/assets/icons/form-icons/arrow-down.svg';
import FeeIcon from '@/assets/icons/module-icons/fee.svg';
import ExpandIcon from '@/assets/icons/module-icons/expand.svg';
import RouteIcon from '@/assets/icons/module-icons/route.svg';

import Amount from '@/components/app/Amount.vue';
import EstimateStats from './EstimateStats.vue';
import ServiceIcon from './ServiceIcon.vue';

import { calculateMinAmount } from '@/shared/calculations/calculate-fee';

export default {
    name: 'EstimatePreviewInfo',
    components: {
        ArrowDownIcon,
        FeeIcon,
        ExpandIcon,
        RouteIcon,

        Amount,
        ServiceIcon,
        EstimateStats,
    },

    props: {
        isLoading: {
            type: Boolean,
            required: true,
            default: false,
        },
        error: {
            type: String,
            default: '',
        },

        feeInUsd: {
            type: [String, Number],
            default: 0,
        },

        estimateTime: {
            type: [String, Number],
            default: 0,
        },

        mainRate: {
            type: Object,
            default: () => null,
        },

        fees: {
            type: Array,
            default: () => [],
        },

        service: {
            type: Object,
            default: () => null,
        },

        services: {
            type: Array,
            default: () => [],
        },

        isShowExpand: {
            type: [Boolean, Number],
            required: false,
            default: false,
        },

        onClickExpand: {
            type: Function,
            default: () => {},
        },

        amount: {
            type: String,
            default: '',
        },
    },
    setup(props) {
        const store = useStore();

        const isActive = ref(false);

        const slippage = computed(() => store.getters['tokenOps/slippage']);

        const isCollapsible = computed(() => {
            const { fees = [], services = [], error = null, isLoading } = props || {};

            if (isLoading) return false;

            if (error) return false;

            if (!services.length && !fees.length) return false;

            if (services.length) return true;

            const [fee] = fees || [];

            const isFeeEmpty = fee?.fromAmount == 0 || fee?.toAmount == 0;

            if (isFeeEmpty) return false;

            return true;
        });

        const servicesHash = computed(() => store.getters['bridgeDexAPI/getAllServicesHash']);

        const activeKey = ref(isCollapsible.value ? ['estimate-info'] : []);

        watch(isCollapsible, () => {
            if (!isCollapsible.value) activeKey.value = [];
        });

        watch(
            () => props.isLoading,
            () => {
                if (isCollapsible.value) activeKey.value = ['estimate-info'];
            },
        );

        const minOutAmount = (amount) => calculateMinAmount(amount, slippage.value);

        const getTag = (services) => {
            const tags = [];
            if (services[0].bestFee) tags.push({ status: 'Low fee', class: 'low-fee' });

            if (services[0].bestReturn) tags.push({ status: 'Best return', class: 'best-return' });

            return tags;
        };

        const estimatedTag = (services) => {
            return getTag(services);
        };

        return {
            activeKey,
            isActive,
            isCollapsible,
            MAX_LENGTH: 55,
            servicesHash,
            slippage,

            minOutAmount,
            estimatedTag,
        };
    },
};
</script>
<style lang="scss">
.preview {
    &-header,
    &-services-wrap,
    &-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &-custom-fee {
        @include pageFlexRow;

        svg {
            margin-right: 5px;
        }

        .text {
            font-weight: 500;
            color: var(--#{$prefix}warning);
        }
    }

    &-header {
        width: 100%;
    }

    &-title {
        font-weight: 400;
        font-size: var(--#{$prefix}default-fs);
        color: var(--#{$prefix}accordion-label-color);
    }

    &-row {
        @include pageFlexRow;
        justify-content: space-between;

        & > div {
            display: flex;
            align-items: center;
            height: 24px;

            &:not(:last-child) {
                margin-right: 10px;
            }
        }
    }

    &-services {
        &-row {
            @include pageFlexRow;
            justify-content: space-between;
            gap: 8px;

            width: 100%;

            overflow: hidden;
            text-overflow: ellipsis;

            .arrow {
                fill: var(--#{$prefix}select-icon-color);
                transform: rotate(-90deg);
                @include animateEasy;
            }
        }

        &-tag {
            border-radius: 24px;
            font-size: var(--#{$prefix}small-sm-fs);
            font-weight: 400;
            color: var(--#{$prefix}btn-text-color);
            padding: 4px 10px;
            margin: 2px 0 0 6px;
        }

        &-tag.low-fee {
            background-color: var(--#{$prefix}tag-03);
        }

        &-tag.best-return {
            background-color: var(--#{$prefix}tag-01);
        }
    }
}

.expand-services {
    cursor: pointer;
    transition: 0.2s ease-in-out;
    opacity: 0.8;

    margin-left: 10px;

    &:hover {
        transform: scale(1.1);
        opacity: 1;
    }
}

.estimate-info {
    overflow: hidden;
    margin-top: 8px;
    background-color: var(--#{$prefix}accordion-bg-color);
    border: 1px solid var(--#{$prefix}accordion-border-color);
    border-radius: 8px;

    .skeleton {
        height: 24px;

        span {
            width: 200px !important;
            min-width: 200px !important;
        }
    }

    .top-block {
        @include pageFlexRow;
        justify-content: flex-start;

        .title {
            color: var(--#{$prefix}accordion-title);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 600;
            margin-right: 10px;
            width: fit-content;
            max-width: 100px;
        }

        .error {
            font-weight: 500;
            color: var(--#{$prefix}warning);
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            gap: 8px;
        }
    }

    svg.arrow {
        cursor: pointer;
        fill: var(--#{$prefix}select-icon-color);
        @include animateEasy;
    }

    .ant-collapse-content-box {
        padding-top: 0 !important;
    }
}

.isActive {
    .arrow {
        transform: rotate(180deg) !important;
    }
}

.services-icon {
    margin-left: 10px;
}

.route-error {
    flex-wrap: nowrap;
}
</style>
