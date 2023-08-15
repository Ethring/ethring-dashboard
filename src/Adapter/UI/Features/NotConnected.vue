<template>
    <div class="not-connected" @click="$emit('toggleDropdown')" v-click-away="() => $emit('closeDropdown')">
        <div class="icon-container">
            <plusIcon />
        </div>
        <p>{{ $t('connect.emptyTitle') }}</p>
    </div>
</template>

<script>
import plusIcon from '@/assets/icons/dashboard/plus.svg';

export default {
    name: 'NotConnected',
    components: { plusIcon },
    emits: ['toggleDropdown', 'closeDropdown'],
};
</script>

<style lang="scss" scoped>
.not-connected {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    cursor: pointer;
    transition: 0.5s;

    .icon-container {
        display: flex;
        align-items: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #c9e0e0;
        justify-content: center;
        margin-right: 8px;
    }

    p {
        width: 160px;
        font-size: 14px;
        color: #486060;
        line-height: 1.5;
        margin: 0;
    }

    &:hover {
        opacity: 0.7;
    }
}
</style>
