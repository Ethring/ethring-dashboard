<template>
    <div class="swap-not-working">Swap under maintenance</div>
</template>
<script>
export default {
    name: 'SwapNotWorking',
};
</script>
<style lang="scss" scoped>
.swap-not-working {
    font-weight: 600;
    font-size: var(--#{$prefix}h1-fs);
    color: var(--#{$prefix}black);
    height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
