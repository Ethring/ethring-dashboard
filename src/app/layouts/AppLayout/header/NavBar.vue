<template>
    <a-layout-header class="header-layout" :class="{ scroll: isScrolled }">
        <div class="nav-bar-container">
            <div class="nav-bar-row">
                <div class="nav-bar-row__left"></div>
                <div class="nav-bar-row__right">
                    <ShoppingCartOutlined v-if="walletAccount" class="operation-bag-trigger" @click="onClickBagTrigger" />
                    <Adapter />
                </div>
            </div>
        </div>
    </a-layout-header>
</template>
<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
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
        };
    },
};
</script>
