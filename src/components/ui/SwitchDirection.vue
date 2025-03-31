<template>
    <div class="switch-direction" :class="{ disabled, [icon]: icon }" @click="onClickSwitch">
        <component :is="icon" />
    </div>
</template>
<script>
import SwitchIcon from '@/assets/icons/module-icons/switch-direction.svg';
import SwapIcon from '@/assets/icons/module-icons/super-swap.svg';

export default {
    name: 'SwitchDirection',
    components: {
        SwitchIcon,
        SwapIcon,
    },
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
};
</script>
