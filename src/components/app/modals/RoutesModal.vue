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
                        <div class="routes-modal__row">
                            Time: ~
                            <h4>{{ item.estimateTime }}s</h4>
                            Fee: $
                            <h4>{{ prettyNumberTooltip(item.estimateFeeUsd, 4) }}</h4>
                        </div>
                    </div>
                    <div class="routes-modal__output">
                        <p>Output</p>
                        <div class="routes-modal__row">
                            <h3>
                                {{ prettyNumberTooltip(item.toTokenAmount, 4) }}
                                <span>{{ item.routes[item.routes.length - 1]?.toToken?.code }}</span>
                            </h3>
                            <h4>/</h4>
                            <h3 class="blue-text"><span>$</span> {{ prettyNumberTooltip(item.toAmountUsd, 2) }}</h3>
                        </div>
                    </div>
                </div>
                <Button
                    xl
                    :loading="isLoading"
                    :disabled="!selectedRoute"
                    :title="$t('tokenOperations.confirm')"
                    class="routes-modal__btn"
                    @click="confirm"
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
        background-color: #f4f6ff;
        padding: 16px;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        border: 2px solid #f4f6ff;
        cursor: pointer;
        transition: 0.5s;
    }
    &__active-item {
        border: 2px solid #364de8;
        background-color: #e7ecff;
    }
    &__row {
        display: flex;
        align-items: center;
    }
    &__output {
        text-align: right;
        margin-top: 8px;
        p {
            color: #486060;
            font-size: 14px;
            margin: 0;
        }
        h3 {
            font-weight: 700;
            font-size: 18px;
            color: #494c56;
            margin: 0;
            span {
                color: #1c1f2c;
                font-weight: 400;
            }
        }
        h4 {
            font-size: 20px;
            margin: 0 6px;
            color: #a0b3c3;
        }
        .blue-text {
            color: #00839f;
        }
    }
    &__btn {
        height: 64px;
        width: 100%;
    }

    .routes-service {
        &__name {
            font-size: 18px;
            margin: auto;
            margin-left: 8px;
            font-weight: 700;
            color: $colorDarkPanel;
        }
        &__icon {
            border-radius: 50%;
            width: 32px;
            padding: 4px;
            height: 32px;
            border: 1px solid #364de8;
            img {
                width: 100%;
                border-radius: 50%;
            }
        }
        div {
            color: #486060;
            h4 {
                margin: 0 10px 0 2px;
                font-weight: 700;
            }
        }
        h1 {
            font-weight: 700;
            margin: 3px;
        }
        &__status {
            border-radius: 20px;
            font-size: 14px;
            font-weight: 400;
            color: $colorBlack;
            padding: 1px 10px;
            margin: 2px 0 0 6px;
        }
        .low-fee {
            background-color: $themeGreen;
        }
        .best-return {
            background-color: #3fdfae;
        }
        .fastest {
            background-color: #02e7f6;
        }
    }
}
</style>
