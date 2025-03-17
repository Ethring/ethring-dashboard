<template>
    <div class="operation-bag__header">
        <div class="operation-bag__header__title">
            <span> Bag </span>
        </div>
        <div class="operation-bag__header__clear" @click="onClickClearAllOperations">
            <span> Clear All </span>
        </div>
    </div>
</template>
<script>
import { useStore } from 'vuex';
export default {
    name: 'OperationBagHeader',
    props: {
        operationType: {
            type: String,
            default: 'deposit',
        },
    },
    setup(props) {
        const store = useStore();

        const onClickClearAllOperations = () => store.dispatch('operationBag/clearAllOperations', props.operationType);

        return {
            onClickClearAllOperations,
        };
    },
};
</script>
