<template>
    <div class="not-connect" @click="connect">
        <div class="not-connect__add">
            <plusSvg />
        </div>
        <div class="title">{{ $t('connect.emptyTitle') }}</div>
    </div>
</template>
<script>
import plusSvg from '@/assets/icons/dashboard/plus.svg';
import useWeb3Onboard from '@/compositions/useWeb3Onboard';

export default {
    name: 'NotConnect',
    components: {
        plusSvg,
    },
    setup() {
        const { connectWallet } = useWeb3Onboard();

        const connect = async () => await connectWallet();

        return {
            connect,
        };
    },
};
</script>
<style lang="scss" scoped>
.not-connect {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;

    @include animateEasy;

    &:hover {
        opacity: 0.7;
    }

    svg {
        stroke: var(--#{$prefix}harborBlue);
    }

    &__add {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--#{$prefix}geyser);
    }

    .title {
        font-family: 'Poppins_Light';
        font-size: var(--#{$prefix}small-lg-fs);
        width: 162px;
        margin-left: 10px;
        color: var(--#{$prefix}harborBlue);
    }
}
</style>
