<template lang="">
    <a-menu-item-group key="ecosystems" :title="$t('adapter.ecosystemsGroup')">
        <a-menu-item :key="record.ecosystem" v-for="record in TO_CONNECT">
            <ConnectTo :name="$t(record.name)" :connect="() => connect(record.ecosystem)" :logos="record.logos" />
        </a-menu-item>
    </a-menu-item-group>
</template>

<script>
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';

import { ECOSYSTEMS } from '@/Adapter/config';

import ConnectTo from '@/Adapter/UI/Entities/ConnectTo';

export default {
    name: 'ConnectToEcosystems',
    components: {
        ConnectTo,
    },

    setup() {
        const TO_CONNECT = [
            {
                name: 'adapter.ethereumWallets',
                ecosystem: ECOSYSTEMS.EVM,
                logos: ['Metamask', 'Coinbase', 'Ledger'],
            },
            {
                name: 'adapter.cosmosWallets',
                ecosystem: ECOSYSTEMS.COSMOS,
                logos: ['Keplr', 'Leap', 'Ledger'],
            },
        ];

        const store = useStore();

        const { connectTo } = useAdapter();

        const connect = async (ecosystem = ECOSYSTEMS.EVM) => {
            if (ecosystem === ECOSYSTEMS.COSMOS) {
                return store.dispatch('adapters/SET_MODAL_STATE', true);
            }

            return await connectTo(ecosystem);
        };

        return {
            connect,
            TO_CONNECT,
        };
    },
};
</script>
