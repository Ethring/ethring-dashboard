import store from '../../store/index';

import { toMantissa } from '@/helpers/numbers';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

import { services as bridgeServices } from '../../config/bridgeServices';

import { services as swapServices } from '../../config/dexServices';

import { chainIds } from '../../config/availableNets';

const NATIVE_CONTRACT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const BRIDGE_ERROR = 'Internal error';

export default async function findBestRoute(amount, walletAddress) {
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
            if (result.bestRoute) {
                const bestRoute = {
                    fromTokenAmount: amount,
                    toTokenAmount: result.bestRoute.toTokenAmount,
                    toAmountUsd:
                        result.bestRoute.toTokenAmount *
                        (result.bestRoute.toToken.balance.price?.USD || result.bestRoute.toToken.price?.USD),
                    estimateFeeUsd: result.bestRoute.estimateFeeUsd,
                    estimateTime: result.bestRoute.estimateTime,
                    routes: [result.bestRoute],
                };
                return { bestRoute, otherRoutes: result.otherRoutes };
            }
            return result;
        };

        const getRouteCalculated = (bestRoute, result) => {
            bestRoute.toTokenAmount = result.bestRoute.toTokenAmount;
            bestRoute.estimateFeeUsd += result.bestRoute.estimateFeeUsd;
            bestRoute.toAmountUsd =
                result.bestRoute.toTokenAmount * (result.bestRoute.toToken.balance.price?.USD || result.bestRoute.toToken.price?.USD);
            bestRoute.estimateTime += result.bestRoute.estimateTime;
            bestRoute.routes.push({ ...result.bestRoute, status: 'pending' });
            return bestRoute;
        };

        const getOtherRoutes = (bestRoute, result) => {
            let otherRoutesList = [];
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
                result.otherRoutes.forEach((route) => {
                    let currentBestRoute = {
                        estimateFeeUsd: bestRoute.bestRoute.routes[0].estimateFeeUsd,
                        estimateTime: bestRoute.bestRoute.routes[0].estimateTime,
                        routes: [],
                        fromTokenAmount: bestRoute.bestRoute.routes[0].fromTokenAmount,
                    };
                    currentBestRoute.routes.push({ ...bestRoute.bestRoute.routes[0], status: 'signing' });
                    currentBestRoute.toTokenAmount = route.toTokenAmount;
                    currentBestRoute.estimateFeeUsd += route.estimateFeeUsd;
                    currentBestRoute.toAmountUsd =
                        route.toTokenAmount * (route.routes[0].toToken.balance?.price?.USD || route.routes[0].toToken?.price?.USD);
                    currentBestRoute.estimateTime += route.estimateTime;
                    currentBestRoute.routes.push({ ...route.routes[0], status: 'pending' });
                    otherRoutesList.push(currentBestRoute);
                });
            }
            if (bestRoute.otherRoutes.length && result.otherRoutes.length) {
                bestRoute.otherRoutes.forEach((route1) => {
                    result.otherRoutes.forEach((route2) => {
                        let currentBestRoute = {
                            estimateFeeUsd: route1.routes[0].estimateFeeUsd,
                            estimateTime: route1.routes[0].estimateTime,
                            routes: [],
                            fromTokenAmount: route1.routes[0].fromTokenAmount,
                        };
                        currentBestRoute.routes.push({ ...route1.routes[0], status: 'signing' });
                        currentBestRoute.toTokenAmount = route2.toTokenAmount;
                        currentBestRoute.estimateFeeUsd += route2.estimateFeeUsd;
                        currentBestRoute.toAmountUsd =
                            route2.toTokenAmount * (route2.routes[0].toToken.balance?.price?.USD || route2.routes[0].toToken?.price?.USD);
                        currentBestRoute.estimateTime += route2.estimateTime;
                        currentBestRoute.routes.push({ ...route2.routes[0], status: 'pending' });
                        otherRoutesList.push(currentBestRoute);
                    });
                });
            }
            return otherRoutesList;
        };

        const result = await getBestRoute(getParams(fromNetwork, fromToken, toNetwork, toToken, amount));

        if (result.bestRoute) {
            return result;
        }

        if (result.error === BRIDGE_ERROR) {
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
                            bestRoute1.routes.push({ ...result5.bestRoute, status: 'pending' });
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
        const deBridgeTokens = store.getters['bridge/tokensByChainID'];

        if (params.fromNet === params.toNet) {
            services = swapServices;
            apiRoute = 'swap/estimateSwap';
        } else {
            services = bridgeServices;
            apiRoute = 'bridge/estimateBridge';

            if (
                params.fromToken.address &&
                !deBridgeTokens.find((elem) => elem.address.toLowerCase() === params.fromToken.address.toLowerCase())
            ) {
                return { error: BRIDGE_ERROR };
            }
        }

        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            params.url = service.url;
            const resEstimate = await store.dispatch(apiRoute, params);
            if (resEstimate.error) {
                if (resEstimate.error === BRIDGE_ERROR) {
                    return { error: BRIDGE_ERROR };
                }
                if (resEstimate.error?.error === 'Bad Request') {
                    error = 'Route not found';
                } else {
                    error = resEstimate.error;
                }
                continue;
            }

            if (
                (resEstimate.fee.currency === params.fromNetwork.code &&
                    resEstimate.fee.amount > params.fromNetwork.balance?.mainBalance) ||
                +params.fromNetwork.balance?.mainBalance === 0
            ) {
                error = 'Insufficient balance for network fees';
                continue;
            }
            error = null;
            resEstimate.estimateTime = service.estimatedTime[chainIds[params.net]];

            if (resEstimate.fee.currency === params.fromToken.code) {
                resEstimate.estimateFeeUsd = resEstimate.fee.amount * (params.fromToken.balance.price?.USD || params.fromToken.price?.USD);
            } else {
                resEstimate.estimateFeeUsd = resEstimate.fee.amount * params.fromNetwork?.price?.USD;
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
                            status: 'signing',
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
                            status: 'signing',
                            amount: params.amount,
                        },
                    ],
                };
                otherRoutes.push(route);
            }
            bestRouteExist = true;
        }
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
        bestRoute.status = 'signing';
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
