<template>
    <div class="chain-record">
        <div class="chain-record__logo-container">
            <a-image :preview="false" :alt="chain.name || 'chain-logo'" :src="chain.logo" />
        </div>
        <div class="chain-info">
            <div class="chain-record__name">
                {{ chain.name }}
            </div>
        </div>
    </div>
</template>
<script>
export default {
    name: 'ChainRecord',
    props: {
        chain: {
            type: Object,
            required: true,
        },
    },
};
</script>
<style lang="scss" scoped>
.chain {
    &-record {
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease-in-out;

        &__name {
            font-size: 14px;
            font-weight: 500;
            color: var(--#{$prefix}primary-text);
        }

        &__logo-container {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            overflow: hidden;
            margin-right: 10px;

            display: flex;
            align-items: center;
            justify-content: center;

            img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
        }
    }
}
</style>
