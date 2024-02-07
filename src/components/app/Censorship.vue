<template>
    <span class="censorship-block">
        <svg height="1em" :width="`${distance * 0.5}em`" style="border-radius: 0.25em; font-size: 1em">
            <template v-for="row in rows" :key="row">
                <template v-for="column in distance" :key="column">
                    <rect
                        :height="`${rectSize}em`"
                        :width="`${rectSize}em`"
                        :fill="getColor(row, column)"
                        :x="getXPosition(column - 1)"
                        :y="getYPosition(row - 1)"
                    ></rect>
                </template>
            </template>
        </svg>
    </span>
</template>
<script>
export default {
    name: 'Censorship',
    props: {
        distance: {
            type: Number,
            required: true,
            default: 5,
        },
    },
    data() {
        return {
            colors: [
                'var(--zmt-neutral-gray-200)',
                'var(--zmt-neutral-gray-100)',
                'var(--zmt-neutral-gray-200)',
                'var(--zmt-neutral-gray-400)',
                'var(--zmt-neutral-gray-100)',
                'var(--zmt-neutral-gray-300)',
            ],

            rectSize: 0.5,
            rectSpacing: 0.5,

            rows: 2,
        };
    },

    methods: {
        getHeight() {
            return this.rows * this.rectSpacing + 'em';
        },
        getXPosition(column) {
            return column * this.rectSpacing + 'em';
        },
        getYPosition(row) {
            return row * this.rectSpacing + 'em';
        },
        getColor(row, column) {
            const colorIndex = (row + column) % this.colors.length;
            return this.colors[colorIndex];
        },
    },
};
</script>

<style scoped lang="scss">
.censorship-block {
    height: inherit;
}
</style>
