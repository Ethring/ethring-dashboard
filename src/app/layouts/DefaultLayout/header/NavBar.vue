<template>
    <a-layout-header class="header-layout">
        <div class="nav-bar-container">
            <div class="nav-bar-row">
                <HelpBlock />
                <Adapter />
            </div>
        </div>
    </a-layout-header>
</template>
<script>
import Adapter from '@/core/wallet-adapter/UI/Adapter.vue';
import HelpBlock from '@/app/layouts/DefaultLayout/header/Help/HelpBlock.vue';

export default {
    name: 'NavBar',
    components: {
        HelpBlock,
        Adapter,
    },
};
</script>
