import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';
import { updateBalanceByChain } from '@/modules/balance-provider';

import { delay } from '@/shared/utils/helpers';

export const trackingBalanceUpdate = (store) => {
    const timeout = ref({});
    const waitTime = ref(3);

    const { walletAccount, chainList, getAddressesWithChainsByEcosystem } = useAdapter();

    const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);

    const updateBalanceQueues = computed(() => store.getters['updateBalance/updateBalanceForAddress']);

    const updateBalanceQueuesByChain = computed(() => {
        const chainWithAddresses = getAddressesWithChainsByEcosystem(selectedSrcNetwork.value?.ecosystem);

        const queues = [];
        const target = {
            chains: [],
            address: '',
        };

        for (const chain in chainWithAddresses) {
            const { address } = chainWithAddresses[chain];

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

            if (!chainWithAddresses[config?.net]) {
                continue;
            }

            const { address: targetAddress } = chainWithAddresses[config?.net];
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
            content: () => `Updating balance for ${network.net} after ${timeout.value[network.net]} sec`,
        });

        // Wait for 3 sec before updating balance
        await delay(waitTime.value * 1000); // 3 sec

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

                setInterval(() => {
                    if (timeout.value[config.net] > 0) {
                        timeout.value[config.net] -= 1;
                    }
                }, 1000);

                if (timeout.value[config.net] === 0) {
                    clearInterval(timeout.value[config.net]);
                    message.destroy();
                }

                await removeUpdateBalanceQueues(mainAddress, chain);
            }),
        );
    });
};
