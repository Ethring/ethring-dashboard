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
<style lang="scss" scoped>
// .help {
//     @include pageFlexRow;

//     & > div:not(:last-child) {
//         margin-right: 10px;
//     }
// }

// .release-list {
//     background: var(--#{$prefix}secondary-background);

//     .release-item {
//         padding: 4px 0;
//         color: var(--#{$prefix}mute-text);

//         &:not(:last-child) {
//             border-bottom: 1px solid var(--zmt-border-color-op-05);
//         }
//     }
// }

// .update-modal {
//     margin: 10px auto;
//     width: 100%;
// }
</style>
