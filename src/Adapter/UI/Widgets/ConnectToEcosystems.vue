<template lang="">
    <div :key="record.ecosystem" v-for="record in TO_CONNECT" class="ecosystem-item">
        <ConnectTo :name="$t(record.name)" :connect="() => connect(record.ecosystem)" :logos="record.logos" />
    </div>
</template>

<script>
import useAdapter from '@/Adapter/compositions/useAdapter';

import { ECOSYSTEMS } from '@/Adapter/config';

import ConnectTo from '@/Adapter/UI/Entities/ConnectTo';

export default {
    name: 'ConnectToEcosystems',
    components: {
        ConnectTo,
    },
    emits: ['closeDropdown'],
    setup(_, { emit }) {
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

        const { connectTo, action } = useAdapter();

        const connect = async (ecosystem = ECOSYSTEMS.EVM) => {
            emit('closeDropdown');
            if (ecosystem === ECOSYSTEMS.COSMOS) {
                return action('SET_MODAL_STATE', { name: 'wallets', isOpen: true });
            }

            try {
                const status = await connectTo(ecosystem);
                status && action('SET_IS_CONNECTING', false);
            } catch (error) {
                action('SET_IS_CONNECTING', false);
                console.log(error);
            }
        };

        return {
            connect,
            TO_CONNECT,
        };
    },
};
</script>
<style scoped>
.ecosystem-item {
    margin-bottom: 8px;
}
</style>
