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
    display: flex;
    align-items: center;
    justify-content: flex-end;

    padding: 8px 16px;
    border-radius: 16px;
    background-color: var(--#{$prefix}banner-color);
    border: 1px solid transparent;

    cursor: pointer;

    width: fit-content !important;
    margin-left: auto;

    transition: 0.2s;

    .icon-container {
        display: flex;
        align-items: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--#{$prefix}border-color);
        justify-content: center;
        margin-right: 8px;
    }

    p {
        width: 160px;
        font-size: var(--#{$prefix}small-lg-fs);
        color: var(--#{$prefix}base-text);
        line-height: 1.5;
        margin: 0;
    }

    &:hover {
        border-color: var(--#{$prefix}btn-bg-color-hover);
    }
}
</style>
