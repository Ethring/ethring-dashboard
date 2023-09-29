<template>
    <div class="help">
        <ThemeSwitcher class="head__switcher" />
    </div>
</template>
<script>
import ThemeSwitcher from '@/components/app/ThemeSwitcher';

export default {
    name: 'Help',
    components: {
        ThemeSwitcher,
    },
};
</script>
<style lang="scss" scoped>
.help {
    display: flex;
    align-items: center;
}
</style>
