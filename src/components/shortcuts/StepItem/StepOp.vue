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
import SWAP from '@/assets/icons/operations/swap.svg';
import STAKE from '@/assets/icons/operations/stake.svg';
import BRIDGE from '@/assets/icons/operations/bridge.svg';
import EXECUTE_MULTIPLE from '@/assets/icons/operations/nft.svg';
import MINT from '@/assets/icons/operations/nft.svg';

import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

export default {
    name: 'StepOp',
    components: {
        SWAP,
        BRIDGE,
        STAKE,
        EXECUTE_MULTIPLE,
        MINT,
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
};
</script>
