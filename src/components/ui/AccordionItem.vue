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
    @include pageFlexRow;
    margin: 8px 0;

    &__label {
        color: var(--#{$prefix}accordion-label-color);
        font-size: var(--#{$prefix}default-fs);
        font-weight: 400;
    }

    &__value {
        @include pageFlexRow;

        font-size: var(--#{$prefix}default-fs);
        font-weight: 600;
        color: var(--#{$prefix}primary-text);

        margin-left: 6px;
    }
}
</style>
