<template lang="">
    <div v-if="JSON.stringify(chainWithAddress) !== '{}'" class="chain-items">
        <div v-for="record in chainRecords" :key="record" class="chain-item">
            <ChainRecord :chain="record" :address="chainWithAddress[record.net]?.address" :chains="chainList" />
        </div>
    </div>
</template>
<script>
import ChainRecord from '@/Adapter/UI/Entities/ChainRecord';

export default {
    name: 'ChainWithAddress',
    components: {
        ChainRecord,
    },
    props: {
        chainWithAddress: {
            type: Object,
            required: true,
        },
        chainList: {
            type: Array,
            required: true,
        },
        chainRecords: {
            type: Array,
            required: true,
        },
    },
};
</script>
<style lang="scss" scoped></style>
