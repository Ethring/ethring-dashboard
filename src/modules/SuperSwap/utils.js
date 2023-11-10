import BigNumber from 'bignumber.js';

import { STATUSES } from '@/shared/constants/super-swap/constants';

export const checkFee = ({ fromNetwork, fromToken, amount, address, response, store } = {}) => {
    // ==============================================================================

    const { native_token: nativeToken } = fromNetwork;
    const { symbol: nativeTokenSymbol } = nativeToken || {};
    const nativeTokenInfo = store.getters['tokens/getTokenBySymbol'](address, nativeTokenSymbol);

    // ==============================================================================

    const { fee } = response;
    const { currency, amount: feeAmount } = fee || {};

    // ==============================================================================

    const { balance: nativeTokenBalance } = nativeTokenInfo || {};

    const isEnoughForPayFeeNative = currency === nativeTokenSymbol && BigNumber(nativeTokenBalance).gt(feeAmount);

    if (isEnoughForPayFeeNative) {
        return false;
    }

    // ==============================================================================

    const { symbol: fromTokenSymbol, balance: fromTokenBalance } = fromToken || {};

    const isEnoughForPayFeeToken = currency === fromTokenSymbol && BigNumber(feeAmount).plus(amount).lt(fromTokenBalance);

    if (isEnoughForPayFeeToken) {
        return false;
    }

    // ==============================================================================

    // * Not enough balance for pay fee
    return true;
};

export const getFeeInfo = ({ fee }, { fromNetwork, fromToken }, { protocolFee }) => {
    const { currency, amount: feeAmount } = fee;

    const { native_token: nativeToken, chain_id } = fromNetwork;
    const { price: nativeTokenPrice } = nativeToken || {};
    const { symbol: tokenSymbol, price: tokenPrice } = fromToken || {};

    let pFee = 0;

    if (protocolFee && protocolFee[chain_id]) {
        pFee = BigNumber(protocolFee[chain_id]).times(nativeTokenPrice).toNumber();
    }

    if (currency === tokenSymbol) {
        return BigNumber(feeAmount).times(tokenPrice).plus(pFee).toNumber();
    }

    return BigNumber(feeAmount).times(nativeTokenPrice).plus(pFee).toNumber();
};

export const formatRouteInfo = (route, params, service) => ({
    ...route,
    serviceId: service.id,
    routes: [
        {
            ...route,
            service,
            net: params.net,
            toNet: params.toNet,
            fromToken: params.fromToken,
            toToken: params.toToken,
            status: STATUSES.SIGNING,
            amount: params.amount,
        },
    ],
});
