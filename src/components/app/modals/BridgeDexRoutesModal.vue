<template>
    <a-modal :open="isRoutesModalOpen" centered :footer="null" class="modal" :title="$t('superSwap.selectRoutes')" @cancel="closeModal">
        <div class="routes-modal">
            <div
                v-for="(item, i) in quoteRoutes"
                :key="i"
                class="routes-modal__item"
                :class="selected?.serviceId === item.serviceId ? 'routes-modal__active-item' : ''"
                @click="() => (selected = item)"
            >
                <div class="routes-service">
                    <div class="routes-modal__row">
                        <!-- <div class="routes-modal__row" v-for="(elem, j) in item.routes" :key="j" v-if="item.routes">
                            <div class="routes-service__icon">
                                <img :src="elem.service?.icon" alt="service-logo" />
                            </div>
                            <h3 class="routes-service__name">{{ elem }}</h3>
                             <h1 v-if="j != item.routes.length - 1">-</h1>
                        </div> -->
                        <div v-if="services[item.serviceId]" class="routes-modal__row">
                            <div class="routes-service__icon">
                                <ServiceIcon
                                    v-if="services[item.serviceId].icon"
                                    :icon="services[item.serviceId].icon"
                                    alt="service-logo"
                                    :show-title="false"
                                    :show-tooltip="false"
                                    :width="32"
                                    :height="32"
                                />
                            </div>
                            <h3 class="routes-service__name">{{ services[item.serviceId].name }}</h3>
                            <!-- <h1 v-if="j != item.routes.length - 1">-</h1> -->
                        </div>
                        <p v-for="(status, k) in getRouteStatus(item)" :key="k" class="routes-service__status" :class="status.class">
                            {{ status.value }}
                        </p>
                    </div>
                    <div v-if="item && item.estimateTime" class="routes-modal__row routes-time">
                        {{ $t('superSwap.time') }}: ~
                        <h4 class="mr-20">{{ item?.estimateTime }}s</h4>
                        {{ $t('superSwap.fee') }}:
                        <h4>
                            <Amount type="usd" decimals="6" :value="item.estimateFeeUsd" symbol="$" />
                        </h4>
                        $
                    </div>
                </div>
                <div class="routes-modal__output">
                    <h3>
                        <Amount type="currency" decimals="6" :value="item.toAmount" :symbol="selectedDstToken?.symbol" />
                    </h3>
                    <h3 v-if="selectedDstToken?.price" class="blue-text">
                        <Amount type="usd" decimals="6" :value="convert(item.toAmount, selectedDstToken?.price)" symbol="$" />
                    </h3>
                </div>
            </div>
            <UiButton
                :loading="isLoading"
                :title="$t('tokenOperations.confirm')"
                class="routes-modal__btn"
                size="large"
                @click="handleOnConfirm"
            />
        </div>
    </a-modal>
</template>
<script>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import UiButton from '@/components/ui/Button.vue';
import Amount from '@/components/app/Amount.vue';
import ServiceIcon from '@/components/ui/EstimatePanel/ServiceIcon.vue';

import { convertFeeToCurrency } from '@/shared/calculations/calculate-fee';
import BigNumber from 'bignumber.js';

