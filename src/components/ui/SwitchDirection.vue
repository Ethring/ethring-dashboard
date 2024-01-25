<template>
    <div class="switch-direction" :class="{ disabled }" @click="onClickSwitch">
        <SwitchIcon />
    </div>
</template>
<script>
import SwitchIcon from '@/assets/icons/dashboard/swap.svg';

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
    },
    components: {
        SwitchIcon,
    },
};
</script>
