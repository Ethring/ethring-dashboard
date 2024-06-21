<template>
    <div class="step-operation-icon">
        <div class="primary-icon">
            <component :is="operationType" />
        </div>
        <div class="secondary-icon icon">
            <TokenIcon :token="assetChain" width="16" height="16" />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

import SWAP from '@/assets/icons/operations/swap.svg';
import STAKE from '@/assets/icons/operations/stake.svg';
import BRIDGE from '@/assets/icons/operations/bridge.svg';
import DEX from '@/assets/icons/operations/bridge.svg';
import EXECUTE_MULTIPLE from '@/assets/icons/operations/nft.svg';
import MINT from '@/assets/icons/operations/nft.svg';
import DEPOSIT from '@/assets/icons/operations/deposit.svg';
import APPROVE from '@/assets/icons/operations/approve.svg';

import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

export default defineComponent({
    name: 'StepOp',
    components: {
        SWAP,
        DEX,
        BRIDGE,
        STAKE,
        EXECUTE_MULTIPLE,
        MINT,
        DEPOSIT,
        APPROVE,

        TokenIcon,
    },
    props: {
        operationType: {
            type: String,
            required: true,
        },
        assetChain: {
            type: Object,
            required: true,
        },
    },
});
</script>
