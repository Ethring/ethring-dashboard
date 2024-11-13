<template>
    <div class="shortcut-icon__container">
        <img v-if="shortcut.logoURI" :src="shortcut.logoURI" :alt="shortcut.name" class="shortcut-icon" />
        <ShortcutPlaceHolder v-else />
    </div>
</template>
<script>
import ShortcutPlaceHolder from '@/assets/icons/dashboard/shortcut.svg';

export default {
    name: 'ShortcutIcon',
    components: {
        ShortcutPlaceHolder,
    },
    props: {
        shortcut: {
            type: Object,
            required: true,
            default: () => ({}),
        },
    },
};
</script>
