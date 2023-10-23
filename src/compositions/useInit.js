import { computed } from 'vue';
import _ from 'lodash';

import { ECOSYSTEMS } from '@/Adapter/config';
import { getBalancesByAddress } from '@/api/data-provider';

import BigNumber from 'bignumber.js';

import IndexedDBService from '@/modules/indexedDb';

import { getTotalFuturesBalance, BALANCES_TYPES } from '@/shared/utils/assets';

// =================================================================================================================

// Cancel request

// let abortController = new AbortController();
// let { signal } = abortController;

// function cancelCurrentOperations() {
//     abortController.abort(); // Отмена всех текущих операций
//     abortController = new AbortController(); // Создание нового AbortController
//     signal = abortController.signal; // Получение нового сигнала
// }

// =================================================================================================================

const CHUNK_SIZE = 5;

const COSMOS_CHAIN_ID = {
    cosmoshub: 'cosmos',
    osmosis: 'osmosis',
    juno: 'juno',
    injective: 'injective',
    kujira: 'kujira',
    crescent: 'crescent',
    mars: 'mars',
    stargaze: 'stargaze',
    terra2: 'terra2',
};
// =================================================================================================================

const RESET_ACTIONS = [
    ['tokens/setLoader', true],
    ['tokens/setFromToken', null],
    ['tokens/setToToken', null],
    ['bridge/setSelectedSrcNetwork', null],
    ['bridge/setSelectedDstNetwork', null],
];

async function performActions(actions, store) {
    await Promise.all(actions.map(([action, payload]) => store.dispatch(action, payload)));
}

// =================================================================================================================

const arrayFromObject = (object) => Object.entries(object).map(([key, value]) => ({ chain: key, info: value }));

// =================================================================================================================

const saveOrGetDataFromCache = async (key, data) => {
    const dataExist = Object.keys(data).length;

    if (dataExist) {
        await IndexedDBService.saveData(key, data);
        return data;
    }
    const cachedData = await IndexedDBService.getData(key);

    return cachedData || {};
};

// =================================================================================================================

const formatRecords = (records, { chain, chainAddress, logo }) => {
    for (const record of records) {
        if (!record.address) {
            record.id = `${chainAddress}:${chain}:asset__native:${record.symbol}`;
        } else {
            record.id = `${chainAddress}:${chain}:asset__${record.address}:${record.symbol}`;
        }

        record.chainLogo = logo;
        record.chain = chain;
    }

    return records;
};

const getTotalBalance = (records, totalBalance) => {
    const totalSum = records.reduce((acc, token) => {
        return acc.plus(+token.balanceUsd || 0);
    }, BigNumber(0));

    totalBalance = totalBalance.plus(totalSum);

    return totalBalance;
};

const integrationsForSave = (integrations, { chain, logo, chainAddress }) => {
    let balance = BigNumber(0);

    for (const integration of integrations) {
        integration.balances = formatRecords(integration.balances, { chain, chainAddress, logo });

        if (integration.type === BALANCES_TYPES.FUTURES) {
            balance = getTotalFuturesBalance(integration.balances, balance);
        } else {
            balance = getTotalBalance(integration.balances, balance);
        }
    }

    return {
        list: integrations,
        balance,
    };
};

// =================================================================================================================

export default async function useInit(store, { addressesWithChains = {}, account = null, currentChainInfo } = {}) {
    store.dispatch('tokens/setLoader', true);

    const allTokensForAccount = computed(() => store.getters['tokens/tokens'][account] || []);
    const allTokensBalance = computed(() => store.getters['tokens/totalBalances'][account] || 0);

    if (allTokensForAccount.value.length > 0 && allTokensBalance.value) {
        return store.dispatch('tokens/setLoader', false);
    }

    const disableLoader = computed(() => store.getters['tokens/disableLoader']);

    const disableLoaderActions = [['tokens/setDisableLoader', false]];

    const actionsToPerform = disableLoader.value ? disableLoaderActions : RESET_ACTIONS;

    performActions(actionsToPerform, store).catch((error) => {
        console.error('An error occurred:', error);
    });

    // cancelCurrentOperations();

    let totalBalance = BigNumber(0);

    const { net: currentChain, ecosystem } = currentChainInfo;

    const addresses = arrayFromObject(addressesWithChains);

    const sortedByCurrChain = _.orderBy(
        addresses,
        [
            // Current chain first
            (item) => (item.chain === currentChain ? 0 : 1),
            // Then by chain
            (item) => _.indexOf(Object.keys(COSMOS_CHAIN_ID), item.chain),
        ],
        ['asc', 'desc']
    );

    const chunkedAddresses = _.chunk(sortedByCurrChain, CHUNK_SIZE);

    const allTokens = [];
    const allIntegrations = [];

    const progressChunk = async (chunk) => {
        for (const { chain, info } of chunk) {
            store.dispatch('tokens/setLoadingByChain', { chain, value: true });

            const { logo, address: chainAddress } = info;

            const chainForRequest = COSMOS_CHAIN_ID[chain] || chain;

            if (ecosystem === ECOSYSTEMS.COSMOS && !COSMOS_CHAIN_ID[chain]) {
                store.dispatch('tokens/setLoadingByChain', { chain, value: false });
                continue;
            }

            // const response = (await getBalancesByAddress(chainForRequest, chainAddress, { signal })) || {};
            const response = (await getBalancesByAddress(chainForRequest, chainAddress)) || {};

            const {
                tokens = [],
                integrations = [],
                nfts = [],
            } = await saveOrGetDataFromCache(`${account}-${chainForRequest}-${chainAddress}`, response);

            if (!tokens.length && !integrations.length && !nfts.length) {
                store.dispatch('tokens/setLoadingByChain', { chain, value: false });
                continue;
            }

            if (tokens.length) {
                const tokensForSave = formatRecords(tokens, { chain, chainAddress, logo });

                totalBalance = getTotalBalance(tokensForSave, totalBalance);

                allTokens.push(...tokensForSave);
            }

            if (integrations.length) {
                const { list, balance } = integrationsForSave(integrations, { chain, logo, chainAddress });

                totalBalance = totalBalance.plus(balance);

                allIntegrations.push(...list);
            }

            store.dispatch('tokens/setGroupTokens', { chain, account, data: { list: tokens } });

            store.dispatch('tokens/setDataFor', { type: 'tokens', account, data: allTokens });

            store.dispatch('tokens/setDataFor', { type: 'integrations', account, data: allIntegrations });

            store.dispatch('tokens/setTotalBalances', { account, data: totalBalance.toNumber() });

            store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
        }
    };

    // Проходим по chunk и обрабатываем их
    for (const part in chunkedAddresses) {
        await progressChunk(chunkedAddresses[part]);
    }

    store.dispatch('tokens/setLoader', false);
}
