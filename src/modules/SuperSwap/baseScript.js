import store from '../../store/index';

import { toMantissa } from '@/helpers/numbers';

import { services as bridgeServices } from '../../config/bridgeServices';

import { services as swapServices } from '../../config/dexServices';

import { chainIds } from '../../config/availableNets';

import { STATUSES, ERRORS, NATIVE_CONTRACT } from '@/shared/constants/superswap/constants';

import { checkErrors } from '../../helpers/checkErrors';

export async function findBestRoute(amount, walletAddress) {
    try {
        const fromNetwork = store.getters['bridge/selectedSrcNetwork'];
        const toNetwork = store.getters['bridge/selectedDstNetwork'];
        const fromToken = store.getters['tokens/fromToken'];
        const toToken = store.getters['tokens/toToken'];

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
            return { bestRoute, otherRoutes: result.otherRoutes };
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
                    return { bestRoute: getRouteCalculated(bestRoute, result2), otherRoutes: getOtherRoutes(result1, result2) };
                }
            } else if (fromToken.address) {
                const result3 = await getBestRoute(getParams(fromNetwork, fromToken, fromNetwork, fromNetwork, amount, walletAddress));
                if (result3.bestRoute) {
                    const { bestRoute: bestRoute1 } = result3;
                    const params2 = getParams(fromNetwork, fromNetwork, toNetwork, toToken, result3.bestRoute.toTokenAmount, walletAddress);
                    const result4 = await findRoute(params2);
                    if (result4.bestRoute) {
                        return { bestRoute: getRouteCalculated(bestRoute1, result4), otherRoutes: getOtherRoutes(result3, result4) };
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
    try {
        let bestRoute = {};
        let otherRoutes = [];
        let bestRouteExist = false;
        let services = [];
        let apiRoute = null;
        let error = null;

        if (params.fromNet === params.toNet) {
            services = swapServices;
            apiRoute = 'swap/estimateSwap';
        } else {
            services = bridgeServices;
            apiRoute = 'bridge/estimateBridge';
        }

        const checkFee = (resEstimate) => {
            if (+params.fromNetwork.balance === 0) {
                return true;
            }

            if (resEstimate.fee.currency === params.fromNetwork.symbol && resEstimate.fee.amount > params.fromNetwork.balance) {
                return true;
            }

            if (
                resEstimate.fee.currency === params.fromToken.symbol &&
                +resEstimate.fee.amount + +params.amount > params.fromToken.balance
            ) {
                return true;
            }
        };

        const formatRouteInfo = (bestRoute, params, service) => ({
            ...bestRoute,
            routes: [
                {
                    ...bestRoute,
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

        const getFeeInfo = (info, params, service) => {
            if (service.protocolFee) {
                return +service.protocolFee[params.fromNetwork.chain_id] * +params.fromNetwork?.price;
            }

            if (info.fee.currency === params.fromToken.symbol) {
                return info.fee.amount * (+params.fromToken.price || +params.fromToken.price);
            }

            return info.fee.amount * +params.fromNetwork?.price;
        };

        const promises = services.map(async (service) => {
            params.url = service.url;

            const resEstimate = await store.dispatch(apiRoute, params);

            if (resEstimate.error) {
                if (resEstimate.error === ERRORS.BRIDGE_ERROR) {
                    error = ERRORS.BRIDGE_ERROR;
                }
                if (resEstimate.error?.error === 'Bad Request') {
                    error = ERRORS.ROUTE_NOT_FOUND;
                } else {
                    error = resEstimate.error;
                }
                return;
            }

            if (checkFee(resEstimate)) {
                error = ERRORS.NOT_ENOUGH_BALANCE;
                return;
            }

            error = null;

            resEstimate.estimateTime = service.estimatedTime[chainIds[params.net]];

            resEstimate.estimateFeeUsd = getFeeInfo(resEstimate, params, service);

            resEstimate.toAmountUsd = +resEstimate?.toTokenAmount * (+params.toToken.price || +params.toToken.price);

            if (!bestRoute?.toTokenAmount) {
                bestRoute = resEstimate;
                bestRoute.service = service;
            }

            const BEST_LOW_FEE =
                +resEstimate?.toAmountUsd - resEstimate.estimateFeeUsd > +bestRoute?.toAmountUsd - bestRoute.estimateFeeUsd;

            const BEST_LOW_AMOUNT = resEstimate?.toTokenAmount && bestRouteExist;

            if (BEST_LOW_FEE) {
                const route = formatRouteInfo(bestRoute, params, bestRoute.service);
                otherRoutes.push(route);
                bestRoute = resEstimate;
                bestRoute.service = service;
            } else if (BEST_LOW_AMOUNT) {
                const route = formatRouteInfo(resEstimate, params, service);
                otherRoutes.push(route);
            }

            bestRouteExist = true;
        });

        await Promise.all(promises); // finding best route

        if (error && !bestRoute.toTokenAmount) {
            return { error };
        }

        bestRoute.needApprove = await checkAllowance(
            params.net,
            params.fromToken.address,
            params.walletAddress,
            params.amount,
            params.fromToken.decimals,
            bestRoute.service
        );

        bestRoute.amount = params.amount;
        bestRoute.fromToken = params.fromToken;
        bestRoute.toToken = params.toToken;
        bestRoute.status = STATUSES.SIGNING;
        bestRoute.net = params.net;
        bestRoute.toNet = params.toNet;

        return { bestRoute, otherRoutes };
    } catch (e) {
        return checkErrors(e);
    }
}
export async function checkAllowance(net, tokenAddress, ownerAddress, amount, decimals, service) {
    let needApprove = false;

    if (checkAllowance.cache[ownerAddress]) {
        const { tokenAddress: cachedTokenAddress, service: cachedService, allowance } = checkAllowance.cache[ownerAddress];
        const checkCacheInfo = cachedTokenAddress === tokenAddress && cachedService.name === service.name;

        if (checkCacheInfo) {
            return toMantissa(amount, decimals) > allowance;
        }
    }

    if (!tokenAddress) {
        return needApprove;
    }

    const resAllowance = await store.dispatch(service?.type + '/getAllowance', {
        net,
        tokenAddress,
        ownerAddress,
        url: service.url,
    });

    const { allowance } = resAllowance;

    if (toMantissa(amount, decimals) > allowance) {
        needApprove = true;
    }
    checkAllowance.cache[ownerAddress] = { tokenAddress, service, allowance };

    return needApprove;
}
checkAllowance.cache = {};

// export async function getTokensByService(chainId) {
//     const allService = swapServices.concat(bridgeServices).filter((elem) => elem.tokensByChain);
//     const allTokens = {};
//     for (const service of allService) {
//         const params = {
//             chainId,
//             url: service.url,
//         };

//         const list = await store.dispatch(`bridge/getTokensByChain`, params);
//         allTokens[service.name] = list;
//     }
//     store.dispatch(`bridge/setTokensByChain`, allTokens);
// }
