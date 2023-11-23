<template>
    <a-collapse expand-icon-position="end" :bordered="false" class="estimate-info">
        <a-collapse-panel key="estimate-info" :collapsible="isCollapsible ? '' : 'disabled'">
            <template #header>
                <div class="top-block">
                    <ServiceIcon v-if="service" :icon="service.icon" :name="service.name" />

                    <template v-if="loading">
                        <a-skeleton-input active size="small" />
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
            <div v-if="fees.length" class="fees">
                <EstimateStats v-for="fee in fees" :key="fee" v-bind="fee" />
            </div>
        </a-collapse-panel>
    </a-collapse>
</template>
<script>
import { computed } from 'vue';

import ServiceIcon from './ServiceIcon.vue';
import EstimateStats from './EstimateStats.vue';

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
    components: { ServiceIcon, EstimateStats },
    setup(props) {
        const MAX_LENGTH = 55;

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
            isCollapsible,

            MAX_LENGTH,
        };
    },
};
</script>

<style lang="scss" scoped>
.estimate-info {
    margin-top: 20px;
    background-color: var(--#{$prefix}accordion-bg-color);
    border: 1px solid var(--#{$prefix}accordion-border-color);
    border-radius: 16px;

    .top-block {
        display: flex;
        align-items: center;
        justify-content: flex-start;

        .title {
            font-weight: 600;
            color: var(--#{$prefix}accordion-label-color);
            margin-right: 10px;
        }

        .error {
            font-weight: 600;
            color: var(--#{$prefix}warning);
        }
    }
    .fees {
        > div:not(:last-child) {
            margin-bottom: 10px;
        }
    }
}
</style>
