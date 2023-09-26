<template>
    <div class="logo">
        <div class="logo__round">
            <logoSvg />
        </div>
    </div>
</template>
<script>
import logoSvg from '@/assets/icons/app/logo.svg';

export default {
    name: 'Logo',
    components: {
        logoSvg,
    },
};
</script>
<style lang="scss" scoped>
.logo {
    display: flex;
    align-items: center;
    cursor: pointer;

    &__round {
        margin-right: 10px;

        svg {
            fill: var(--#{$prefix}white);
        }
    }
}
</style>
