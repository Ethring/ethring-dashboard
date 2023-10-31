import BigNumber from 'bignumber.js';
import { estimateBridge, estimateSwap } from '@/api/services';

import { getServices, SERVICE_TYPE } from '@/config/services';

import store from '../../store/index';

import { checkErrors } from '../../helpers/checkErrors';
import { checkFee, getFeeInfo, formatRouteInfo } from './utils';

import { STATUSES, ERRORS, NATIVE_CONTRACT } from '@/shared/constants/super-swap/constants';

// * ESTIMATE FOR SWAP AND BRIDGE
const ESTIMATE = {
    [SERVICE_TYPE.SWAP]: estimateSwap,
    [SERVICE_TYPE.BRIDGE]: estimateBridge,
};

// * Checking fee for response of estimate

export async function findBestRoute(amount, walletAddress, fromToken, toToken) {
    try {
        const fromNetwork = store.getters['tokenOps/srcNetwork'];
        const toNetwork = store.getters['tokenOps/dstNetwork'];

        const getParams = (fromNetwork, fromToken, toNetwork, toToken, amount, ownerAddress) => ({
            net: fromNetwork.net,
            fromNet: fromNetwork.net,
            fromTokenAddress: fromToken.address || NATIVE_CONTRACT,
            amount: amount,
            toNet: toNetwork.net,
            toTokenAddress: toToken.address || NATIVE_CONTRACT,
            fromToken,
            toToken,
            fromNetwork,
            walletAddress,
            ownerAddress,
        });

        const getBestRoute = async (params) => {
            const result = await findRoute(params);

            if (!result.bestRoute) {
                return result;
            }

            const bestRoute = {
                fromTokenAmount: amount,
                toTokenAmount: result.bestRoute.toTokenAmount,
                toAmountUsd: result.bestRoute.toTokenAmount * (+result.bestRoute.toToken.price || +result.bestRoute.toToken.price),
                estimateFeeUsd: result.bestRoute.estimateFeeUsd,
                estimateTime: result.bestRoute.estimateTime,
                routes: [result.bestRoute],
            };

            return { bestRoute, otherRoutes: result.otherRoutes, fromToken, toToken };
        };

        const getRouteCalculated = (bestRoute, result) => {
            bestRoute.toTokenAmount = result.bestRoute.toTokenAmount;
            bestRoute.estimateFeeUsd += result.bestRoute.estimateFeeUsd;
            bestRoute.toAmountUsd = result.bestRoute.toTokenAmount * (+result.bestRoute.toToken.price || +result.bestRoute.toToken.price);
            bestRoute.estimateTime += result.bestRoute.estimateTime;
            bestRoute.routes.push({ ...result.bestRoute, status: STATUSES.PENDING });

            return bestRoute;
        };

        const getOtherRoutes = (bestRoute, result) => {
            const otherRoutesList = [];

            const otherRoutesInfo = (bestRoute, otherRoutes) => {
                const { routes = [] } = otherRoutes;
                const [currentRouteInfo] = routes;

                const usdPrice = +currentRouteInfo.toToken.price || +currentRouteInfo.toToken?.price;

                const currentBestRoute = {
                    estimateFeeUsd: bestRoute.estimateFeeUsd + otherRoutes.estimateFeeUsd,
                    estimateTime: bestRoute.estimateTime + otherRoutes.estimateTime,
                    routes: [
                        {
                            ...bestRoute,
                            status: STATUSES.PENDING,
                        },
                        {
                            ...currentRouteInfo,
                            status: STATUSES.PENDING,
                        },
                    ],
                    fromTokenAmount: bestRoute.fromTokenAmount,
                    toTokenAmount: otherRoutes.toTokenAmount,
                    toAmountUsd: otherRoutes.toTokenAmount * usdPrice,
                };

                otherRoutesList.push(currentBestRoute);
            };

            if (bestRoute.otherRoutes.length) {
                bestRoute.otherRoutes.forEach((route) => {
                    route.toTokenAmount = result.bestRoute.toTokenAmount;

                    route.estimateFeeUsd += result.bestRoute.estimateFeeUsd;

                    route.toAmountUsd =
                        result.bestRoute.toTokenAmount * (+result.bestRoute.toToken.price || +result.bestRoute.toToken.price);

                    route.estimateTime += result.bestRoute.estimateTime;

                    route.routes.push({ ...result.bestRoute, status: STATUSES.PENDING });
                    delete route.service;
                    delete route.fee;
                    otherRoutesList.push(route);
                });
            }

            if (result.otherRoutes.length) {
                for (const route of result.otherRoutes) {
                    otherRoutesInfo(bestRoute.bestRoute.routes[0], route);
                }
            }

            if (bestRoute.otherRoutes.length && result.otherRoutes.length) {
                for (const mainRoute of bestRoute.otherRoutes) {
                    for (const otherRoute of result.otherRoutes) {
                        otherRoutesInfo(mainRoute.routes[0], otherRoute);
                    }
                }
            }

            return otherRoutesList;
        };

        const result = await getBestRoute(getParams(fromNetwork, fromToken, toNetwork, toToken, amount, walletAddress));

        if (result.bestRoute) {
            return result;
        }

        if (fromNetwork.net !== toNetwork.net) {
            const result1 = await getBestRoute(getParams(fromNetwork, fromToken, toNetwork, toNetwork, amount, walletAddress));
            if (result1.bestRoute) {
                const { bestRoute } = result1;
                const result2 = await findRoute(
                    getParams(toNetwork, toNetwork, toNetwork, toToken, result1.bestRoute.toTokenAmount, walletAddress)
                );
                if (result2.bestRoute) {
                    return {
                        bestRoute: getRouteCalculated(bestRoute, result2),
                        otherRoutes: getOtherRoutes(result1, result2),
                        fromToken,
                        toToken,
                    };
                }
            } else if (fromToken.address) {
                const result3 = await getBestRoute(getParams(fromNetwork, fromToken, fromNetwork, fromNetwork, amount, walletAddress));
                if (result3.bestRoute) {
                    const { bestRoute: bestRoute1 } = result3;
                    const params2 = getParams(fromNetwork, fromNetwork, toNetwork, toToken, result3.bestRoute.toTokenAmount, walletAddress);
                    const result4 = await findRoute(params2);
                    if (result4.bestRoute) {
                        return {
                            bestRoute: getRouteCalculated(bestRoute1, result4),
                            otherRoutes: getOtherRoutes(result3, result4),
                            fromToken,
                            toToken,
                        };
                    } else if (toToken.address) {
                        params2.toTokenAddress = NATIVE_CONTRACT;
                        params2.toToken = toNetwork;
                        const result5 = await findRoute(params2);
                        if (result5.bestRoute) {
                            bestRoute1.toTokenAmount = result5.bestRoute.toTokenAmount;
                            bestRoute1.estimateFeeUsd += result5.bestRoute.estimateFeeUsd;
                            bestRoute1.estimateTime += result5.bestRoute.estimateTime;
                            bestRoute1.routes.push({ ...result5.bestRoute, status: STATUSES.PENDING });
                            const swapParams2 = getParams(
                                toNetwork,
                                toNetwork,
                                toNetwork,
                                toToken,
                                result5.bestRoute.toTokenAmount,
                                walletAddress
                            );
                            const result6 = await findRoute(swapParams2);
                            if (result6.bestRoute) {
                                return {
                                    bestRoute: getRouteCalculated(bestRoute1, result6),
                                    otherRoutes: getOtherRoutes(result5, result6),
                                    fromToken,
                                    toToken,
                                };
                            }
                        }
                    }
                }
            } else {
                return { error: result.error };
            }
        }

        return { error: result.error };
    } catch (e) {
        return checkErrors(e);
    }
}

