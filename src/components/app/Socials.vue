<template>
    <div class="socials">
        <div class="socials__item apple">
            <appleSvg />
        </div>
        <div class="socials__item android">
            <androidSvg />
        </div>
    </div>
</template>
<script>
import appleSvg from '@/assets/icons/socials/apple.svg';
import androidSvg from '@/assets/icons/socials/android.svg';

export default {
    name: 'Socials',
    components: {
        appleSvg,
        androidSvg,
    },
};
</script>
<style lang="scss" scoped>
.socials {
    display: flex;
    align-items: center;
    justify-content: space-between;
    &__item {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 87px;
        height: 46px;
        border: 1px solid var(--#{$prefix}trout);
        border-radius: 8px;
        cursor: pointer;

        svg {
            fill: var(--#{$prefix}brightGreen);
        }
    }
}
</style>
