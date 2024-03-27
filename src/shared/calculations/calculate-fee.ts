import { IQuoteRoute } from '@/modules/bridge-dex/models/Response.interface';

import BigNumber from 'bignumber.js';

// Calculate fee by currency (USD or native token symbol)
export const calculateFeeByCurrency = (route: IQuoteRoute, currency: string) => {
    const { fee = [] } = route || {};

    // !Return Infinity if fee is empty (no fee)
    if (!fee.length) {
        return BigNumber(Infinity);
    }

    return fee.filter((fee) => fee.currency === currency).reduce((total, fee) => total.plus(fee.amount), BigNumber(0));
};

export const calculateFeeInNativeToUsd = (route: IQuoteRoute, { symbol, price }: { symbol: string; price: string }) => {
    const feeInNative = calculateFeeByCurrency(route, symbol);

    // !Return Infinity if feeInNative is Infinity
    if (feeInNative.toString() === 'Infinity') {
        return BigNumber(Infinity);
    }

    return feeInNative.times(price);
};

export const convertFeeToCurrency = (fee: BigNumber, price: string) => {
    return fee.times(price);
};

export const calculateMinAmount = (amount: string, slippage: number) => {
    const slippageProcent = slippage / 100;

    return BigNumber(amount).multipliedBy(1 - slippageProcent).toString();
};
