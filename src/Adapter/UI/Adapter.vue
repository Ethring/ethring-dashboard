<template>
    <div class="wallet-adapter-container" v-click-away="() => closeDropdown()">
        <AccountCenter v-if="walletAddress" @toggle-dropdown="toggleDropdown" @close-dropdown="closeDropdown" />
        <NotConnected v-else @toggle-dropdown="toggleDropdown" @close-dropdown="closeDropdown" />
        <AdapterDropdown v-if="showDropdown" @close-dropdown="closeDropdown" />
    </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import NotConnected from '@/Adapter/UI/Entities/NotConnected';

import AdapterDropdown from '@/Adapter/UI/Widgets/AdapterDropdown';
import AccountCenter from '@/Adapter/UI/Widgets/AccountCenter';

import { ECOSYSTEMS } from '@/Adapter/config';

export default {
    name: 'Adapter',
    components: {
        NotConnected,
        AdapterDropdown,
        AccountCenter,
    },
    setup() {
        const store = useStore();

        const showDropdown = ref(false);

        const { walletAddress } = useAdapter(store);

        const toggleDropdown = () => (showDropdown.value = !showDropdown.value);

        const closeDropdown = () => (showDropdown.value = false);

        return {
            ECOSYSTEMS,
            walletAddress,
            showDropdown,

            toggleDropdown,
            closeDropdown,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-adapter-container {
    position: relative;

    max-width: 350px;
    width: 100%;
}
</style>
