<template>
    <a-tooltip>
        <div class="service-icon">
            <img :src="icon" alt="icon" />
        </div>
        <template #title>
            {{ name }}
        </template>
    </a-tooltip>
</template>
<script>
export default {
    name: 'ServiceIcon',
    props: {
        name: {
            type: String,
            default: 'Service Name',
        },
        icon: {
            type: String,
            default: null,
        },
    },
};
</script>

<style lang="scss" scoped>
.service-icon {
    cursor: default;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: var(--#{$prefix}default-fs);
    color: var(--#{$prefix}primary-text);
    border-radius: 50%;
    background-color: var(--#{$prefix}primary-text);

    border: 1px solid rgba(0, 0, 0, 0.1);

    margin-right: 8px;

    img {
        width: 20px;
        height: 20px;
        object-fit: contain;
        border-radius: 50%;
    }
}
</style>
