import _ from 'lodash';

import { computed } from 'vue';

import { ChainConfig } from '@/modules/chain-configs/types/chain-config';
import { updateBalanceByChain } from '@/core/balance-provider'
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

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

    const srcToken = computed({
        get: () => store.getters['tokenOps/srcToken'],
        set: (value) => store.dispatch('tokenOps/setSrcToken', value),
    });

    const dstToken = computed({
        get: () => store.getters['tokenOps/dstToken'],
        set: (value) => store.dispatch('tokenOps/setDstToken', value),
    });

    const processQueueToUpdate = async (queueWallet: IQueue) => {
        const { address = null, chain = null, hash, startTimestamp } = queueWallet || {};

        if (!address || !chain) {
            console.warn('Invalid address or chain for balance update');
            return;
        }

        const queueKey = `${chain}_${address}_${hash}`;

        if (startTimestamp > 0) return;

        await store.dispatch('updateBalance/setInProgress', queueKey);

        const config = chains.value.find(({ net, chain_id }) => net == chain || chain_id == chain) as ChainConfig;

        const targetAccount = JSON.parse(JSON.stringify(walletAccount.value)) || '';

        await updateBalanceByChain(targetAccount, address, config.net, {
            isUpdate: true,
            chain: config.net,
            logo: config.logo,
        });

        await store.dispatch('updateBalance/removeUpdateBalanceForAddress', queueWallet);

        const tokens = store.getters['tokens/getTokensListForChain'](config.net, { account: targetAccount });

        const srcTokenData = tokens.find(({ id }) => id === srcToken.value?.id);
        if (srcTokenData) srcToken.value = srcTokenData;

        const dstTokenData = tokens.find(({ id }) => id === dstToken.value?.id);
        if (dstTokenData) dstToken.value = dstTokenData;
    };

    store.watch(
        () => store.getters['updateBalance/getQueueToUpdate'],
        async (queues: IQueue[], oldQueues: IQueue[]) => {
            if (_.isEqual(queues, oldQueues)) return;

            // ========================================
            // Wait for {N} sec before processing next
            // ========================================
            for (const queueWallet of queues) _.delay(async () => await processQueueToUpdate(queueWallet), BALANCE_WAIT_TIME.value * 1000);
        }
    );
};
