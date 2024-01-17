import BigNumber from 'bignumber.js';
import Moment from 'moment';

import { sortByKey } from '@/helpers/utils';

import { ONE_DAY, ONE_HOUR } from '@/shared/constants/operations';

export const BALANCES_TYPES = {
    ALL: 'ALL',
    PENDING: 'PENDING_REWARD',
    FUTURES: 'FUTURES',
    LEVERAGE_POSITION: 'LEVERAGE_POSITION',
    BORROW: 'BORROW',
};

export const getTotalBalanceByType = (balances, type = BALANCES_TYPES.ALL) => {
    if (!balances.length) {
        return 0;
    }

    if (type === BALANCES_TYPES.FUTURES) {
        const totalBalance = getTotalFuturesBalance(balances, BigNumber(0));
        return totalBalance.toNumber();
    }

    if (type === BALANCES_TYPES.ALL) {
        return balances.reduce((sum, token) => sum.plus(+token.balanceUsd), BigNumber(0)).toNumber();
    }

    return balances
        .filter(({ balanceType }) => balanceType === type)
        .reduce((sum, token) => sum.plus(+token.balanceUsd), BigNumber(0))
        .toNumber();
};

export const getDataForIntegrations = (integration, balances) => {
    return {
        platform: integration.platform,
        data: [integration],
        logoURI: integration.logo,
        healthRate: integration?.healthRate,
        totalGroupBalance: integration.totalBalanceUsd,
        totalRewardsBalance: getTotalBalanceByType(balances, BALANCES_TYPES.PENDING),
    };
};

export const getIntegrationsGroupedByPlatform = (allIntegrations = []) => {
    if (!allIntegrations.length) {
        return [];
    }

    const groupByPlatforms = [];

    for (const integration of allIntegrations) {
        const { balances = [], apr = null } = integration || {};

        const balanceType = integration.type === BALANCES_TYPES.FUTURES ? BALANCES_TYPES.FUTURES : BALANCES_TYPES.ALL;

        integration.totalBalanceUsd = getTotalBalanceByType(balances, balanceType);

        integration.balances = balances.map((item) => {
            item.apr = apr;
            item.leverageRate = integration.leverageRate;
            return item;
        });

        const existingGroup = groupByPlatforms.find(({ platform }) => platform === integration.platform);

        if (existingGroup) {
            existingGroup.totalGroupBalance += integration.totalBalanceUsd;
            existingGroup.totalRewardsBalance += getTotalBalanceByType(balances, BALANCES_TYPES.PENDING);

            existingGroup.data.push(integration);

            if (integration.healthRate) {
                existingGroup.healthRate = integration.healthRate;
            }

            continue;
        }

        groupByPlatforms.push(getDataForIntegrations(integration, balances));
    }

    groupByPlatforms.forEach((groupItem, i) => {
        groupByPlatforms[i].data = sortByKey(groupItem.data, 'totalBalanceUsd');
    });

    return sortByKey(groupByPlatforms, 'totalGroupBalance');
};

export const getFormattedName = (str) => {
    if (!str) {
        return str;
    }

    return str.charAt(0).toUpperCase() + str.replaceAll('_', ' ').toLowerCase().slice(1);
};

export const getFormattedDate = (timestamp) => {
    return Moment(+timestamp * 1000).format('DD.MM.YYYY  h:mm');
};

export function getTimeCountdown(timestamp) {
    const timeDifference = Moment(+timestamp * 1000).diff(Moment(), 'milliseconds');

    const days = Math.floor(timeDifference / ONE_DAY);

    if (days > 0) {
        return `${days} days`;
    }

    const hours = Math.floor((timeDifference % ONE_DAY) / ONE_HOUR);

    if (hours > 0) {
        return `${hours} hours`;
    }

    const minutes = Math.floor((timeDifference % ONE_HOUR) / (1000 * 60));

    if (minutes > 0) {
        return `${minutes} minutes`;
    }

    return 'is available';
}

export const getTotalFuturesBalance = (records, totalBalance) => {
    let leverageTotalUsd = BigNumber(0);
    let borrowTotalUsd = BigNumber(0);

    for (let token of records) {
        if (token.balanceType === BALANCES_TYPES.LEVERAGE_POSITION) {
            leverageTotalUsd = leverageTotalUsd.plus(+token.balanceUsd);
        } else if (token.balanceType === BALANCES_TYPES.BORROW) {
            borrowTotalUsd = borrowTotalUsd.plus(+token.balanceUsd);
        }
    }

    totalBalance = totalBalance.plus(leverageTotalUsd.minus(borrowTotalUsd));

    return totalBalance;
};

const getDataForCollection = (nft) => {
    const { collection = {}, token = {} } = nft;

    return {
        ...collection,
        chainLogo: nft.chainLogo,
        totalGroupBalance: BigNumber(+nft.price || 0)
            .multipliedBy(+token.price || 0)
            .toNumber(),
        floorPriceUsd: BigNumber(+collection.floorPrice || 0)
            .multipliedBy(+token.price || 0)
            .toNumber(),
        nfts: [nft],
        token: nft.token,
    };
};

export const getNftsByCollection = (allNfts = []) => {
    const groupByCollection = [];

    if (!allNfts.length) {
        return groupByCollection;
    }

    for (const nft of allNfts) {
        const { collection = {}, token = {} } = nft || {};

        const existingCollection = groupByCollection.find((item) => item.address === collection.address);

        if (existingCollection) {
            existingCollection.totalGroupBalance += BigNumber(+nft.price || 0)
                .multipliedBy(+token.price || 0)
                .toNumber();
            existingCollection.floorPriceUsd += BigNumber(+collection.floorPrice || 0)
                .multipliedBy(+token.price || 0)
                .toNumber();
            existingCollection.nfts.push(nft);

            continue;
        }

        groupByCollection.push(getDataForCollection(nft));
    }

    return sortByKey(groupByCollection, 'totalGroupBalance');
};
