<template>
    <a-tag class="app-version" :bordered="false"> v{{ lastVersion.replaceAll('"', '') }} </a-tag>
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
    // color: var(--#{$prefix}sidebar-text) !important;
    color: var(--#{$prefix}sidebar-text); // TODO: Remove this line after fixing the color
    background-color: transparent;
    font-family: Poppins, sans-serif !important;
    width: 48px;
    max-width: 48px;
    min-width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
