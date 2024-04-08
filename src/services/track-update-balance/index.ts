import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';
import { updateBalanceByChain } from '@/modules/balance-provider';

import { delay } from '@/shared/utils/helpers';

declare global {
    interface Window {
        BALANCE_WAIT_TIME: number;
    }
}
export const trackingBalanceUpdate = (store) => {
    if (!window.BALANCE_WAIT_TIME) window.BALANCE_WAIT_TIME = 3; // Default 3 sec wait time

    const WAIT_TIME = ref(window.BALANCE_WAIT_TIME || 3);

    const { walletAccount, chainList } = useAdapter();

    const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);

    const updateBalanceQueues = computed(() => store.getters['updateBalance/updateBalanceForAddress']);

    const chainWithAddresses = computed(() => {
        const { ecosystem } = selectedSrcNetwork.value || {};
        const addresses = store.getters['adapters/getAddressesByEcosystemList'](ecosystem) || {};

        const queues = [];

        const target = {
            chains: [],
            address: '',
        };

        for (const chain in addresses) {
            const { address } = addresses[chain];

            if (!address || !updateBalanceQueues.value[address]) {
                continue;
            }

            target.chains = updateBalanceQueues.value[address] || [];
            target.address = address;

            break;
        }

        if (!target.address || !target.chains.length) {
            return queues;
        }

        for (const targetChain of target.chains) {
            const config = chainList.value.find(({ net, chain_id }) => net == targetChain || chain_id == targetChain);

            if (!config) {
                continue;
            }

            if (!addresses[config?.net]) {
                continue;
            }

            const { address: targetAddress } = addresses[config?.net];

            store.dispatch('updateBalance/setQueuesToUpdate', {
                chain: targetChain,
                address: targetAddress,
                mainAddress: target.address,
                config,
            });
        }
    });

    const queues = computed(() => store.getters['updateBalance/getQueueToUpdate'] || []);

    const handleUpdateBalance = async (network, address: string) => {
        const targetAccount = JSON.parse(JSON.stringify(walletAccount.value)) || '';

        if (!network || !address || !targetAccount) {
            return;
        }

        message.loading({
            content: () => `Updating balance for ${network.net} after ${WAIT_TIME.value} sec`,
        });

        // Wait for 3 sec before updating balance
        await delay(WAIT_TIME.value * 1000); // 3 sec

        await updateBalanceByChain(targetAccount, address, network.net, {
            isUpdate: true,
            chain: network.net,
            logo: network.logo,
        });
    };

    const removeUpdateBalanceQueues = async (address: string, chain: string) => {
        await store.dispatch('updateBalance/removeUpdateBalanceForAddress', { address, chain });
    };

    watch(chainWithAddresses, async () => {
        await Promise.all(
            queues.value.map(async (queueWallet) => {
                const { address = null, chain = null, mainAddress = null, config = null } = queueWallet || {};

                if (!address || !chain || !mainAddress || !config) {
                    return;
                }

                const uniqueKey = `${chain}_${mainAddress}`;

                if (!uniqueKey) {
                    return;
                }

                const inProgress = (await store.getters['updateBalance/getInProgress'](uniqueKey)) || false;

                if (inProgress) return;

                store.dispatch('updateBalance/setInProgress', { address: `${chain}_${mainAddress}`, status: true });

                await handleUpdateBalance(config, address);

                await removeUpdateBalanceQueues(mainAddress, chain);

                store.dispatch('updateBalance/setInProgress', { key: `${chain}_${mainAddress}`, status: false });
            }),
        );
    });
};
