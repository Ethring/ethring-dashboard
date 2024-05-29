import { lowerCase } from 'lodash';

import { DP_COSMOS } from '@/core/balance-provider/models/enums';
import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import { BalanceType, AssetBalance, IntegrationBalance, NftBalance, RecordList, RecordOptions } from '@/core/balance-provider/models/types';

import { Type } from '@/core/balance-provider/models/enums';

// * Format facade for balance records, used to format the response from the data provider
export const formatResponse = (
    type: BalanceType,
    balances: RecordList,
    opt: RecordOptions = {},
): AssetBalance[] | IntegrationBalance[] | NftBalance[] => {
    switch (type) {
        case Type.tokens:
            return balances.map((balance: any) => formatRecord(type, balance as AssetBalance, opt));
        case Type.integrations:
            return balances.map((integration: any) => formatIntegration(integration, opt));
        case Type.nfts:
            return balances.map((nft: any) => formatNft(type, nft as NftBalance, opt));
    }
};

// * The integration record formatter used to format the response from the data provider
const formatIntegration = (integration: IntegrationBalance, opt: RecordOptions = {}): IntegrationBalance => {
    const { chain, store, logo } = opt;

    if (integration.platform) {
        integration.platform = integration.platform.replace('_', ' ');
        integration.id = `${chain}:integration__${integration.platform}:${integration.type}:${integration.stakingType}`;
    }

    if (integration.validator && integration.validator?.address) integration.id = `${integration.id}:${integration.validator.address}`;

    if (integration.address) integration.id = `${integration.id}:${integration.address}`;

    if (integration.integrationId) integration.id = `${chain}:integration__${integration.integrationId}`;

    if (!integration.balances.length) return integration;

    for (const balanceRecord of integration.balances) formatRecord(Type.tokens, balanceRecord as AssetBalance, { chain, store, logo });

    return integration;
};

// * The NFT record formatter used to format the response from the data provider
const formatNft = (type: BalanceType, record: NftBalance, opt: RecordOptions = {}): NftBalance => {
    const { chain, logo } = opt;

    record.chain = chain;
    record.chainLogo = logo;

    if (type === Type.nfts && record.collection)
        record.id = `${record.chain}:${type}__collection__${record.collection?.address}:${record?.tokenId}`;

    return record;
};

// * The cosmos chain tokens formatter used to format the response from the data provider, specifically for cosmos chains
const cosmosChainTokens = (record: AssetBalance, opt: RecordOptions = {}) => {
    const { chain, store, logo } = opt;

    const configFromStore = store.state?.configs?.chains[Ecosystem.COSMOS] || {};

    const { native_token: nativeToken } = configFromStore[chain] || {};

    if (record.address && record.address.startsWith('IBC')) {
        record.address = record.address.replace('IBC', 'ibc');
        record.base = record.address;
    }

    if (!record.base && record.address && record.address.length <= 5) record.base = record.address;

    const isNativeBySymbol = lowerCase(record.symbol) === lowerCase(nativeToken?.symbol);

    if (isNativeBySymbol) {
        record.id = `${chain}:${Type.tokens}__native:${record.symbol}`;
        record.base = lowerCase(record.base);
        record.address = lowerCase(record.address);
        record.logo = logo;
    }

    return record;
};

// * The base record formatter used to format the response from the data provider
const formatRecord = (type: BalanceType, record: AssetBalance, opt: RecordOptions = {}): AssetBalance => {
    const { chain, logo, nativeTokenLogo } = opt;

    record.chain = chain;
    record.chainLogo = logo;

    if (record.symbol.startsWith('IBC.')) record.symbol = record.symbol.replace('IBC.', '') || record.symbol;

    if (DP_COSMOS[chain] && !record.balanceType) record = cosmosChainTokens(record, opt);

    if (type === Type.tokens && !record.balanceType && !record.id && record.address)
        record.id = `${record.chain}:${type}__${record.address}:${record.symbol}`;

    if (!record.balanceType && !record.address && !record.id) {
        record.id = `${record.chain}:${type}__native:${record.symbol}`;
        record.logo = nativeTokenLogo;
    }

    return record;
};
