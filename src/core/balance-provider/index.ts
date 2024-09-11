import Web3 from 'web3';
import BigNumber from 'bignumber.js';

import store from '@/app/providers/store.provider';

import { storeBalanceForAccount, checkIfBalanceIsUpdated } from '@/core/balance-provider/utils';
import { getBalancesByAddress } from '@/core/balance-provider/api';

import RequestQueue from '@/core/balance-provider/queue';
import { Type, BaseType, POOL_BALANCES_CHAINS, TIME_TO_BLOCK } from '@/core/balance-provider/models/enums';
import { ChainAddresses, BalanceResponse, BalanceType, RecordOptions, ProviderRequestOptions } from '@/core/balance-provider/models/types';

import BerachainApi from '@/modules/berachain/api';
import PortalFiApi from '@/modules/portal-fi/api';

import { BASE_ABI } from '@/core/wallet-adapter/config';
import { TokenData } from '@/shared/models/types/TokenData';
import { getContract } from '@/shared/utils/contract';
import { formatResponse } from '@/core/balance-provider/format';
import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

const DEFAULT_PROVIDER = 'Pulsar';
const BERACHAIN_RPC = 'https://bartio.rpc.berachain.com/';

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

    try {
        const isUpdated = await checkIfBalanceIsUpdated(account, chain, opt.provider as string);

        if (isUpdated) {
            console.warn(`Balance is already updated for account in last ${TIME_TO_BLOCK / 1000} seconds`);
            console.table({ account, chain, provider: opt.provider });
            return;
        }
    } catch (error) {
        console.error('Error checking if balance is updated', error);
    }

    const providerOptions: ProviderRequestOptions = {
        provider: opt.provider || DEFAULT_PROVIDER,
        fetchTokens: opt.fetchTokens || false,
        fetchIntegrations: opt.fetchIntegrations || false,
        fetchNfts: opt.fetchNfts || false,
    };

    try {
        await store.dispatch('tokens/setLoadingByChain', { chain, account, value: true });

        if (chain === 'berachain') return await loadBalancesFromContract(chain, account, { ...opt, store });

        const balanceForChain: BalanceResponse | null = await getBalancesByAddress(chain, address, providerOptions);

        if (!balanceForChain) return store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });

        const promises = Object.keys(BaseType).map((type) =>
            storeBalanceForAccount(type as BalanceType, account, chain, address, balanceForChain[type as BaseType], { ...opt, store }),
        );

        await Promise.all(promises);
    } catch (error) {
        console.error('Error getting balance for chain', chain, error);
    } finally {
        await store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
    }
};

export const loadUsersPoolList = async (params: { address: string; isBalanceUpdate: boolean; chain: string }) => {
    const { address, isBalanceUpdate, chain } = params;

    const accountPools = store.getters['tokens/getPoolsByAccount'](address);

    if (accountPools && !isBalanceUpdate) return accountPools;

    const poolService = new PortalFiApi();
    const chains = isBalanceUpdate ? [chain] : POOL_BALANCES_CHAINS;

    for (const net of chains) {
        const response = await poolService.getUserBalancePoolList({ net, address });

        const pools = formatResponse(Type.pools, response, { chain: net });

        store.dispatch('tokens/setDataFor', { type: Type.pools, account: address, chain: net, data: pools });
    }
};

// TODO: Remove this function after berachain balances are fixed
// ******************************************************************************************************************************************************
// ! temporary solution for berachain testnet balances
// ******************************************************************************************************************************************************

const getBerachainTokens = async () => {
    try {
        const allTokens = await store.dispatch('configs/getTokensListForChain', 'berachain');
        return allTokens.filter((token: TokenData) => ['WBERA', 'HONEY', 'BGT'].includes(token.symbol));
    } catch (error) {
        console.error('Error getting berachain balances', error);
        return [];
    }
};

const getBerachainTokenPrice = async (token: TokenData, nativeToken: TokenData) => {
    try {
        const service = new BerachainApi();
        const response = await service.getUsdPrice(token.address as string);

        if (!response) return;

        const { tokenInformation } = response;

        if (tokenInformation?.beraValue) nativeToken.price = tokenInformation.usdValue;

        token.price = tokenInformation?.usdValue || 0;
    } catch (error) {
        console.error('Error getting berachain token price', error);
    }
};

const getBerachainStakedAmount = async (token: TokenData, account: string) => {
    if (token.symbol !== 'BGT') return;

    try {
        const service = new BerachainApi();

        const response = await service.getStakedAmount(account);

        if (!response) return;

        const { userValidatorInformations } = response;

        if (!userValidatorInformations?.length) return;

        const totalDeposited = response.userValidatorInformations.reduce((sum: number, item: any) => (sum += +item.amountDeposited), 0);
        const totalQueued = response.userValidatorInformations.reduce((sum: number, item: any) => (sum += +item.amountQueued), 0);

        const balance = BigNumber(token.balance).minus(totalDeposited).minus(totalQueued);
        token.balance = balance.isLessThan(0) ? '0' : balance.toString();
    } catch (error) {
        console.error('Error getting berachain staked amount', error);
    }
};

export const loadBalancesFromContract = async (chain: string, account: string, options: any) => {
    const nativeToken = {
        address: undefined,
        ecosystem: Ecosystem.EVM,
        logo: 'https://artio-static-asset-public.s3.ap-southeast-1.amazonaws.com/assets/bera.png',
        coingecko_id: 'berachain-bera',
        verified: true,
        decimals: 18,
        name: 'BERA Token',
        symbol: 'BERA',
        chain,
        net: chain,
        balance: '0',
        balanceUsd: '0',
        standard: 'erc20',
        price: '0',
        testnet: true,
    };

    try {
        const web3 = new Web3(BERACHAIN_RPC);

        // * Get balance for native token
        const balance = await web3.eth.getBalance(account);
        nativeToken.balance = BigNumber(balance.toString()).dividedBy(`1e${nativeToken.decimals}`).toString();

        // * Get balances for berachain tokens
        const berachainTokens = await getBerachainTokens();

        // * Get balances for berachain tokens and their prices in USD
        for (const token of berachainTokens) {
            const tokenContract = getContract(token.address, BERACHAIN_RPC, BASE_ABI);
            const balance = (await tokenContract.methods.balanceOf(account.toLocaleLowerCase()).call()) as bigint;

            token.balance = BigNumber(balance.toString()).dividedBy(`1e${token.decimals}`).toString();

            await getBerachainTokenPrice(token, nativeToken as any);
            await getBerachainStakedAmount(token, account);

            token.testnet = true;
        }

        // * Calculate balance in USD for native token
        nativeToken.balanceUsd = BigNumber(nativeToken.balance).multipliedBy(nativeToken.price).toFixed(6);

        // * Store balances for account
        await storeBalanceForAccount(Type.tokens, account, chain, account, [...berachainTokens, nativeToken], options);
    } catch (error) {
        console.error('Error getting berachain balances', error);
    }
};
