import { computed } from 'vue';
import _ from 'lodash';
import BigNumber from 'bignumber.js';

import { cosmologyConfig } from '@/Adapter/config';
import { DP_COSMOS } from '@/api/data-provider';

import { getTotalBalanceByDiff } from '@/shared/utils/assets';
import IndexedDBService from '@/modules/indexedDb';

import PricesModule from '@/modules/prices/';

import { ECOSYSTEMS } from '@/Adapter/config';

import { BALANCES_TYPES } from '@/modules/Balances/constants';
// =================================================================================================================

export const storeOperations = async (
    chain,
    account,
    store,
    { tokens = [], integrations = [], nfts = [] },
    { allTokens, allIntegrations, allNfts }
) => {
    if (!tokens.length && !integrations.length && !nfts.length) {
        return store.dispatch('tokens/setLoadingByChain', { chain, value: false });
    }

    // Store data in Vuex
    store.dispatch('tokens/setGroupTokens', { chain, account, data: { list: tokens } });

    store.dispatch('tokens/setDataFor', { type: 'tokens', account, data: allTokens });
    store.dispatch('tokens/setDataFor', { type: 'integrations', account, data: allIntegrations });
    store.dispatch('tokens/setDataFor', { type: 'nfts', account, data: allNfts });

    store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
};

// =================================================================================================================

export const getDataFromIndexedCache = async (key) => {
    return (await IndexedDBService.getData(key)) || {};
};

export const saveToCache = async (key, data = { tokens: [], nfts: [], integrations: [] }) => {
    const isEmpty = _.every(data, _.isEmpty);

    if (!isEmpty) {
        await IndexedDBService.saveData(key, data);
    }
};

// =================================================================================================================

export const formatResponse = (chain, { chainForRequest, chainAddress, logo }, { tokens = [], integrations = [], nfts = [] }) => {
    const allTokens = [];
    const allIntegrations = [];
    const allNfts = [];

    if (tokens && tokens.length) {
        const list = tokens.map((token) => formatRecord(token, { net: chainForRequest, chain, logo, chainAddress, type: 'asset' }));
        allTokens.push(...list);
    }

    if (integrations && integrations.length) {
        const list = integrations.map((integration) =>
            processIntegration(integration, { net: chainForRequest, chain, logo, chainAddress })
        );

        allIntegrations.push(...list);
    }

    if (nfts && nfts.length) {
        const list = nfts.map((nft) => formatRecord(nft, { net: chainForRequest, chain, logo, chainAddress, type: 'nft' }));
        allNfts.push(...list);
    }

    return {
        allTokens,
        allIntegrations,
        allNfts,
    };
};

const cosmosChainTokens = (record, { chain, net }) => {
    const chainName = DP_COSMOS[net] || chain;

    const [cosmosChain] = cosmologyConfig.assets.filter(({ chain_name }) => chain_name === chainName) || [];

    const { assets } = cosmosChain || {};

    const [nativeToken] = assets || [];

    if (record.address && record.address.startsWith('IBC')) {
        record.address = record.address.replace('IBC', 'ibc');
    }

    record.base = record.address;

    const isNativeByBase = _.lowerCase(record.address) === _.lowerCase(nativeToken?.base);
    const isNativeBySymbol = _.lowerCase(record.symbol) === _.lowerCase(nativeToken?.symbol);

    if (isNativeByBase || isNativeBySymbol) {
        record.address = nativeToken?.base;
        record.base = nativeToken?.base;
        record.id = `${chainName}:asset__native:${record.symbol}`;
    }

    return record;
};

const processIntegration = (integration, { net, chain, logo, chainAddress }) => {
    const chainName = DP_COSMOS[net] || net || chain;

    if (integration.platform) {
        integration.id = `${chainName}:integration__${integration.platform}:${integration.type}:${integration.stakingType}`;
    }

    if (integration.validator && integration.validator?.address) {
        integration.id = `${integration.id}:${integration.validator.address}`;
    }

    if (integration.address) {
        integration.id = `${integration.id}:${integration.address}`;
    }

    if (integration.integrationId) {
        integration.id = `${chainName}:integration__${integration.integrationId}`;
    }

    const { balances = [] } = integration;

    integration.balances = balances?.map((intToken) => formatRecord(intToken, { net, chain, chainAddress, logo, type: 'integration' }));

    return integration;
};

