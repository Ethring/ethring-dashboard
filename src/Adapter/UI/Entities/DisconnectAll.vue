<template>
    <div class="disconnect-all">
        <div class="item" @click="disconnectAll">
            <div class="icon-container">
                <DisconnectIcon />
            </div>
            <span class="text">
                {{ $t('adapter.disconnectAll') }}
            </span>
        </div>
    </div>
</template>

<script>
import DisconnectIcon from '@/assets/icons/dashboard/disconnect.svg';

export default {
    name: 'DisconnectAll',
    components: {
        DisconnectIcon,
    },
    props: {
        disconnectAll: {
            type: Function,
            required: true,
        },
    },
};
</script>
<style lang="scss" scoped>
.disconnect-all {
    cursor: pointer;
    transition: 0.2s;
    padding: 0 8px;
    .item {
        display: flex;
        align-items: center;
    }

    .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #d9f4f1;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin-right: 10px;
    }

    .text {
        color: #0d7e71;
        font-size: 14px;
        font-weight: 500;
    }

    &:hover {
        opacity: 0.7;
    }
}
</style>
