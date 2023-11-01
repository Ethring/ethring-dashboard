<template>
    <div class="login-page"></div>
</template>
<script>
export default {
    name: 'Login',
    setup() {},
};
</script>
<style lang="scss" scoped>
.login-page {
    @include pageFlexRow;
    justify-content: center;

    width: 100%;
    height: 100vh;

    font-size: 100px;
    font-weight: 700;
}
</style>
