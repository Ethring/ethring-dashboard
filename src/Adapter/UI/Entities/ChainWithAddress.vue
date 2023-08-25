<template lang="">
    <div v-if="JSON.stringify(chainWithAddress) !== '{}'">
        <div v-for="record in chainList" :key="record" class="chain-with-address">
            <ChainRecord :chain="record" />
            <div>
                {{ chainWithAddress[record.chain_id] }}
            </div>
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
    },
};
</script>
<style lang="scss" scoped>
.chain-with-address {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #d0d4f7;
}
</style>
