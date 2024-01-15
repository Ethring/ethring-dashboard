<template>
    <a-menu-item :key="record.ecosystem" v-for="record in TO_CONNECT" class="ecosystem-item">
        <ConnectTo :name="$t(record.name)" :connect="() => connect(record.ecosystem)" :logos="record.logos" />
    </a-menu-item>
</template>

<script>
import useAdapter from '@/Adapter/compositions/useAdapter';

import { ECOSYSTEMS } from '@/Adapter/config';

import ConnectTo from '../Entities/ConnectTo';

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

        const { connectByEcosystems } = useAdapter();

        return {
            connect: connectByEcosystems,
            TO_CONNECT,
        };
    },
};
</script>
