import BigNumber from 'bignumber.js';

import { BalanceType, AssetBalance, IntegrationBalance, NftBalance, RecordList, RecordOptions } from './models/types';
import { Type, IntegrationBalanceType } from './models/enums';

export const getTotalBalance = (records: AssetBalance[], balance = BigNumber(0)) => {
    const totalSum = records.reduce((acc, token) => {
        return acc.plus(+token.balanceUsd || 0);
    }, BigNumber(0));

    return balance.plus(totalSum);
};

export const getIntegrationsBalance = (integrations: IntegrationBalance[]) => {
    let balance = BigNumber(0);

    for (const integration of integrations) {
        const { balances = [] } = integration;

        const isFutures = integration.type === IntegrationBalanceType.FUTURES;
        const isBorrowAndLending = integration.type === IntegrationBalanceType.BORROW_AND_LENDING;

        if (isBorrowAndLending || isFutures) {
            balance = getTotalBalanceByDiff(balances as AssetBalance[], balance);
        } else {
            balance = getTotalBalance(balances as AssetBalance[], balance);
        }
    }

    return balance;
};

export const getTotalBalanceByDiff = (records: AssetBalance[], totalBalance = BigNumber(0)) => {
    let borrowTotalUsd = BigNumber(0);
    let depositTotalUsd = BigNumber(0);

    for (let token of records) {
        if (token.balanceType === IntegrationBalanceType.BORROW) {
            borrowTotalUsd = borrowTotalUsd.plus(+token.balanceUsd);
        } else {
            depositTotalUsd = depositTotalUsd.plus(+token.balanceUsd);
        }
    }

    totalBalance = totalBalance.plus(depositTotalUsd.minus(borrowTotalUsd));

    return totalBalance;
};
