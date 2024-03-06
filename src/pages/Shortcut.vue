<template>
    <div>
        <ShortcutInfoLarge />
        <ShortcutList />
    </div>
</template>

<script>
import ShortcutList from '@/components/shortcuts/Shortcuts';
import ShortcutInfoLarge from '@/components/shortcuts/ShortcutInfoLarge.vue';

export default {
    name: 'Shortcuts',
    components: {
        ShortcutList,
        ShortcutInfoLarge
    },
    setup() {},
};
</script>
