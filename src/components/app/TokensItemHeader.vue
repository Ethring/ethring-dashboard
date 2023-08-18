<template>
    <div class="tokens__item-header">
        <div class="name">{{ item.name }}</div>
        <Button :title="!showBalance ? '****' : '$' + prettyNumber(item.totalSumUSD)" />
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import Button from '@/components/ui/Button';

import { prettyNumber } from '@/helpers/prettyNumber';

export default {
    name: 'TokensItemHeader',
    props: {
        item: {
            required: true,
        },
    },
    components: {
        Button,
    },
    setup() {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        return {
            showBalance,
            prettyNumber,
        };
    },
};
</script>
<style lang="scss" scoped>
.tokens__item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    min-height: 73px;
    margin-bottom: 5px;
    border-bottom: 1px dashed var(--#{$prefix}geyser);
    cursor: pointer;

    .balance {
        width: 88px;
        height: 40px;

        font-size: var(--#{$prefix}default-fs);
        font-family: 'Poppins_SemiBold';
        line-height: 40px;
        text-align: center;

        border-radius: 8px;
        border: 1px solid var(--#{$prefix}black);
    }

    .name {
        font-size: var(--#{$prefix}h6-fs);
        font-family: 'Poppins_SemiBold';
        color: var(--#{$prefix}black);
        text-transform: uppercase;
    }
}
</style>
