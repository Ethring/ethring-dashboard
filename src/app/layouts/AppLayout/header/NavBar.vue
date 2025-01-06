<template>
    <a-layout-header class="header-layout" :class="{ scroll: isScrolled }">
        <div class="nav-bar-container">
            <div class="nav-bar-row">
                <div class="nav-bar-row__left"></div>
                <div class="nav-bar-row__right">
                    <a-badge :count="operationsCount">
                        <ShoppingCartOutlined v-if="walletAccount" class="operation-bag-trigger" @click="onClickBagTrigger" />
                    </a-badge>
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

import { ShoppingCartOutlined } from '@ant-design/icons-vue';

export default {
    name: 'NavBar',
    components: {
        Adapter,
        ShoppingCartOutlined,
    },
    setup() {
        const store = useStore();
        const { walletAccount } = useAdapter();

        const isScrolled = ref(false);

        const handleScroll = () => (isScrolled.value = window.scrollY > 0);

        const onClickBagTrigger = () => store.dispatch('operationBag/setIsOpen', true);

        const operationsCount = computed(() => store.getters['operationBag/getOperationsCount']);

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
        };
    },
};
</script>
