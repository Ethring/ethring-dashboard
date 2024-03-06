<template>
    <div>
        <div>{{ shortcut.name }}</div>
        <div>{{ shortcut.description }}</div>
    </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex';

export default {
    name: 'ShortcutDetails',
    setup() {
        const store = useStore();

        const shortcut = computed(() => store.getters['shortcuts/selectedShortcut']);

        return {
            shortcut
        }
    },
};
</script>
