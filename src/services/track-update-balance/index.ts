import { toLower, isEqual } from 'lodash';

import { computed } from 'vue';

import { ChainConfig } from '@/modules/chain-configs/types/chain-config';
import { updateBalanceByChain } from '@/core/balance-provider';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import { delay } from '@/shared/utils/helpers';

interface IQueue {
    chain: string;
    address: string;
    hash: string;
    startTimestamp: number;
}

export const trackingBalanceUpdate = (store: any) => {
    const BALANCE_WAIT_TIME = computed<number>(() => window.BALANCE_WAIT_TIME.value || 3);

    const { walletAccount, getAllChainsList } = useAdapter();

    const chains = computed<ChainConfig[]>(() => getAllChainsList());

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

        const config = chains.value.find(
            ({ net, chain_id, chain: configChain }) => net == chain || chain_id == chain || configChain === chain,
        ) as ChainConfig;

        if (!config) console.warn('CONFIG NOT FOUND for balance update', chain);

        const { logo: chainLogo = '', native_token, asset } = config || {};

        let nativeToken: any = native_token || asset;

        if (asset) {
            nativeToken = asset;
            const { logo_URIs = {} } = asset as any;
            const { png, svg } = logo_URIs || {};
            nativeToken.logo = png || svg || '';
        }

        const { logo: nativeTokenLogo } = nativeToken || { logo: '' };

        const targetAccount = JSON.parse(JSON.stringify(walletAccount.value)) || '';

        await updateBalanceByChain(targetAccount, address, config.net, {
            isUpdate: true,
            chain: config.net,
            logo: chainLogo,
            nativeTokenLogo,
        });

        await store.dispatch('updateBalance/removeUpdateBalanceForAddress', queueWallet);

        const tokens = store.getters['tokens/getTokensListForChain'](config.net, { account: targetAccount });

        if (srcToken.value) {
            const srcTokenData = tokens.find(
                ({ id = '', address = '' }) => id === srcToken.value?.id || toLower(address) === toLower(srcToken.value?.address || ''),
            );
            if (srcTokenData) srcToken.value.balance = srcTokenData.balance;
        }

        if (dstToken.value) {
            const dstTokenData = tokens.find(
                ({ id = '', address = '' }) => id === dstToken.value?.id || toLower(address) === toLower(dstToken.value?.address || ''),
            );
            if (dstTokenData) dstToken.value.balance = dstTokenData.balance;
        }
    };

    store.watch(
        () => store.getters['updateBalance/getQueueToUpdate'],
        async (queues: IQueue[], oldQueues: IQueue[]) => {
            if (isEqual(queues, oldQueues)) return;

            // ========================================
            // Wait for {N} sec before processing next
            // ========================================
            for (const queueWallet of queues) {
                await delay(BALANCE_WAIT_TIME.value * 1000);
                await processQueueToUpdate(queueWallet);
            }
        },
    );
};
