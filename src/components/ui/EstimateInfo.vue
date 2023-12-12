<template>
    <a-collapse
        expand-icon-position="end"
        :class="{ isActive }"
        :bordered="false"
        class="estimate-info"
        @change="() => (isActive = !isActive)"
    >
        <template #expandIcon>
            <ArrowIcon class="arrow" />
        </template>
        <a-collapse-panel key="estimate-info" :collapsible="isCollapsible ? '' : 'disabled'">
            <template #header>
                <div class="top-block">
                    <ServiceIcon v-if="service && !loading && mainFee.fromAmount" :icon="service.icon" :name="service.name" />

                    <template v-if="loading">
                        <a-skeleton-avatar active size="small" class="icon-skeleton" />
                        <a-skeleton-input active size="small" class="skeleton" />
                    </template>

                    <template v-else>
                        <EstimateStats v-if="mainFee.fromAmount != 0 && !error" v-bind="mainFee" />
                        <div v-else class="title">{{ title }}:</div>
                    </template>

                    <div v-if="error && !loading" class="error">
                        <p v-if="error.length <= MAX_LENGTH">
                            {{ error }}
                        </p>

                        <a-tooltip v-else>
                            <template #title>
                                {{ error }}
                            </template>

                            {{ error.slice(0, MAX_LENGTH) + '...' }}
                        </a-tooltip>
                    </div>
                </div>
            </template>

            <template v-if="loading">
                <a-skeleton-input active size="small" class="skeleton" />
            </template>
            <div v-else-if="fees.length" class="fees">
                <EstimateStats v-for="fee in fees" :key="fee" v-bind="fee" />
            </div>
        </a-collapse-panel>
    </a-collapse>
</template>
<script>
import { computed, ref } from 'vue';

import EstimateStats from './EstimateStats.vue';
import ServiceIcon from './ServiceIcon.vue';

import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

export default {
    name: 'EstimateInfo',
    props: {
        service: {
            type: Object,
            default: () => null,
        },

        title: {
            type: String,
            default: 'Receive',
        },

        loading: {
            type: Boolean,
            default: false,
        },

        mainFee: {
            type: Object,
            default: () => {
                return {
                    title: '',
                    fromAmount: '',
                    toAmount: '',
                    fromSymbol: '',
                    toSymbol: '',
                    symbolBetween: '',
                };
            },
        },

        fees: {
            type: Array,
            default: () => [],
        },

        error: {
            type: String,
            default: '',
        },
    },
    components: { EstimateStats, ServiceIcon, ArrowIcon },
    setup(props) {
        const MAX_LENGTH = 55;
        const isActive = ref(false);

        const isCollapsible = computed(() => {
            const { fees } = props;

            if (!fees.length) {
                return false;
            }

            const [fee] = fees;

            if (fee.fromAmount == 0) {
                return false;
            }

            return true;
        });

        return {
            isActive,
            isCollapsible,

            MAX_LENGTH,
        };
    },
};
</script>

<style lang="scss" scoped>
.estimate-info {
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
        display: flex;
        align-items: center;
        justify-content: flex-start;

        .title {
            font-weight: 400;
            color: var(--#{$prefix}accordion-label-color);
            margin-right: 10px;
        }

        .error {
            font-weight: 500;
            color: var(--#{$prefix}warning);
        }
    }

    svg.arrow {
        cursor: pointer;
        fill: var(--#{$prefix}select-icon-color);
        @include animateEasy;
    }

    .fees {
        margin-top: -16px;
    }
}
.isActive {
    .arrow {
        transform: rotate(180deg) !important;
    }
}
</style>
