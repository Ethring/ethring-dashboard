<template>
    <div class="switch-direction" :class="{ disabled, [icon]: icon }" @click="onClickSwitch">
        <component :is="icon" />
    </div>
</template>
<script>
import SwitchIcon from '@/assets/icons/dashboard/swap.svg';
import SwapIcon from '@/assets/icons/app/swap.svg';

export default {
    name: 'SwitchDirection',
    props: {
        disabled: {
            type: Boolean,
            required: true,
            default: false,
        },
        onClickSwitch: {
            type: Function,
            default: () => {},
        },
        icon: {
            type: String,
            required: false,
            default: 'SwitchIcon',
        },
    },
    components: {
        SwitchIcon,
        SwapIcon,
    },
};
</script>
