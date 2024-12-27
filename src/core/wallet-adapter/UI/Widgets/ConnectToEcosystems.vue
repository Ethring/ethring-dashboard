<template>
    <a-menu-item v-for="record in TO_CONNECT" :key="record.ecosystem" class="ecosystem-item">
        <ConnectTo :name="$t(record.name)" :connect="() => connect(record.ecosystem)" :logos="record.logos" :disabled="record.disabled" />
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
    props: {
        close: {
            type: Function,
            default: () => {},
        },
    },
    setup(props) {
        const TO_CONNECT = [
            {
                name: 'adapter.ethereumWallets',
                ecosystem: Ecosystem.EVM,
                logos: ['Metamask', 'Coinbase', 'Ledger'],
            },
        ];

        const { connectByEcosystems } = useAdapter();

        const connect = (ecosystem) => {
            props.close();
            connectByEcosystems(ecosystem);
        };

        return {
            connect,
            TO_CONNECT,
        };
    },
};
</script>
