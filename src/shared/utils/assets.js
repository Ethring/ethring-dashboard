const BALANCES_TYPES = {
    ALL: 'ALL',
    PENDING: 'PENDING_REWARD',
};

export const getTotalBalanceByType = (balances, type = BALANCES_TYPES.ALL) => {
    if (!balances.length) {
        return 0;
    }

    if (type === BALANCES_TYPES.ALL) {
        return balances.reduce((sum, token) => sum + +token.balanceUsd, 0);
    }

    return balances.filter(({ balanceType }) => balanceType === type).reduce((sum, token) => sum + +token.balanceUsd, 0);
};

export const getDataForIntegrations = (integration, balances) => {
    return {
        platform: integration.platform,
        data: [integration],
        logoURI: integration.logo,
        healthRate: integration?.healthRate,
        totalGroupBalance: getTotalBalanceByType(balances, BALANCES_TYPES.ALL),
        totalRewardsBalance: getTotalBalanceByType(balances, BALANCES_TYPES.PENDING),
    };
};

export const getIntegrationsGroupedByPlatform = (allIntegrations = []) => {
    if (!allIntegrations.length) {
        return [];
    }

    const groupByPlatforms = [];

    for (const integration of allIntegrations) {
        const { balances = [] } = integration || {};

        const existingGroup = groupByPlatforms.find(({ platform }) => platform === integration.platform);

        if (existingGroup) {
            existingGroup.totalGroupBalance += getTotalBalanceByType(balances, BALANCES_TYPES.ALL);
            existingGroup.totalRewardsBalance += getTotalBalanceByType(balances, BALANCES_TYPES.PENDING);
            existingGroup.data.push(integration);

            if (integration.healthRate) {
                existingGroup.healthRate = integration.healthRate;
            }

            continue;
        }

        groupByPlatforms.push(getDataForIntegrations(integration, balances));
    }

    return groupByPlatforms;
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