async function findRoute(params) {
    let error = null;

    const { fromNet, toNet, amount, fromNetwork, fromToken, toToken } = params;
    const isSameNet = fromNet === toNet;

    const services = isSameNet ? getServices(SERVICE_TYPE.SWAP) : getServices(SERVICE_TYPE.BRIDGE);

    let otherRoutes = [];
    let bestRoute = {};

    let bestRouteExist = false;

    try {
        const promises = services.map(async (service) => {
            error = null;

            const estimateResponse = await ESTIMATE[service.type]({ ...params, url: service.url, service, store });

            // * Check error
            if (estimateResponse.error) {
                error = ERRORS.ROUTE_NOT_FOUND;
                return;
            }

            const isNotEnoughForPayFee = checkFee({
                fromNetwork,
                fromToken,
                amount,
                address: params.walletAddress,
                response: estimateResponse,
                store,
            });

            // * Check Fee not enough error
            if (isNotEnoughForPayFee) {
                error = ERRORS.NOT_ENOUGH_BALANCE;
                return;
            }

            // ==============================================================================

            estimateResponse.estimateTime = service.estimatedTime[fromNetwork?.chain_id] || 30;

            estimateResponse.estimateFeeUsd = getFeeInfo(estimateResponse, params, service);
            estimateResponse.toAmountUsd = BigNumber(estimateResponse.toTokenAmount).times(toToken.price).toNumber();

            // ==============================================================================

            if (!bestRoute?.toTokenAmount) {
                bestRoute = estimateResponse;
                bestRoute.service = service;
            }

            const estimateFee = BigNumber(estimateResponse?.toAmountUsd).minus(estimateResponse.estimateFeeUsd);
            const bestLowFee = BigNumber(bestRoute?.toAmountUsd).minus(bestRoute.estimateFeeUsd);

            const BEST_LOW_FEE = estimateFee.lt(bestLowFee);
            const BEST_LOW_AMOUNT = estimateResponse?.toTokenAmount && bestRouteExist;

            if (BEST_LOW_FEE) {
                const route = formatRouteInfo(bestRoute, params, bestRoute.service);
                otherRoutes.push(route);
                bestRoute = estimateResponse;
                bestRoute.service = service;
            } else if (BEST_LOW_AMOUNT) {
                const route = formatRouteInfo(estimateResponse, params, service);
                otherRoutes.push(route);
            }

            bestRouteExist = true;
        });

        await Promise.all(promises); // finding best route

        if (error && !bestRoute.toTokenAmount) {
            return { error };
        }

        bestRoute.amount = params.amount;
        bestRoute.fromToken = params.fromToken;
        bestRoute.toToken = params.toToken;
        bestRoute.status = STATUSES.SIGNING;
        bestRoute.net = params.net;
        bestRoute.toNet = params.toNet;

        return { bestRoute, otherRoutes, error };
    } catch (error) {
        return checkErrors(error);
    }
}
