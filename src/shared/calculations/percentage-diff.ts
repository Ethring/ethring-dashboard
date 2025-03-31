import BigNumber from 'bignumber.js';

import { NetworkData, TokenData } from '@/shared/models/types/TokenData';
import { assignPriceInfo } from '@/shared/utils/prices';

import logger from '@/shared/logger';

type DiffArgs = {
    srcNetwork: NetworkData;
    dstNetwork: NetworkData;
    srcToken: TokenData;
    dstToken: TokenData;
    srcAmount: number;
    dstAmount: number;
};
/**
 * * Calculate the difference in percentage between two token amounts in USD
 *
 * @formula Difference in percentage = ∣n2 - n1∣ / n1 * 100%
 *
 * @example #1 Positive difference: n1 = 100, n2 = 150, ===>  ∣150 - 100∣ / 100 * 100% = +50%
 * @example #2 Negative difference: n1 = 3.25, n2 = 0.5, ===>  ∣0.5 - 3.25∣ / 3.25 * 100% = -84.62%
 *
 * */
export const differenceInPercentage = ({ srcNetwork, dstNetwork, srcToken, dstToken, srcAmount, dstAmount }: DiffArgs) => {
    // !IMPORTANT: Assign the price info to the tokens, if it's not already there
    assignPriceInfo(srcNetwork, srcToken);
    assignPriceInfo(dstNetwork, dstToken);

    const { price: srcPrice = null } = srcToken || {};
    const { price: dstPrice = null } = dstToken || {};

    // !IMPORTANT: If any of the prices or amounts are not available, return 0
    if (!srcPrice || !dstPrice || !srcAmount || !dstAmount) return 0;

    const n1 = BigNumber(srcPrice).multipliedBy(srcAmount);
    const n2 = BigNumber(dstPrice).multipliedBy(dstAmount);

    if (n1.isEqualTo(0) || n2.isEqualTo(0)) {
        logger.warn(`[differenceInPercentage] n1 or n2 is 0: n1=${n1}, n2=${n2}; Cannot calculate the difference in percentage`);
        return 0;
    }

    //∣n2 - n1∣ / n1 * 100%
    return n2.minus(n1).dividedBy(n1).multipliedBy(100).toFixed(2);
};
