<template>
    <teleport to="body">
        <Modal :title="$t('superSwap.selectRoutes')" @close="$emit('close')">
            <div class="routes-modal">
                <div
                    v-for="(item, i) in routeInfo.otherRoutes"
                    @click="() => setActiveRoute(item)"
                    class="routes-modal__item"
                    :class="selectedRoute === item ? 'routes-modal__active-item' : ''"
                    :key="i"
                >
                    <div class="routes-service">
                        <div class="routes-modal__row">
                            <div class="routes-modal__row" v-for="(elem, j) in item.routes" :key="j">
                                <div class="routes-service__icon">
                                    <img :src="elem.service?.icon" />
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
                            <h4>{{ item.estimateTime }}s</h4>
                            {{ $t('superSwap.fee') }}: $
                            <h4>{{ prettyNumberTooltip(item.estimateFeeUsd, 4) }}</h4>
                        </div>
                    </div>
                    <div class="routes-modal__output">
                        <p>{{ $t('superSwap.output') }}</p>
                        <div class="routes-modal__row">
                            <h3>
                                {{ prettyNumberTooltip(item.toTokenAmount, 4) }}
                                <span>{{ item.routes[item.routes.length - 1]?.toToken?.symbol }}</span>
                            </h3>
                            <h4>/</h4>
                            <h3 class="blue-text"><span>$</span> {{ prettyNumberTooltip(item.toAmountUsd, 2) }}</h3>
                        </div>
                    </div>
                </div>
                <Button
                    :loading="isLoading"
                    :disabled="!selectedRoute"
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

import { prettyNumberTooltip } from '@/helpers/prettyNumber';
import { checkAllowance } from '@/modules/SuperSwap/baseScript';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';

export default {
    name: 'RoutesModal',
    components: {
        Modal,
        Button,
    },
    emits: ['close'],
    setup() {
        const store = useStore();
        const selectedRoute = ref(null);
        const isLoading = ref(false);
        const { walletAddress } = useWeb3Onboard();

        const routeInfo = computed(() => store.getters['swap/bestRoute']);

        const confirm = async () => {
            isLoading.value = true;
            for (let i = 0; i < selectedRoute.value.routes.length; i++) {
                selectedRoute.value.routes[i].needApprove = await checkAllowance(
                    selectedRoute.value.routes[i].net,
                    selectedRoute.value.routes[i].fromToken?.address,
                    walletAddress.value,
                    selectedRoute.value.routes[i].fromTokenAmount,
                    selectedRoute.value.routes[i].fromToken?.decimals,
                    selectedRoute.value.routes[i].service
                );
            }
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
            routeInfo,
            selectedRoute,
            isLoading,
            prettyNumberTooltip,
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
    padding: 8px 0;

    &__item {
        border-radius: 20px;
        background-color: var(--#{$prefix}modal-block-bg-color);
        padding: 16px;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        border: 2px solid var(--#{$prefix}modal-block-bg-color);
        cursor: pointer;
        transition: 0.5s;
    }
    &__active-item {
        border: 2px solid var(--#{$prefix}icon-border);
        background-color: var(--#{$prefix}modal-active-block-bg-color);
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
            margin: 0;
        }
        h3 {
            font-weight: 600;
            font-size: var(--#{$prefix}h6-fs);
            color: var(--#{$prefix}mute-text);
            margin: 0;
            span {
                color: var(--#{$prefix}primary);
                font-weight: 400;
            }
        }
        h4 {
            font-size: var(--#{$prefix}h5-fs);
            margin: 0 6px;
            color: var(--#{$prefix}modal-block-text);
        }
        .blue-text {
            color: var(--#{$prefix}modal-item-text);
        }
    }
    &__btn {
        height: 64px;
        width: 100%;
    }

    .routes-service {
        margin-top: -8px;
        &__name {
            font-size: var(--#{$prefix}h6-fs);
            margin: 0;
            margin-left: 8px;
            font-weight: 600;
            color: var(--#{$prefix}primary);
        }
        &__icon {
            border-radius: 50%;
            width: 32px;
            padding: 3px 4px;
            height: 32px;
            border: 1px solid var(--#{$prefix}icon-border);
            img {
                width: 100%;
                border-radius: 50%;
            }
        }
        .routes-time {
            margin-top: 2px;
        }
        div {
            color: var(--#{$prefix}base-text);
            h4 {
                margin: 0 10px 0 2px;
                font-weight: 600;
            }
        }
        h1 {
            font-weight: 600;
            margin: 0px 3px;
        }
        &__status {
            border-radius: 20px;
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            color: var(--#{$prefix}black);
            padding: 1px 10px;
            margin: 2px 0 0 6px;
        }
        .low-fee {
            background-color: var(--#{$prefix}tag-03);
        }
        .best-return {
            background-color: var(--#{$prefix}icon-logo-bg-color);
        }
        .fastest {
            background-color: var(--#{$prefix}tag-02);
        }
    }
}
</style>
