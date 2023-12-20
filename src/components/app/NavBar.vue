<template>
    <div class="nav-bar-container">
        <div class="nav-bar-row">
            <Help />
            <Adapter />
        </div>
    </div>
</template>
<script>
import Help from './Help';
import Adapter from '@/Adapter/UI/Adapter';

export default {
    name: 'NavBar',
    components: {
        Help,
        Adapter,
    },
};
</script>
<style lang="scss" scoped>
.nav-bar {
    &-container {
        padding: 20px 0;
        background-color: var(--#{$prefix}nav-bar-bg-color);
    }

    &-row {
        @include pageFlexRow;
        justify-content: space-between;
    }
}
</style>
