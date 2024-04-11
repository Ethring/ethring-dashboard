import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';
import { updateBalanceByChain } from '@/modules/balance-provider';

import { delay } from '@/shared/utils/helpers';

export const trackingBalanceUpdate = (store) => {
    const timeout = ref({});
    const waitTime = ref(3);

    const { walletAccount, chainList, ecosystem } = useAdapter();

    const updateBalanceQueues = computed(() => store.getters['updateBalance/updateBalanceForAddress']);

    const chainWithAddresses = computed(() => {
        return store.getters['adapters/getAddressesByEcosystemList'](ecosystem.value) || {};
    });

    const updateBalanceQueuesByChain = computed(() => {
        const queues = [];
        const target = {
            chains: [],
            address: '',
        };

        for (const chain in chainWithAddresses.value) {
            const { address } = chainWithAddresses.value[chain];

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

            if (!chainWithAddresses.value[config?.net]) {
                continue;
            }

            const { address: targetAddress } = chainWithAddresses.value[config?.net];
            queues.push({ chain: targetChain, address: targetAddress, mainAddress: target.address, config });
        }

        return queues;
    });

    const handleUpdateBalance = async (network, address: string) => {
        const targetAccount = JSON.parse(JSON.stringify(walletAccount.value)) || '';

        timeout.value[network.net] = waitTime.value;

        if (!network || !address || !targetAccount) {
            return;
        }

        message.loading({
            key: 'update_balace',
            content: () => `Updating balance for ${network.net} after ${timeout.value[network.net]} sec`,
        });

        // Wait for 3 sec before updating balance
        for (let index = 0; index < waitTime.value; index++) {
            await delay(1000); // 3 sec
            if (timeout.value[network.net] > 0) {
                timeout.value[network.net] -= 1;
            } else {
                message.destroy();
            }
        }

        await updateBalanceByChain(targetAccount, address, network.net, {
            isUpdate: true,
            chain: network.net,
            logo: network.logo,
        });
    };

    const removeUpdateBalanceQueues = async (address: string, chain: string) => {
        await store.dispatch('updateBalance/removeUpdateBalanceForAddress', { address, chain });
    };

    watch(updateBalanceQueuesByChain, async () => {
        await Promise.all(
            updateBalanceQueuesByChain.value.map(async (queueWallet) => {
                const { address = null, chain = null, mainAddress = null, config = null } = queueWallet || {};

                if (!address || !chain || !mainAddress || !config) {
                    return;
                }

                await handleUpdateBalance(config, address);

                await removeUpdateBalanceQueues(mainAddress, chain);
            }),
        );
    });
};
