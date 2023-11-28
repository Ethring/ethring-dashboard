import _ from 'lodash';
import BigNumber from 'bignumber.js';

import { cosmologyConfig } from '@/Adapter/config';
import { DP_COSMOS } from '@/api/data-provider';

// const formatRecord = (record, { net, chain, logo }) => {
//     if (!record.address) {
//         record.id = `${net}:asset__native:${record.symbol}`;

//         const [cosmosChain] = cosmologyConfig.assets.filter(({ chain_name }) => chain_name === chain) || [];

//         const { assets } = cosmosChain || {};

//         const [nativeToken] = assets || [];

//         record.address = nativeToken?.base || null;
//     } else {
//         record.id = `${net}:asset__${record.address}:${record.symbol}`;
//     }

//     record.chainLogo = logo;
//     record.chain = net;

//     return record;
// };

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
        record.id = `${net}:asset__native:${record.symbol}`;
    }

    return record;
};

export const formatRecord = (record, { net, chain, logo }) => {
    record.chainLogo = logo;
    record.chain = net;

    if ((DP_COSMOS[chain] || DP_COSMOS[net]) && !record.balanceType) {
        record = cosmosChainTokens(record, { chain, net });
    }

    if (!record.balanceType && record.address && !record.id) {
        record.id = `${net}:asset__${record.address}:${record.symbol}`;
    } else if (!record.balanceType && !record.address && !record.id) {
        record.id = `${net}:asset__native:${record.symbol}`;
    }

    if (record.symbol === 'OSMO') {
        record.logo = 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png';
    }

    return record;
};

export const formatRecords = (records, { net, chain, logo }) => {
    for (const record of records) {
        formatRecord(record, { net, chain, logo });
    }

    return records;
};

export const getTotalBalance = (records, totalBalance = BigNumber(0)) => {
    const totalSum = records.reduce((acc, token) => {
        return acc.plus(+token.balanceUsd || 0);
    }, BigNumber(0));

    return totalBalance.plus(totalSum);
};
