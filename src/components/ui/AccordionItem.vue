<template>
    <div class="accordion-item">
        <div class="accordion-item__label">
            {{ label }}
        </div>
        <div class="accordion-item__value">
            <slot></slot>
        </div>
    </div>
</template>
<script>
export default {
    name: 'AccordionItem',
    props: {
        label: {
            type: String,
            default: 'Label',
        },
        value: {
            type: String,
            default: 'Value',
        },
    },
    setup() {},
};
</script>
<style lang="scss" scoped>
.accordion-item {
    display: flex;
    align-items: center;

    &__label {
        color: var(--#{$prefix}mineralGreen);
        font-size: var(--#{$prefix}default-fs);
        font-family: 'Poppins_Regular';
    }

    &__value {
        display: flex;
        align-items: center;
        font-size: var(--#{$prefix}default-fs);
        font-family: 'Poppins_SemiBold';
        color: var(--#{$prefix}ebonyClay);
        margin-left: 6px;
    }
}
</style>
