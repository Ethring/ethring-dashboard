import store from '../../store/index';

import { toMantissa } from '@/helpers/numbers';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

import { services as bridgeServices } from '../../config/bridgeServices';

import { services as swapServices } from '../../config/dexServices';

import { chainIds } from '../../config/availableNets';

import { STATUSES, ERRORS, NATIVE_CONTRACT } from '@/shared/constants/superswap/constants';

export async function findBestRoute(amount, walletAddress) {
    try {
        const fromNetwork = store.getters['bridge/selectedSrcNetwork'];
        const toNetwork = store.getters['bridge/selectedDstNetwork'];
        const fromToken = store.getters['tokens/fromToken'];
        const toToken = store.getters['tokens/toToken'];

        const getParams = (fromNetwork, fromToken, toNetwork, toToken, amount) => ({
            net: fromNetwork.net,
            fromNet: fromNetwork.net,
            fromTokenAddress: fromToken.address || NATIVE_CONTRACT,
            amount: prettyNumberTooltip(amount, fromToken.decimals),
            toNet: toNetwork.net,
            toTokenAddress: toToken.address || NATIVE_CONTRACT,
            fromToken,
            toToken,
            fromNetwork,
            walletAddress,
        });

        const getBestRoute = async (params) => {
            const result = await findRoute(params);
            if (!result.bestRoute) {
                return result;
            }

            const bestRoute = {
                fromTokenAmount: amount,
                toTokenAmount: result.bestRoute.toTokenAmount,
                toAmountUsd:
                    result.bestRoute.toTokenAmount * (result.bestRoute.toToken.balance.price?.USD || result.bestRoute.toToken.price?.USD),
                estimateFeeUsd: result.bestRoute.estimateFeeUsd,
                estimateTime: result.bestRoute.estimateTime,
                routes: [result.bestRoute],
            };
            return { bestRoute, otherRoutes: result.otherRoutes };
        };

        const getRouteCalculated = (bestRoute, result) => {
            bestRoute.toTokenAmount = result.bestRoute.toTokenAmount;
            bestRoute.estimateFeeUsd += result.bestRoute.estimateFeeUsd;
            bestRoute.toAmountUsd =
                result.bestRoute.toTokenAmount * (result.bestRoute.toToken.balance.price?.USD || result.bestRoute.toToken.price?.USD);
            bestRoute.estimateTime += result.bestRoute.estimateTime;
            bestRoute.routes.push({ ...result.bestRoute, status: STATUSES.PENDING });
            return bestRoute;
        };

        const getOtherRoutes = (bestRoute, result) => {
            const otherRoutesList = [];

            const otherRoutesInfo = (bestRoute, otherRoutes) => {
                const { routes = [] } = otherRoutes;

                const [currentRouteInfo] = routes;

                const usdPrice = currentRouteInfo.toToken.balance?.price?.USD || currentRouteInfo.toToken?.price?.USD;

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
                        result.bestRoute.toTokenAmount *
                        (result.bestRoute.toToken.balance.price?.USD || result.bestRoute.toToken.price?.USD);

                    route.estimateTime += result.bestRoute.estimateTime;

                    route.routes.push({ ...result.bestRoute, status: 'pending' });
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
                        otherRoutesInfo(mainRoute.routes, otherRoute);
                    }
                }
            }

            return otherRoutesList;
        };

        const result = await getBestRoute(getParams(fromNetwork, fromToken, toNetwork, toToken, amount));
        if (result.bestRoute) {
            return result;
        }

        if (fromNetwork.net !== toNetwork.net) {
            const result1 = await getBestRoute(getParams(fromNetwork, fromToken, toNetwork, toNetwork, amount));
            if (result1.bestRoute) {
                const { bestRoute } = result1;
                const result2 = await findRoute(getParams(toNetwork, toNetwork, toNetwork, toToken, result1.bestRoute.toTokenAmount));

                if (result2.bestRoute) {
                    return { bestRoute: getRouteCalculated(bestRoute, result2), otherRoutes: getOtherRoutes(result1, result2) };
                }
            } else if (fromToken.address) {
                const result3 = await getBestRoute(getParams(fromNetwork, fromToken, fromNetwork, fromNetwork, amount));
                if (result3.bestRoute) {
                    const { bestRoute: bestRoute1 } = result3;
                    const params2 = getParams(fromNetwork, fromNetwork, toNetwork, toToken, result3.bestRoute.toTokenAmount);
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
                            const swapParams2 = getParams(toNetwork, toNetwork, toNetwork, toToken, result5.bestRoute.toTokenAmount);
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
        return { error: e.message || e };
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
        const tokensByService = store.getters['bridge/tokensByService'];

        if (params.fromNet === params.toNet) {
            services = swapServices;
            apiRoute = 'swap/estimateSwap';
        } else {
            services = bridgeServices;
            apiRoute = 'bridge/estimateBridge';
        }

        const checkFee = (resEstimate) => {
            if (+params.fromNetwork.balance?.mainBalance === 0) {
                return true;
            }
            if (resEstimate.fee.currency === params.fromNetwork.code && resEstimate.fee.amount > params.fromNetwork.balance?.mainBalance) {
                return true;
            }
            if (
                resEstimate.fee.currency === params.fromToken.code &&
                +resEstimate.fee.amount + +params.amount > params.fromToken.balance?.amount
            ) {
                return true;
            }
        };

        await Promise.all(
            services.map(async (service) => {
                params.url = service.url;
                if (service.tokensByChain) {
                    if (
                        params.fromTokenAddress &&
                        !tokensByService[service.name]?.find((elem) => elem.address.toLowerCase() === params.fromTokenAddress.toLowerCase())
                    ) {
                        error = ERRORS.BRIDGE_ERROR;
                        return;
                    }
                    if (service.isStableSwap) {
                        if (
                            params.toTokenAddress &&
                            !tokensByService[service.name]?.find(
                                (elem) => elem.address.toLowerCase() === params.toTokenAddress.toLowerCase()
                            )
                        ) {
                            error = ERRORS.BRIDGE_ERROR;
                            return;
                        }
                    }
                }
                const resEstimate = await store.dispatch(apiRoute, params);
                if (resEstimate.error) {
                    if (resEstimate.error === ERRORS.BRIDGE_ERROR) {
                        return { error: ERRORS.BRIDGE_ERROR };
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

                if (resEstimate.fee.currency === params.fromToken.code) {
                    resEstimate.estimateFeeUsd =
                        resEstimate.fee.amount * (params.fromToken.balance.price?.USD || params.fromToken.price?.USD);
                } else {
                    resEstimate.estimateFeeUsd = resEstimate.fee.amount * params.fromNetwork?.price?.USD;
                }
                if (service.protocolFee) {
                    resEstimate.estimateFeeUsd += +service.protocolFee[params.fromNetwork.chain_id] * params.fromNetwork?.price?.USD;
                }
                resEstimate.toAmountUsd = +resEstimate?.toTokenAmount * (params.toToken.balance.price?.USD || params.toToken.price?.USD);

                if (!bestRoute?.toTokenAmount) {
                    bestRoute = resEstimate;
                    bestRoute.service = service;
                }

                if (+resEstimate?.toAmountUsd - resEstimate.estimateFeeUsd > +bestRoute?.toAmountUsd - bestRoute.estimateFeeUsd) {
                    const route = {
                        ...bestRoute,
                        routes: [
                            {
                                ...bestRoute,
                                service: bestRoute.service,
                                net: params.net,
                                toNet: params.toNet,
                                fromToken: params.fromToken,
                                toToken: params.toToken,
                                status: STATUSES.SIGNING,
                                amount: params.amount,
                            },
                        ],
                    };
                    otherRoutes.push(route);
                    bestRoute = resEstimate;
                    bestRoute.service = service;
                } else if (resEstimate?.toTokenAmount && bestRouteExist) {
                    const route = {
                        ...resEstimate,
                        routes: [
                            {
                                ...resEstimate,
                                service,
                                net: params.net,
                                toNet: params.toNet,
                                fromToken: params.fromToken,
                                toToken: params.toToken,
                                status: STATUSES.SIGNING,
                                amount: params.amount,
                            },
                        ],
                    };
                    otherRoutes.push(route);
                }
                bestRouteExist = true;
            })
        );
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
        console.log(e);
        return { error: e.message || e };
    }
}

export async function checkAllowance(net, tokenAddress, ownerAddress, amount, decimals, service) {
    if (checkAllowance.cache[ownerAddress]) {
        if (checkAllowance.cache[ownerAddress].tokenAddress === tokenAddress && checkAllowance.cache[ownerAddress].service === service) {
            return toMantissa(amount, decimals) > checkAllowance.cache[ownerAddress].allowance;
        }
    }
    let needApprove = false;
    if (tokenAddress) {
        const resAllowance = await store.dispatch(service?.type + '/getAllowance', {
            net,
            tokenAddress,
            ownerAddress,
            url: service.url,
        });
        if (toMantissa(amount, decimals) > resAllowance.allowance) {
            needApprove = true;
        }
        checkAllowance.cache[ownerAddress] = { tokenAddress, service, allowance: resAllowance.allowance };
    }
    return needApprove;
}
checkAllowance.cache = {};

export async function getTokensByService(chainId) {
    const allService = swapServices.concat(bridgeServices).filter((elem) => elem.tokensByChain);
    const allTokens = {};
    for (let i = 0; i < allService.length; i++) {
        const params = {
            chainId,
            url: allService[i].url,
        };

        const list = await store.dispatch(`bridge/getTokensByChain`, params);
        allTokens[allService[i].name] = list;
    }
    store.dispatch(`bridge/setTokensByChain`, allTokens);
}
