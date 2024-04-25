<!-- eslint-disable vue/no-v-html -->
<template>
    <div class="wallet-module--icon-container" :style="iconContainerStyle">
        <span v-if="isSVG(logo)" v-html="logo" />
        <span v-else-if="logo">
            <img :src="logo" alt="logo" />
        </span>
        <span v-else>
            {{ module }}
        </span>
    </div>
</template>
<script>
import { ref, onMounted, onUpdated } from 'vue';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import { isSVG } from '@/core/wallet-adapter/utils';

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
        background-color: var(--#{$prefix}banner-secondary-color);

        @include pageFlexRow;
        justify-content: center;

        font-size: 5px;

        span {
            @include pageFlexRow;
            justify-content: center;
            width: 80%;
            height: 80%;
            color: $white;
            text-align: center;

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
