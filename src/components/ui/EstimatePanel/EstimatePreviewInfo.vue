<template>
    <a-collapse
        expand-icon-position="end"
        v-model:activeKey="activeKey"
        :class="{ isActive }"
        :bordered="false"
        class="estimate-info"
        @change="() => (isActive = !isActive)"
    >
        <template #expandIcon>
            <ArrowDownIcon class="arrow" />
        </template>

        <a-collapse-panel key="estimate-info" :collapsible="isCollapsible ? '' : 'disabled'" :showArrow="isCollapsible">
            <template #header>
                <div class="top-block">
                    <template v-if="isLoading">
                        <a-space>
                            <a-skeleton-avatar active size="small" class="icon-skeleton" />
                            <a-skeleton-input active size="small" class="skeleton" />
                        </a-space>
                    </template>
                    <template v-else>
                        <div class="preview-header">
                            <!-- <EstimateStats v-if="mainFee.fromAmount != 0 && !error" v-bind="mainFee" /> -->

                            <ServiceIcon v-if="service && !isLoading" :icon="service.icon" :name="service.name" :show-title="false" />

                            <div class="title">{{ title }}:</div>

                            <div class="preview-row" v-if="!error && !isLoading">
                                <div class="preview-custom-fee" v-if="feeInUsd">
                                    <FeeIcon />
                                    <Amount :value="feeInUsd" :decimals="2" symbol="$" type="usd" />
                                </div>

                                <div class="preview-custom-fee" v-if="estimateTime">
                                    <TimeIcon />
                                    <Amount :value="estimateTime" :decimals="2" symbol="s" type="time" />
                                </div>

                                <div v-if="mainRate && (mainRate?.toAmount != 0 || mainRate?.fromAmount != 0)">
                                    <EstimateStats v-bind="mainRate" />
                                </div>
                            </div>

                            <div v-else-if="error && !isLoading" class="error">
                                <template v-if="error.length <= MAX_LENGTH">
                                    {{ error }}
                                </template>
                                <template v-else>
                                    <a-tooltip placement="topLeft">
                                        <template #title>
                                            {{ error }}
                                        </template>

                                        {{ error }}
                                    </a-tooltip>
                                </template>
                            </div>
                        </div>
                    </template>
                </div>
            </template>

            <template v-if="isCollapsible && !isLoading">
                <div class="preview-services-wrap">
                    <div class="preview-services-row">
                        <template v-for="(record, index) in services" :key="record">
                            <ServiceIcon :icon="record?.service.icon" :name="record?.service.name" :show-title="true" />
                            <ArrowDownIcon class="arrow" v-if="index !== services?.length - 1" />
                        </template>
                    </div>
                    <ExpandIcon v-if="isShowExpand" class="expand-services" @click="onClickExpand" />
                </div>

                <div v-if="fees.length" class="fees">
                    <EstimateStats v-for="fee in fees" :key="fee" v-bind="fee" />
                </div>
            </template>
        </a-collapse-panel>
    </a-collapse>
</template>
<script>
import { ref, computed, watch } from 'vue';

import ArrowDownIcon from '@/assets/icons/arrows/arrow-down.svg';
import FeeIcon from '@/assets/icons/app/fee.svg';
import TimeIcon from '@/assets/icons/app/time.svg';
import Amount from '@/components/app/Amount.vue';

import EstimateStats from './EstimateStats.vue';
import ServiceIcon from './ServiceIcon.vue';

import ExpandIcon from '@/assets/icons/app/expand.svg';

export default {
    name: 'EstimatePreviewInfo',
    components: {
        ArrowDownIcon,
        FeeIcon,
        TimeIcon,
        Amount,
        ServiceIcon,
        ExpandIcon,
        EstimateStats,
    },

    props: {
        title: {
            type: String,
            required: true,
            default: '',
        },
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
    },
    setup(props) {
        const isActive = ref(false);

        const isCollapsible = computed(() => {
            const { fees = [], services = [], error = null, isLoading } = props || {};

            if (isLoading) {
                return false;
            }

            if (error) {
                return false;
            }

            if (!services.length && !fees.length) {
                console.log('!services.length || !fees.length');
                return false;
            }

            if (services.length) {
                return true;
            }

            const [fee] = fees || [];

            const isFeeEmpty = fee?.fromAmount == 0 || fee?.toAmount == 0;

            if (isFeeEmpty) {
                return false;
            }

            return true;
        });

        const activeKey = ref(isCollapsible.value ? ['estimate-info'] : []);

        watch(isCollapsible, () => {
            if (!isCollapsible.value) {
                activeKey.value = [];
            }
        });

        return {
            activeKey,
            isActive,
            isCollapsible,
            MAX_LENGTH: 55,
        };
    },
};
</script>
<style lang="scss" scoped>
.preview {
    &-header,
    &-services-wrap,
    &-row {
        display: flex;
        align-items: center;
    }

    &-row {
        & > div {
            display: flex;
            align-items: center;
            height: 24px;
            &:not(:last-child) {
                margin-right: 10px;
            }

            svg {
                margin-right: 5px;
            }
        }
    }

    &-services {
        &-wrap {
            gap: 8px;
        }

        &-row {
            display: flex;
            align-items: center;
            gap: 8px;

            overflow: hidden;
            text-overflow: ellipsis;

            .arrow {
                fill: var(--#{$prefix}select-icon-color);
                transform: rotate(-90deg);
                @include animateEasy;
            }
        }
    }
}

.expand-services {
    cursor: pointer;
    transition: 0.2s ease-in-out;
    opacity: 0.8;

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
    }

    .icon-skeleton {
        margin-right: 8px;
    }
    .top-block {
        @include pageFlexRow;
        justify-content: flex-start;

        .title {
            color: var(--#{$prefix}accordion-title);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 600;
            margin-right: 10px;
        }

        .error {
            font-weight: 500;
            color: var(--#{$prefix}warning);
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            max-width: 360px;
        }
    }

    svg.arrow {
        cursor: pointer;
        fill: var(--#{$prefix}select-icon-color);
        @include animateEasy;
    }

    .fees {
        margin-top: -10px;
    }
}

.isActive {
    .arrow {
        transform: rotate(180deg) !important;
    }
}
</style>
