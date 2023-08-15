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
        position: fixed;

        top: 0;
        left: 260px;
        right: 0;

        z-index: 100;

        padding: 40px 0 20px;

        background-color: #fff;
        margin-right: auto;
        margin-left: auto;
    }

    &-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 75%;
        margin: 0 auto;
    }
}
</style>
