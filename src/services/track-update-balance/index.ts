import { computed, watch } from 'vue';

import { ChainConfig } from '@/modules/chain-configs/types/chain-config';
import { delay } from '@/shared/utils/helpers';
import { updateBalanceByChain } from '@/modules/balance-provider';
import useAdapter from '@/Adapter/compositions/useAdapter';
import _ from 'lodash';

interface IQueue {
    chain: string;
    address: string;
    hash: string;
    startTimestamp: number;
}

export const trackingBalanceUpdate = (store: any) => {
    const BALANCE_WAIT_TIME = computed<number>(() => window.BALANCE_WAIT_TIME.value || 3);

    const { walletAccount, chainList } = useAdapter();

    const chains = computed<ChainConfig[]>(() => chainList.value);

    const queues = computed(() => store.getters['updateBalance/getQueueToUpdate']);

    const processQueueToUpdate = async (queueWallet: IQueue) => {
        const { address = null, chain = null, hash, startTimestamp } = queueWallet || {};

        if (!address || !chain) {
            console.warn('Invalid address or chain for balance update');
            return;
        }

        const queueKey = `${chain}_${address}_${hash}`;

        if (startTimestamp > 0) return console.log(`Balance update for ${queueKey} already in progress`);

        await store.dispatch('updateBalance/setInProgress', queueKey);

        const config = chains.value.find(({ net, chain_id }) => net == chain || chain_id == chain) as ChainConfig;

        const targetAccount = JSON.parse(JSON.stringify(walletAccount.value)) || '';

        await updateBalanceByChain(targetAccount, address, config.net, {
            isUpdate: true,
            chain: config.net,
            logo: config.logo,
        });

        await store.dispatch('updateBalance/removeUpdateBalanceForAddress', queueWallet);
    };

    watch(queues, async (queues, oldQueues) => {
        if (_.isEqual(queues, oldQueues)) return;

        await Promise.all(
            queues.map(async (queueWallet: IQueue) => {
                // ========================================
                // Wait for {N} sec before processing next
                // ========================================

                await delay(BALANCE_WAIT_TIME.value * 1000);

                await processQueueToUpdate(queueWallet);
            }),
        );
    });
};
