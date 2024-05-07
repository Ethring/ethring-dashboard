<template>
    <a-layout-header class="header-layout" :class="{ scroll: isScrolled }">
        <div class="nav-bar-container">
            <div class="nav-bar-row">
                <HelpBlock />
                <Adapter />
            </div>
        </div>
    </a-layout-header>
</template>
<script>
import { onMounted, onBeforeUnmount, ref } from 'vue';

import Adapter from '@/Adapter/UI/Adapter';
import HelpBlock from './Help/HelpBlock.vue';

export default {
    name: 'NavBar',
    components: {
        HelpBlock,
        Adapter,
    },
    setup() {
        const isScrolled = ref(false);

        const handleScroll = () => {
            isScrolled.value = window.scrollY > 0;
        };

        onMounted(() => {
            window.addEventListener('scroll', handleScroll);
        });

        onBeforeUnmount(() => {
            window.removeEventListener('scroll', handleScroll);
        });

        return {
            isScrolled,
        };
    },
};
</script>
