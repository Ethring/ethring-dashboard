<template>
    <div class="logo" @click="$router.push('/kit')">
        <div class="logo__round">
            <logoSvg />
        </div>
        <!-- <div class="logo__text">Z<span>O</span>M<span>E</span>T</div> -->
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

    &__text {
        font-size: var(--#{$prefix}h3-fs);
        font-family: 'Poppins_Light';
        color: var(--#{$prefix}white);

        span {
            color: var(--#{$prefix}sidebar-icon-color);
            font-family: 'Poppins_SemiBold';
        }
    }
}
</style>
