<template>
    <a-result status="warning" :title="`At the moment we don't support selected network`" class="unsupported-layout">
        <template #extra>
            <div class="supported-layout__description">
                {{ $t('tokenOperations.supportedNetwork') }}
            </div>
            <UiButton :title="$t('tokenOperations.switchNetwork')" size="large" class="unsupported-layout__btn" @click="switchNetwork" />
        </template>
    </a-result>
</template>
<script>
import { inject } from 'vue';
import UiButton from '@/components/ui/Button.vue';

export default {
    name: 'UnsupportedResult',
    components: {
        UiButton,
    },
    setup() {
        const useAdapter = inject('useAdapter');

        const { setChain, connectedWallet } = useAdapter();

        const switchNetwork = async () => {
            const wallet = { ...connectedWallet.value, chain_id: 1 };
            return await setChain(wallet);
        };

        return {
            switchNetwork,
        };
    },
};
</script>
<style lang="scss">
.unsupported-layout {
    border: 1px solid var(--#{$prefix}border-color);
    border-radius: 16px;
    width: 660px;

    &__btn {
        width: 100%;
        margin-top: 20px;
    }
}
.ant-result-title {
    color: var(--#{$prefix}primary-text) !important;
    font-size: 20px !important;
}

.ant-result-extra {
    width: 80%;
    margin: 20px auto !important;

    color: var(--#{$prefix}base-text);
    font-size: 14px;
    line-height: 20px;
}
</style>
