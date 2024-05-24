<template>
    <a-menu-item v-for="record in TO_CONNECT" :key="record.ecosystem" class="ecosystem-item">
        <ConnectTo :name="$t(record.name)" :connect="() => connect(record.ecosystem)" :logos="record.logos" />
    </a-menu-item>
</template>

<script>
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

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
                ecosystem: Ecosystem.EVM,
                logos: ['Metamask', 'Coinbase', 'Ledger'],
            },
            {
                name: 'adapter.cosmosWallets',
                ecosystem: Ecosystem.COSMOS,
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
