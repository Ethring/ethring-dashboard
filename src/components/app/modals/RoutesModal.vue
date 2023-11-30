<template>
    <teleport to="body">
        <Modal :title="$t('superSwap.selectRoutes')" @close="$emit('close')">
            <div class="routes-modal">
                <div
                    v-for="(item, i) in routes"
                    @click="() => setActiveRoute(item)"
                    class="routes-modal__item"
                    :class="selectedRoute === item ? 'routes-modal__active-item' : ''"
                    :key="i"
                >
                    <div class="routes-service">
                        <div class="routes-modal__row">
                            <div class="routes-modal__row" v-for="(elem, j) in item.routes" :key="j">
                                <div class="routes-service__icon">
                                    <img :src="elem.service?.icon" alt="service-logo" />
                                </div>
                                <h3 class="routes-service__name">{{ elem.service?.name }}</h3>
                                <h1 v-if="j != item.routes.length - 1">-</h1>
                            </div>
                            <p class="routes-service__status" v-for="(status, k) in getStatus(item)" :class="status.class" :key="k">
                                {{ status.value }}
                            </p>
                        </div>
                        <div class="routes-modal__row routes-time">
                            {{ $t('superSwap.time') }}: ~
                            <h4 class="mr-20">{{ item.estimateTime }}s</h4>
                            {{ $t('superSwap.fee') }}:
                            <h4>
                                <NumberTooltip :value="item.estimateFeeUsd" decimals="3" />
                            </h4>
                            $
                        </div>
                    </div>
                    <div class="routes-modal__output">
                        <h3>
                            <NumberTooltip :value="item.toTokenAmount" decimals="3" />
                            <span>{{ item.routes[item.routes.length - 1]?.toToken?.symbol }}</span>
                        </h3>
                        <h3 class="blue-text"><NumberTooltip :value="item.toAmountUsd" /><span>$</span></h3>
                    </div>
                </div>
                <Button
                    :loading="isLoading"
                    :title="$t('tokenOperations.confirm')"
                    class="routes-modal__btn"
                    @click="confirm"
                    size="large"
                />
            </div>
        </Modal>
    </teleport>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import Modal from '@/components/app/Modal';
import Button from '@/components/ui/Button';
import NumberTooltip from '@/components/ui/NumberTooltip';

// import useAdapter from '@/Adapter/compositions/useAdapter';

export default {
    name: 'RoutesModal',
    components: {
        Modal,
        Button,
        NumberTooltip,
    },
    emits: ['close'],
    setup() {
        const store = useStore();
        const routeInfo = computed(() => store.getters['swap/bestRoute']);

        const selectedRoute = ref(routeInfo.value.bestRoute);
        const isLoading = ref(false);

        const routes = computed(() => {
            return [routeInfo.value.bestRoute, ...routeInfo.value.otherRoutes];
        });

        const confirm = async () => {
            if (selectedRoute.value === routeInfo.value.bestRoute) {
                store.dispatch('swap/setShowRoutes', false);
                return;
            }

            isLoading.value = true;

            const data = {
                bestRoute: selectedRoute.value,
                otherRoutes: routeInfo.value.otherRoutes.map((elem) => {
                    if (elem === selectedRoute.value) {
                        elem = routeInfo.value.bestRoute;
                    }
                    return elem;
                }),
            };

            store.dispatch('swap/setBestRoute', data);
            isLoading.value = false;
            store.dispatch('swap/setShowRoutes', false);
        };

        const setActiveRoute = (item) => {
            if (selectedRoute.value == item) {
                selectedRoute.value = null;
                return;
            }
            selectedRoute.value = item;
        };

        const getStatus = (item) => {
            let isLowFee = true;
            let isBestReturn = true;
            let isFastest = true;
            let routes = routeInfo.value.otherRoutes.concat(routeInfo.value.bestRoute);
            routes
                .filter((el) => el !== item)
                ?.forEach((elem) => {
                    if (elem.estimateFeeUsd <= item.estimateFeeUsd) {
                        isLowFee = false;
                    }
                    if (elem.estimateTime <= item.estimateTime) {
                        isFastest = false;
                    }
                    if (elem.toTokenAmount >= item.toTokenAmount) {
                        isBestReturn = false;
                    }
                });
            let statusList = [
                { status: isLowFee, value: 'Low fee', class: 'low-fee' },
                { status: isBestReturn, value: 'Best return', class: 'best-return' },
                { status: isFastest, value: 'Fastest', class: 'fastest' },
            ];
            return statusList.filter((elem) => elem.status);
        };

        return {
            routes,
            routeInfo,
            selectedRoute,
            isLoading,

            confirm,
            setActiveRoute,
            getStatus,
        };
    },
};
</script>
<style lang="scss" scoped>
.routes-modal {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    margin-top: 6px;

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
        display: flex;
        margin: 0;
        align-items: center;
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
                margin-left: 3px;
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
