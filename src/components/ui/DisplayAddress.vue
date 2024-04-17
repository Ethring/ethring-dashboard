<template>
    <a-tooltip v-if="address" placement="topLeft">
        <template #title>{{ address }}</template>
        {{ displayAddress }}
    </a-tooltip>
    <template v-else>
        {{ displayAddress }}
    </template>
</template>
<script>
export default {
    name: 'DisplayAddress',
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            MAX_LENGTH: 40,
        };
    },
    computed: {
        displayAddress() {
            if (this.address.length <= this.MAX_LENGTH) {
                return this.address;
            }

            return `${this.address.slice(0, 12)}...${this.address.slice(-6)}`;
        },
    },
};
</script>
<style lang=""></style>
