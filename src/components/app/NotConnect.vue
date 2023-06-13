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
        stroke: $colorLightBlue;
    }

    &__add {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: $colorLightGreen;
    }

    .title {
        font-family: 'Poppins_Light';
        font-size: 14px;
        width: 162px;
        margin-left: 10px;
        color: $colorLightBlue;
    }
}

body.dark {
    .not-connect {
        &__add {
            background: $colorLightGreenGray;
        }

        svg {
            stroke: $themeGreen;
        }

        .title {
            color: $colorWhite;
        }
    }
}
</style>