export default {
    name: 'BridgeDexRoutesModal',
    components: {
        UiButton,
        Amount,
        ServiceIcon,
    },
    emits: ['close'],
    setup() {
        const store = useStore();
        const isLoading = ref(false);

        const selectedSrcToken = computed(() => store.getters['tokenOps/srcToken']);
        const selectedDstToken = computed(() => store.getters['tokenOps/dstToken']);

        const isRoutesModalOpen = computed(() => store.getters['app/modal']('routesModal'));

        const serviceType = computed(() => store.getters['bridgeDexAPI/getSelectedServiceType']);

        const quoteRoutes = computed(() => store.getters['bridgeDexAPI/getQuoteRouteList'](serviceType.value));
        const selectedRoute = computed(() => store.getters['bridgeDexAPI/getSelectedRoute'](serviceType.value));

        const services = computed(() => store.getters['bridgeDexAPI/getAllServicesHash']);

        const selected = ref(selectedRoute.value);

        const handleOnConfirm = async () => {
            await store.dispatch('bridgeDexAPI/setSelectedRoute', {
                serviceType: serviceType.value,
                value: selected.value,
            });

            return closeModal();
        };

        const getRouteStatus = (item) => {
            const ROUTE_STATUS = {
                LOW_FEE: 'Low fee',
                BEST_RETURN: 'Best return',
            };

            const ROUTE_STATUS_KEY = {
                [ROUTE_STATUS.LOW_FEE]: 'bestFee',
                [ROUTE_STATUS.BEST_RETURN]: 'bestReturn',
            };

            const status = {
                [ROUTE_STATUS.LOW_FEE]: {
                    class: 'low-fee',
                    value: 'Low fee',
                },
                [ROUTE_STATUS.BEST_RETURN]: {
                    class: 'best-return',
                    value: 'Best return',
                },
            };

            const statuses = [];

            if (item[ROUTE_STATUS_KEY[ROUTE_STATUS.LOW_FEE]]) statuses.push(status[ROUTE_STATUS.LOW_FEE]);

            if (item[ROUTE_STATUS_KEY[ROUTE_STATUS.BEST_RETURN]]) statuses.push(status[ROUTE_STATUS.BEST_RETURN]);

            return statuses;
        };

        const closeModal = () => {
            if (!isRoutesModalOpen.value) selectedRoute.value = null;

            return store.dispatch('app/toggleModal', 'routesModal');
        };

        const convert = (amount, price) => {
            const amountToUsd = convertFeeToCurrency(BigNumber(amount), price);
            return amountToUsd.toString();
        };

        watch(isRoutesModalOpen, () => {
            if (isRoutesModalOpen.value) selected.value = selectedRoute.value;
        });

        return {
            quoteRoutes,

            selectedSrcToken,
            selectedDstToken,

            selectedRoute,

            services,
            selected,

            isLoading,
            isRoutesModalOpen,

            closeModal,

            handleOnConfirm,
            getRouteStatus,
            convert,
        };
    },
};
</script>
<style lang="scss" scoped>
.routes-modal {
    @include pageFlexColumn;
    align-items: flex-start;
    margin-top: 6px;
    width: 100%;

    .mr-20 {
        margin-right: 20px !important;
    }

    &__item {
        @include pageFlexRow;
        justify-content: space-between;

        border-radius: 16px;
        padding: 12px 16px;
        width: 100%;
        height: 90px;
        margin-bottom: 16px;

        background-color: var(--#{$prefix}select-bg-color);
        border: 1px solid var(--#{$prefix}select-bg-color);

        cursor: pointer;
    }

    &__active-item {
        border: 1px solid var(--#{$prefix}banner-logo-color);
        background-color: var(--#{$prefix}icon-secondary-bg-color);
    }

    &__row {
        @include pageFlexRow;
        margin: 0;
    }

    &__output {
        text-align: right;
        margin-top: 2px;

        p {
            color: var(--#{$prefix}base-text);
            font-size: var(--#{$prefix}small-lg-fs);
            line-height: var(--#{$prefix}default-fs);

            margin: 0;
        }

        h3 {
            font-weight: 600;
            font-size: var(--#{$prefix}h6-fs);
            color: var(--#{$prefix}primary-text);

            margin: 0;

            span {
                color: var(--#{$prefix}mute-text);
                font-weight: 400;
            }
        }

        h4 {
            font-size: var(--#{$prefix}h5-fs);
            color: var(--#{$prefix}sub-text);

            margin: 0 6px;
        }

        .blue-text {
            color: var(--#{$prefix}theme-switcher-color);
            font-size: var(--#{$prefix}small-lg-fs);
            margin-top: 6px;
            font-weight: 700;

            span {
                color: var(--#{$prefix}theme-switcher-color);
            }
        }
    }

    &__btn {
        width: 100%;
    }

    .routes-service {
        &__name {
            font-size: var(--#{$prefix}h6-fs);
            margin: 0;
            margin-left: 8px;
            font-weight: 600;
            color: var(--#{$prefix}primary-text);
        }

        &__icon {
            @include pageFlexRow;
            justify-content: center;
            border-radius: 50%;
            width: 32px;
            height: 32px;

            img {
                width: 90%;
                border-radius: 50%;
            }
        }

        .routes-time {
            margin-top: 4px;

            font-size: var(--#{$prefix}small-lg-fs);

            h4 {
                color: var(--#{$prefix}secondary-text);
            }
        }
        div {
            color: var(--#{$prefix}base-text);

            h4 {
                margin: 0 2px;
                font-weight: 700;
            }
        }

        h1 {
            font-weight: 600;
            margin: 0px 3px;
        }

        &__status {
            border-radius: 24px;
            font-size: var(--#{$prefix}small-sm-fs);
            font-weight: 400;
            color: var(--#{$prefix}btn-text-color);
            padding: 4px 10px;
            margin: 2px 0 0 6px;
        }

        .best-return {
            background-color: var(--#{$prefix}tag-01);
        }

        .fastest {
            background-color: var(--#{$prefix}tag-02);
        }

        .low-fee {
            background-color: var(--#{$prefix}tag-03);
        }
    }
}
</style>
