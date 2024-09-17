import { toLower, isEqual } from 'lodash';

import { computed } from 'vue';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import SocketDataProvider from '@/core/balance-provider/socket';
import { updateBalanceByChain } from '@/core/balance-provider';

import { Providers } from '@/core/balance-provider/models/enums';
import { IChainConfig } from '@/shared/models/types/chain-config';
import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

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

    const chains = computed<IChainConfig[]>(() => getAllChainsList());

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
            console.warn('Invalid address or chain for balance update', { address, chain });
            return;
        }

        const queueKey = `${chain}_${address}_${hash}`;

        if (startTimestamp > 0) return;

        await store.dispatch('updateBalance/setInProgress', queueKey);

        const config = chains.value.find(
            ({ net, chain_id, chain: configChain }) => net == chain || chain_id == chain || configChain === chain,
        ) as IChainConfig;

        if (!config) console.warn('CONFIG NOT FOUND for balance update', chain);

        const { logo: chainLogo = '', native_token, asset, ecosystem } = config || {};

        let nativeToken: any = native_token || asset;

        if (asset) {
            nativeToken = asset;
            const { logo_URIs = {} } = asset as any;
            const { png, svg } = logo_URIs || {};
            nativeToken.logo = png || svg || '';
        }

        const { logo: nativeTokenLogo } = nativeToken || { logo: '' };

        const targetAccount = JSON.parse(JSON.stringify(walletAccount.value)) || '';

        switch (ecosystem) {
            case Ecosystem.COSMOS:
                await updateBalanceByChain(targetAccount, address, config.net, {
                    isUpdate: true,
                    chain: config.net,
                    logo: chainLogo,
                    nativeTokenLogo,
                    provider: Providers.Pulsar,
                    fetchTokens: false,
                    fetchIntegrations: true,
                    fetchNfts: true,
                });

                break;
            case Ecosystem.EVM:
                await SocketDataProvider.updateBalance(address);
            default:
                break;
        }

        await store.dispatch('updateBalance/removeUpdateBalanceForAddress', queueWallet);

        const tokens = store.getters['tokens/getTokensListForChain'](config.net, { account: targetAccount });
        const pools = store.getters['tokens/getPoolsByAccount'](targetAccount);

        const isSrcLpToken = srcToken.value?.id?.includes('pools');
        const isDstLpToken = dstToken.value?.id?.includes('pools');

        if (isSrcLpToken && pools && !pools[config.net]?.length) srcToken.value = null;
        if (isDstLpToken && pools && !pools[config.net]?.length) dstToken.value = null;

        if (srcToken.value && config.net === srcToken.value.net) {
            const list = isSrcLpToken ? pools[config.net] : tokens;
            const srcTokenData = list.find(
                ({ id = '', address = '' }) => id === srcToken.value?.id || toLower(address) === toLower(srcToken.value?.address || ''),
            );
            if (srcTokenData) srcToken.value.balance = srcTokenData.balance;
            else if (isSrcLpToken) srcToken.value = list[0];
        }

        if (dstToken.value && config.net === dstToken.value.net) {
            const list = isDstLpToken ? pools[config.net] : tokens;
            const dstTokenData = list.find(
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
