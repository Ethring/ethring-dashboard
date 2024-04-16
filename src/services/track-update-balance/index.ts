import { computed, ref, watch } from 'vue';

import { ChainConfig } from '@/modules/chain-configs/types/chain-config';
import { delay } from '@/shared/utils/helpers';
import { message } from 'ant-design-vue';
import { updateBalanceByChain } from '@/modules/balance-provider';
import useAdapter from '@/Adapter/compositions/useAdapter';

interface IQueue {
    chain: string;
    address: string;
    mainAddress: string;
    config: ChainConfig;
}

export const trackingBalanceUpdate = (store: any) => {
    const BALANCE_WAIT_TIME = computed<number>(() => window.BALANCE_WAIT_TIME.value || 3);
    const { walletAccount, chainList } = useAdapter();

    const chains = computed<ChainConfig[]>(() => chainList.value);
    const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);

    const updateBalanceQueues = computed(() => store.getters['updateBalance/updateBalanceForAddress']);

    const chainWithAddresses = computed(() => {
        const { ecosystem } = selectedSrcNetwork.value || {};
        const addresses = store.getters['adapters/getAddressesByEcosystemList'](ecosystem) || {};

        const queues = [] as IQueue[];

        const target = {
            chains: [],
            address: '',
        };

        for (const chain in addresses) {
            const { address } = addresses[chain];

            if (!address || !updateBalanceQueues.value[address]) continue;

            target.chains = updateBalanceQueues.value[address] || [];
            target.address = address;

            break;
        }

        if (!target.address || !target.chains.length) return queues;

        for (const targetChain of target.chains) {
            const config = chains.value.find(({ net, chain_id }) => net == targetChain || chain_id == targetChain) as ChainConfig;

            if (!config) continue;

            if (!addresses[config?.net]) continue;

            const { address: targetAddress } = addresses[config?.net];

            store.dispatch('updateBalance/setQueuesToUpdate', {
                chain: targetChain,
                address: targetAddress,
                mainAddress: target.address,
                config,
            });
        }

        return queues;
    });

    const queues = computed(() => store.getters['updateBalance/getQueueToUpdate'] || []);

    const handleUpdateBalance = async (network: ChainConfig, address: string) => {
        const targetAccount = JSON.parse(JSON.stringify(walletAccount.value)) || '';

        if (!network || !address || !targetAccount) return false;

        // Wait for 3 sec before updating balance
        console.log(`Waiting for ${BALANCE_WAIT_TIME.value} sec before updating balance for ${network.net}`);

        await delay(BALANCE_WAIT_TIME.value * 1000);

        message.loading({
            content: () => `Update balance: ${address}`,
        });

        console.log('Finished waiting for balance update, updating balance now...');

        console.log('Updating balance for', network.net, 'with address', address);

        await updateBalanceByChain(targetAccount, address, network.net, {
            isUpdate: true,
            chain: network.net,
            logo: network.logo,
        });

        return true;
    };

    const removeUpdateBalanceQueues = async (address: string, chain: string) => {
        await store.dispatch('updateBalance/removeUpdateBalanceForAddress', { address, chain });
    };

    watch(chainWithAddresses, async () => {
        await Promise.all(
            queues.value.map(async (queueWallet: IQueue) => {
                const { address = null, chain = null, mainAddress = null, config = null } = queueWallet || {};

                if (!address || !chain || !mainAddress || !config) return;

                const uniqueKey = `${chain}_${mainAddress}`;

                if (!uniqueKey) return console.log('Invalid unique key for balance update');

                const inProgress = (await store.getters['updateBalance/getInProgress'](uniqueKey)) || false;

                if (inProgress) return console.log('Balance update in progress for', uniqueKey);

                await store.dispatch('updateBalance/setInProgress', { address: uniqueKey, status: true });

                const updated = await handleUpdateBalance(config, address);

                console.log('Balance updated for', uniqueKey, 'now removing from queue');

                updated && (await removeUpdateBalanceQueues(mainAddress, chain));

                await store.dispatch('updateBalance/setInProgress', { address: uniqueKey, status: false });
            }),
        );
    });
};
