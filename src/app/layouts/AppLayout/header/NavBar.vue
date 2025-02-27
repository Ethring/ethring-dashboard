<template>
    <a-layout-header class="header-layout" :class="{ scroll: isScrolled }">
        <div class="nav-bar-container">
            <div class="nav-bar-row">
                <div class="nav-bar-row__left"></div>
                <div class="nav-bar-row__right">
                    <div
                        class="nav-bar-row__right__operation-bag operation-bag-trigger"
                        :class="{
                            'operation-bag-trigger--disabled': !walletAccount,
                        }"
                        @click="onClickBagTrigger"
                    >
                        <ShoppingCart class="operation-bag-icon" />
                        <div class="operations-count">
                            <a-badge
                                show-zero
                                :count="depositOperationsCount"
                                class="operations-count-badge operations-count-badge--deposit"
                            />
                            <a-badge
                                show-zero
                                :count="withdrawOperationsCount"
                                class="operations-count-badge operations-count-badge--withdraw"
                            />
                        </div>
                    </div>
                    <div class="divider"></div>
                    <Adapter />
                </div>
            </div>
        </div>
    </a-layout-header>
</template>
<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useStore } from 'vuex';

import Adapter from '@/core/wallet-adapter/UI/Adapter.vue';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import ShoppingCart from '@/assets/icons/dashboard/shopping-cart.svg';

export default {
    name: 'NavBar',
    components: {
        Adapter,
        ShoppingCart,
    },
    setup() {
        const store = useStore();
        const { walletAccount } = useAdapter();

        const isScrolled = ref(false);

        const handleScroll = () => (isScrolled.value = window.scrollY > 0);

        const onClickBagTrigger = () => {
            if (!walletAccount.value) return;
            store.dispatch('operationBag/setIsOpen', true);
        };

        const operationsCount = computed(() => store.getters['operationBag/getOperationsCount']);
        const depositOperationsCount = computed(() => store.getters['operationBag/getDepositOperationsCount']);
        const withdrawOperationsCount = computed(() => store.getters['operationBag/getWithdrawOperationsCount']);

        onMounted(() => {
            window.addEventListener('scroll', handleScroll);
        });

        onBeforeUnmount(() => {
            window.removeEventListener('scroll', handleScroll);
        });

        return {
            isScrolled,
            onClickBagTrigger,
            walletAccount,

            operationsCount,
            depositOperationsCount,
            withdrawOperationsCount,
        };
    },
};
</script>
