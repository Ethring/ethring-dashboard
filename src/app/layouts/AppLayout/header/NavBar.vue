<template>
    <a-layout-header class="header-layout" :class="{ scroll: isScrolled }">
        <div class="nav-bar-container">
            <div class="nav-bar-row">
                <div class="nav-bar-row__left">
                    <div class="nav-bar-logo-menu">
                        <SidebarLogo class="nav-bar-logo" />
                        <span>Ethring</span>
                    </div>

                    <div class="nav-bar-menu">
                        <router-link
                            v-for="menuItem in menu"
                            :key="menuItem.title"
                            class="nav-bar-menu__item"
                            :class="{
                                'nav-bar-menu__item--disabled': menuItem.isDisabled,
                                'nav-bar-menu__item--active': menuItem.to === route.path,
                            }"
                            :to="!menuItem.isDisabled ? menuItem.to : ''"
                        >
                            <component :is="menuItem.icon" :class="menuItem.iconClass" class="nav-bar-menu__item-icon" />
                            <span class="nav-bar-menu__item-title">
                                {{ menuItem.title }}
                            </span>
                        </router-link>

                        <!-- <router-link class="nav-bar-menu__item" to="/restake">
                            <RestakeIcon class="nav-bar-menu__item-icon stroke-icons" />
                            <span class="nav-bar-menu__item-title">Restake</span>
                        </router-link>

                        <div class="nav-bar-menu__item">
                            <ProtocolsIcon class="nav-bar-menu__item-icon stroke-icons" />
                            <span class="nav-bar-menu__item-title">Protocols</span>
                        </div>

                        <div class="nav-bar-menu__item">
                            <ExploreIcon class="nav-bar-menu__item-icon" />
                            <span class="nav-bar-menu__item-title">Explore</span>
                        </div>

                        <div class="nav-bar-menu__item">
                            <TransactionsIcon class="nav-bar-menu__item-icon" />
                            <span class="nav-bar-menu__item-title">Transactions</span>
                        </div> -->
                    </div>
                </div>
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
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import Adapter from '@/core/wallet-adapter/UI/Adapter.vue';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import ShoppingCart from '@/assets/icons/dashboard/shopping-cart.svg';

import SidebarLogo from '@/assets/icons/sidebar/sidebar-logo.svg';
import DashboardIcon from '@/assets/icons/sidebar/dashboard.svg';
import RestakeIcon from '@/assets/icons/sidebar/restake.svg';
import ProtocolsIcon from '@/assets/icons/sidebar/protocols.svg';
import ExploreIcon from '@/assets/icons/sidebar/explore.svg';
import TransactionsIcon from '@/assets/icons/sidebar/transactions.svg';

export default {
    name: 'NavBar',
    components: {
        Adapter,
        ShoppingCart,
        SidebarLogo,
        DashboardIcon,
        RestakeIcon,
        ProtocolsIcon,
        ExploreIcon,
        TransactionsIcon,
    },
    setup() {
        const store = useStore();
        const { walletAccount } = useAdapter();
        const route = useRoute();

        const menu = [
            {
                title: 'Dashboard',
                icon: DashboardIcon,
                iconClass: '',
                to: '/dashboard',
                isDisabled: false,
            },
            {
                title: 'Earn',
                icon: RestakeIcon,
                iconClass: 'stroke-icons',
                to: '/restake',
                isDisabled: false,
            },
            {
                title: 'Protocols',
                icon: ProtocolsIcon,
                iconClass: 'stroke-icons',
                to: '/protocols',
                isDisabled: true,
            },
            {
                title: 'Explore',
                icon: ExploreIcon,
                iconClass: '',
                to: '/explore',
                isDisabled: true,
            },
            {
                title: 'Transactions',
                icon: TransactionsIcon,
                iconClass: '',
                to: '/transactions',
                isDisabled: true,
            },
        ];

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
            menu,

            route,

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
