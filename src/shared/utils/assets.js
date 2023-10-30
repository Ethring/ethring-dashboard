import BigNumber from 'bignumber.js';

import { sortByKey } from '@/helpers/utils';

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

        integration.balances = sortByKey(balances, 'balanceUsd').map((item) => {
            item.apr = apr;
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
    const date = new Date(+timestamp * 1000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
};

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
