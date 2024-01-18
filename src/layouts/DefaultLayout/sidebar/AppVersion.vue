<template>
    <a-tag class="app-version" :bordered="false"> v{{ lastVersion }} </a-tag>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'AppVersion',
    setup() {
        const store = useStore();

        return {
            lastVersion: computed(() => store.getters['app/lastVersion']),
        };
    },
};
</script>
<style lang="scss" scoped>
.app-version {
    color: var(--#{$prefix}sidebar-text);
    background-color: transparent;
}
</style>
