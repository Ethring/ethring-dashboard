<template>
    <a-card class="statistical-card">
        <a-statistic
            class="statistical-card__statistic"
            :title="title"
            :value="value"
            :precision="precision"
            :suffix="suffix"
            :value-style="valueStyle"
            style="margin-right: 50px"
        >
            <template #prefix>
                {{ prefix }}
            </template>
        </a-statistic>
    </a-card>
</template>
<script>
export default {
    name: 'StatisticalCard',
    props: {
        title: {
            type: String,
            default: '',
        },
        value: {
            type: [Number, String],
            default: 0,
        },
        precision: {
            type: Number,
            default: 2,
        },
        suffix: {
            type: String,
            default: '',
        },
        prefix: {
            type: String,
            default: '',
        },
        valueStyle: {
            type: Object,
            default: () => ({}),
        },
    },
};
</script>