export const getIntegrationsBalance = (integrations) => {
    let balance = BigNumber(0);

    for (const integration of integrations) {
        const { balances = [] } = integration;

        if (integration.type === BALANCES_TYPES.FUTURES || integration.type === BALANCES_TYPES.BORROW_AND_LENDING) {
            balance = getTotalBalanceByDiff(balances, balance);
        } else {
            balance = getTotalBalance(balances, balance);
        }
    }

    return balance;
};

export const formatRecord = (record, { net, chain, logo, type }) => {
    record.chainLogo = logo;
    record.chain = chain;

    if ((DP_COSMOS[chain] || DP_COSMOS[net]) && !record.balanceType) {
        record = cosmosChainTokens(record, { chain, net });
    }

    if (type === 'asset' && !record.balanceType && !record.id && record.address) {
        record.id = `${record.chain}:${type}__${record.address}:${record.symbol}`;
    }

    if (!record.balanceType && !record.address && !record.id) {
        record.id = `${record.chain}:${type}__native:${record.symbol}`;
    }

    if (type === 'nft' && record.collection) {
        record.id = `${record.chain}:${type}__collection__${record.collection?.address}:${record?.token?.symbol}`;
    }

    return record;
};

// =================================================================================================================

export const getTotalBalance = (records, balance = BigNumber(0)) => {
    const totalSum = records.reduce((acc, token) => {
        return acc.plus(+token.balanceUsd || 0);
    }, BigNumber(0));

    return balance.plus(totalSum);
};

// =================================================================================================================

export const prepareChainWithAddress = (addressesObj, currentChainInfo) => {
    const CHUNK_SIZE = 2;

    const { net: currentChain, ecosystem } = currentChainInfo;
    const cosmosChains = JSON.parse(localStorage.getItem('networks/cosmos')) || {};

    const addrList = Object.entries(addressesObj).map(([key, value]) => ({
        chain: key,
        info: ecosystem === ECOSYSTEMS.COSMOS ? { ...value, logo: cosmosChains[key]?.logo || value.logo } : value,
    }));

    // Prioritize current chain
    const sortedByCurrChain = _.orderBy(addrList, (item) => (item.chain === currentChain ? 0 : 1), ['asc']);

    // Chunking addresses for fetching balances in parallel
    const chunkedAddresses = _.chunk(sortedByCurrChain, CHUNK_SIZE);

    return {
        chunkedAddresses,
        addresses: sortedByCurrChain,
        ecosystem,
    };
};

export const setNativeTokensPrices = async (store, account) => {
    const chainList = computed(() => store.getters['networks/zometNetworksList']);
    const nets = new Set();

    for (const network of chainList.value) {
        const { native_token } = network || {};
        if (native_token.price) {
            continue;
        }

        const nativeToken = computed(() => store.getters['tokens/getNativeTokenForChain'](account, network.net));

        if (nativeToken.value) {
            native_token.price = nativeToken.value.price;
            continue;
        }

        const id = native_token.coingecko_id || network.coingecko_id;
        if (id) {
            nets.add(id);
        }
    }

    if (!nets.size) {
        return;
    }

    const prices = await PricesModule.Coingecko.marketCapForNativeCoin([...nets].join(','));

    for (const network of chainList.value) {
        const { native_token } = network || {};
        if (native_token.price) {
            continue;
        }

        const id = native_token.coingecko_id || network.coingecko_id;
        if (!id) {
            return;
        }

        const price = prices[id];
        if (!price) {
            return;
        }

        const { usd = {} } = price;
        native_token.price = usd?.price;
    }
};
