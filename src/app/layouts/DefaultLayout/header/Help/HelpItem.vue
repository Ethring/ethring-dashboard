<template>
    <a-space class="nav-bar__help-item-space">
        <a-tooltip placement="bottom">
            <template #title> {{ $t(tooltipText) }} </template>
            <a-badge :count="badge">
                <a-avatar class="nav-bar__help-item" :class="{ disabled }">
                    <template #icon>
                        <slot />
                    </template>
                </a-avatar>
            </a-badge>
        </a-tooltip>
    </a-space>
</template>
<script>
export default {
    name: 'HelpItem',
    props: {
        tooltipText: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        badge: {
            type: Number,
            default: 0,
        },
    },
};
</script>
