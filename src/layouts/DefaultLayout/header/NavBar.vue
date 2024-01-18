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
import Adapter from '@/Adapter/UI/Adapter';
import HelpBlock from './Help/HelpBlock.vue';

export default {
    name: 'NavBar',
    components: {
        HelpBlock,
        Adapter,
    },
};
</script>
