<template>
    <div class="wallet-module--icon-container" :style="iconContainerStyle">
        <span v-if="isSVG(logo)" v-html="logo" />
        <span v-else>
            <img :src="logo" />
        </span>
    </div>
</template>
<script>
import { ref, onMounted, onUpdated } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import { isSVG } from '@/Adapter/utils';

export default {
    name: 'ModuleIcon',
    props: {
        module: {
            type: String,
            required: true,
        },
        ecosystem: {
            type: String,
            required: true,
        },
        width: {
            type: String,
            default: '32px',
        },
        height: {
            type: String,
            default: '32px',
        },
        background: {
            type: String,
            default: '#d9f4f1',
        },
    },
    setup(props) {
        const logo = ref('');

        const { getWalletLogo } = useAdapter();

        const iconContainerStyle = ref({
            width: props.width,
            height: props.height,
            background: props.background,
        });

        const getLogo = async () => (logo.value = await getWalletLogo(props.ecosystem, props.module));

        onMounted(async () => await getLogo());
        onUpdated(async () => await getLogo());

        return {
            iconContainerStyle,

            logo,
            isSVG,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-module {
    &--icon-container {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #d9f4f1;

        display: flex;
        justify-content: center;
        align-items: center;

        font-size: 5px;

        span {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 80%;
            height: 80%;

            svg {
                width: 100%;
                height: 100%;
            }

            img {
                width: 80%;
                height: 80%;
            }
        }
    }
}
</style>
