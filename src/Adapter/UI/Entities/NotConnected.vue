<template>
    <div class="not-connected" @click="$emit('toggleDropdown')" v-click-away="() => $emit('closeDropdown')">
        <div class="icon-container">
            <PlusIcon />
        </div>
        <p>{{ $t('connect.emptyTitle') }}</p>
    </div>
</template>

<script>
import PlusIcon from '@/assets/icons/dashboard/plus.svg';

export default {
    name: 'NotConnected',
    components: { PlusIcon },
    emits: ['toggleDropdown', 'closeDropdown'],
};
</script>

<style lang="scss" scoped>
.not-connected {
    @include pageFlexRow;
    justify-content: flex-end;

    padding: 8px 16px;
    border-radius: 16px;
    border: 1px solid transparent;

    cursor: pointer;

    width: fit-content !important;
    margin-left: auto;

    transition: 0.2s;

    .icon-container {
        @include pageFlexRow;
        justify-content: center;

        width: 40px;
        height: 40px;
        border-radius: 50%;

        background: var(--#{$prefix}adapter-not-connected-bg);

        margin-right: 8px;

        svg {
            fill: var(--#{$prefix}adapter-not-connected-icon);
        }
    }

    p {
        width: 160px;

        margin: 0;

        font-size: var(--#{$prefix}small-lg-fs);
        color: var(--#{$prefix}base-text);
        line-height: 1.5;
    }
}
</style>
