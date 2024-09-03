import Web3 from 'web3';
import BigNumber from 'bignumber.js';

import store from '@/app/providers/store.provider';

import { storeBalanceForAccount } from '@/core/balance-provider/utils';
import { getBalancesByAddress } from '@/core/balance-provider/api';

import RequestQueue from '@/core/balance-provider/queue';
import { Type, BaseType, POOL_BALANCES_CHAINS, DP_CHAINS } from '@/core/balance-provider/models/enums';
import { ChainAddresses, BalanceResponse, BalanceType, RecordOptions, ProviderRequestOptions } from '@/core/balance-provider/models/types';

import PortalFiApi from '@/modules/portal-fi/api';
import BerachainApi from '@/modules/berachain/api';
import { BASE_ABI } from '@/core/wallet-adapter/config';
import { TokenData } from '@/shared/models/types/TokenData';
import { getContract } from '@/shared/utils/contract';

const DEFAULT_PROVIDER = 'Pulsar';

export const updateBalanceForAccount = async (account: string, addresses: ChainAddresses, opt: RecordOptions = {}) => {
    const queue = new RequestQueue();

    let isUpdate = opt.isUpdate || false;

    const isInitCalled = store.getters['tokens/isInitCalled'](account, opt.provider);

    if (!isInitCalled) {
        store.dispatch('tokens/setIsInitCall', { account, provider: opt.provider, time: Date.now() });
        isUpdate = true;
    }

    // * Get data from API
    for (const chain in addresses) {
        const { address, logo, nativeTokenLogo } = addresses[chain];
        queue.add(async () => await updateBalanceByChain(account, address, chain, { ...opt, isUpdate, logo, nativeTokenLogo }));
    }
};

export const updateBalanceByChain = async (account: string, address: string, chain: string, opt: RecordOptions = {}) => {
    const { isUpdate = false } = opt;

    const isInitCalled = store.getters['tokens/isInitCalled'](account, opt.provider);

    if (isInitCalled && !isUpdate) return;

    const providerOptions: ProviderRequestOptions = {
        provider: opt.provider || DEFAULT_PROVIDER,
        fetchTokens: opt.fetchTokens || false,
        fetchIntegrations: opt.fetchIntegrations || false,
        fetchNfts: opt.fetchNfts || false,
    };

    try {
        store.dispatch('tokens/setLoadingByChain', { chain, account, value: true });

        const balanceForChain: BalanceResponse | null = await getBalancesByAddress(chain, address, providerOptions);

        if (!balanceForChain) return store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });

        for (const type in BaseType)
            await storeBalanceForAccount(type as BalanceType, account, chain, address, balanceForChain[type] as any, { ...opt, store });

        if (POOL_BALANCES_CHAINS.includes(chain as DP_CHAINS)) {
            const pools = await loadUsersPoolList(chain, address);
            await storeBalanceForAccount(Type.pools, account, chain, address, pools, { ...opt, store });
        }

        if (chain === 'berachain') await loadBalancesFromContract(chain, account, { ...opt, store });
    } catch (error) {
        console.error('Error getting balance for chain', chain, error);
    } finally {
        await store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
    }
};

export const loadUsersPoolList = async (net: string, ownerAddress: string) => {
    const poolService = new PortalFiApi();

    const response = await poolService.getUserBalancePoolList({ net, ownerAddress });

    return response;
};

// temporary solution for berachain testnet balances
export const loadBalancesFromContract = async (chain: string, account: string, options: any) => {
    const BERACHAIN_RPC = 'https://bartio.rpc.berachain.com/';

    const nativeToken = {
        address: null,
        ecosystem: 'EVM',
        logo: 'https://artio-static-asset-public.s3.ap-southeast-1.amazonaws.com/assets/bera.png',
        coingecko_id: 'berachain-bera',
        verified: true,
        decimals: 18,
        name: 'BERA Token',
        symbol: 'BERA',
        chain,
        net: chain,
        balance: '0',
        balanceUsd: 0,
        standard: 'erc20',
        price: '0',
        testnet: true,
    };

    const web3 = new Web3(BERACHAIN_RPC);

    const balance = await web3.eth.getBalance(account);
    nativeToken.balance = BigNumber(balance).dividedBy(`1e${nativeToken.decimals}`).toString();

    const allTokens = await store.dispatch('configs/getTokensListForChain', chain);

    const tokens = allTokens.filter((token: TokenData) => ['WBERA', 'HONEY', 'BGT'].includes(token.symbol));
    const service = new BerachainApi();

    for (const token of tokens) {
        const tokenContract = getContract(token.address, BERACHAIN_RPC, BASE_ABI);

        const balance = await tokenContract.methods.balanceOf(account.toLocaleLowerCase()).call();

        token.balance = BigNumber(balance).dividedBy(`1e${token.decimals}`).toString();

        const response = await service.getUsdPrice(token.address);

        if (response) {
            const { tokenInformation } = response;
            if (tokenInformation?.beraValue) nativeToken.price = tokenInformation.usdValue;

            token.price = tokenInformation?.usdValue || 0;
        }

        if (token.symbol === 'BGT') {
            const response = await service.getStakedAmount(account);

            if (response?.userValidatorInformations?.length) {
                const totalDeposited = response?.userValidatorInformations.reduce(
                    (sum: number, item: any) => (sum = sum + +item.amountDeposited),
                    0,
                );
                const totalQueued = response?.userValidatorInformations.reduce(
                    (sum: number, item: any) => (sum = sum + +item.amountQueued),
                    0,
                );
                const balance = token.balance - totalDeposited - totalQueued;
                token.balance = balance < 0 ? 0 : balance;
            }
        }

        token.balanceUsd = +token.balance * +token.price;
        token.testnet = true;
    }

    nativeToken.balanceUsd = +nativeToken.balance * +nativeToken.price;

    await storeBalanceForAccount(Type.tokens, account, chain, account, [...tokens, nativeToken], options);
};
