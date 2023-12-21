import axios from 'axios';

import { fetchData } from '../fetchData';
import { checkErrors } from '@/helpers/checkErrors';
// import HttpRequest from '@/shared/utils/request';
import { delay } from '@/helpers/utils';

const NATIVE_CONTRACT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const DEBRIDGE_TRADE_ORDERS = 'https://api.dln.trade/v1.0/dln/tx';
const DEBRIDGE_TX_ORDERS = 'https://dln-api.debridge.finance/api/Orders';

const createCancelToken = () => axios.CancelToken.source();

const SOURCES = {
    estimateBridge: createCancelToken(),
    estimateSwap: createCancelToken(),
    getBridgeTx: createCancelToken(),
    getSwapTx: createCancelToken(),
    getApproveTx: createCancelToken(),
};

const REMOVE_KEYS = ['fromNetwork', 'toNetwork', 'fromToken', 'toToken', 'service', 'store', 'walletAddress'];

const cancelRequest = async (source) => {
    if (source) {
        await source.cancel();
    }
};

export const cancelRequestByMethod = async (method) => {
    if (SOURCES[method]) {
        await cancelRequest(SOURCES[method]);
        SOURCES[method] = createCancelToken();
    }
};

export const estimateSwap = async ({ url, net, fromTokenAddress, toTokenAddress, amount, ownerAddress, ...rest }) => {
    const route = 'estimateSwap';

    if (!url) {
        throw new Error('url is required');
    }

    const SWAP_REMOVE_KEYS = [...REMOVE_KEYS, 'fromNet', 'toNet'];

    for (const key of SWAP_REMOVE_KEYS) {
        delete rest[key];
    }

    try {
        const fetchParams = {
            url,
            route,
            params: {
                net,
                fromTokenAddress: fromTokenAddress || NATIVE_CONTRACT,
                toTokenAddress: toTokenAddress || NATIVE_CONTRACT,
                amount,
                ownerAddress,
            },
        };

        if (SOURCES[route]) {
            fetchParams.cancelToken = SOURCES[route].token;
        }

        const response = await fetchData(fetchParams);

        if (response.error) {
            return checkErrors(response.error);
        }

        return response;
    } catch (error) {
        return checkErrors(error);
    }
};

export const estimateBridge = async ({ url, fromNet, toNet, fromTokenAddress, toTokenAddress, amount, ownerAddress, ...rest }) => {
    const route = 'estimateBridge';

    if (!url) {
        throw new Error('url is required');
    }

    const BRIDGE_REMOVE_KEYS = [...REMOVE_KEYS, 'net'];

    for (const key of BRIDGE_REMOVE_KEYS) {
        delete rest[key];
    }

    try {
        const fetchParams = {
            url,
            route,
            params: {
                fromNet,
                toNet,
                fromTokenAddress: fromTokenAddress || NATIVE_CONTRACT,
                toTokenAddress: toTokenAddress || NATIVE_CONTRACT,
                amount,
                ownerAddress,
            },
        };

        if (SOURCES[route]) {
            fetchParams.cancelToken = SOURCES[route].token;
        }

        const response = await fetchData(fetchParams);

        if (response.error) {
            return checkErrors(response.error);
        }

        return response;
    } catch (error) {
        return checkErrors(error);
    }
};

export const getAllowance = async ({ url, net, tokenAddress, ownerAddress, store, service }) => {
    if (!url) {
        throw new Error('url is required');
    }

    try {
        const REQUEST_URL = `${url}getAllowance`;

        const { ok, data, error } = (
            await axios.get(REQUEST_URL, {
                params: {
                    net,
                    tokenAddress,
                    ownerAddress,
                },
            })
        ).data;

        if (!ok) {
            return checkErrors(error);
        }

        if (store) {
            const { allowance = 0 } = data || {};

            store.dispatch('tokenOps/setAllowance', {
                chain: net,
                account: ownerAddress,
                tokenAddress,
                allowance,
                service: service.id,
            });
        }

        return data;
    } catch (error) {
        return checkErrors(error);
    }
};

export const getApproveTx = async ({ url, net, tokenAddress, ownerAddress, store, service }) => {
    const route = 'getApproveTx';

    if (!url) {
        throw new Error('url is required');
    }

    try {
        const fetchParams = {
            url,
            route,
            params: {
                net,
                tokenAddress,
                ownerAddress,
            },
        };

        if (SOURCES[route]) {
            fetchParams.cancelToken = SOURCES[route].token;
        }

        const response = await fetchData(fetchParams);

        if (response.error) {
            return checkErrors(response.error);
        }

        if (store && service) {
            store.dispatch('tokenOps/setApprove', {
                chain: net,
                account: ownerAddress,
                tokenAddress,
                approve: response,
                service: service.id,
            });
        }

        return response;
    } catch (error) {
        return checkErrors(error);
    }
};

export const getSwapTx = async ({ url, net, fromTokenAddress, toTokenAddress, amount, ownerAddress, slippage = 0.5 }) => {
    const route = 'getSwapTx';

    if (!url) {
        throw new Error('url is required');
    }

    try {
        const fetchParams = {
            url,
            route,
            params: {
                net,
                fromTokenAddress: fromTokenAddress || NATIVE_CONTRACT,
                toTokenAddress: toTokenAddress || NATIVE_CONTRACT,
                amount,
                ownerAddress,
                slippage,
            },
        };

        if (SOURCES[route]) {
            fetchParams.cancelToken = SOURCES[route].token;
        }

        const response = await fetchData(fetchParams);

        if (response.error) {
            return checkErrors(response.error);
        }

        return response;
    } catch (error) {
        return checkErrors(error);
    }
};

export const getBridgeTx = async ({
    url,
    fromNet,
    toNet,
    fromTokenAddress,
    toTokenAddress,
    amount,
    ownerAddress,
    recipientAddress,
    fallbackAddress,
    ...rest
}) => {
    const route = 'getBridgeTx';

    if (!url) {
        throw new Error('url is required');
    }

    const BRIDGE_REMOVE_KEYS = [...REMOVE_KEYS, 'net', 'slippage'];

    for (const key of BRIDGE_REMOVE_KEYS) {
        delete rest[key];
    }

    try {
        const fetchParams = {
            url,
            route,
            params: {
                fromNet,
                toNet,
                fromTokenAddress: fromTokenAddress || NATIVE_CONTRACT,
                toTokenAddress: toTokenAddress || NATIVE_CONTRACT,
                amount,
                ownerAddress,
                recipientAddress,
                fallbackAddress,
                ...rest,
            },
        };

        if (SOURCES[route]) {
            fetchParams.cancelToken = SOURCES[route].token;
        }

        const response = await fetchData(fetchParams);

        if (response.error) {
            return checkErrors(response.error);
        }

        return response;
    } catch (error) {
        return checkErrors(error);
    }
};

export const getDebridgeOrders = async (txHash) => {
    await delay(3000); // Fix after integrating
    const response = await axios.get(`${DEBRIDGE_TRADE_ORDERS}/${txHash}/order-ids`);

    if (response.status === 200) {
        const { data = {} } = response;
        const { orderIds = [] } = data;
        return orderIds;
    }

    return [];
};

export const getDebridgeTxHashForOrder = async (txHash) => {
    let orderIds = await getDebridgeOrders(txHash);

    if (!orderIds.length) {
        orderIds = await getDebridgeOrders(txHash);
    }

    const [orderForHash] = orderIds;

    const hash = {
        srcHash: null,
        dstHash: null,
    };

    if (!orderForHash) {
        return hash;
    }

    const responseHash = await axios.get(`${DEBRIDGE_TX_ORDERS}/${orderForHash}`);

    if (responseHash.status === 200) {
        const { data = {} } = responseHash;

        const { createdSrcEventMetadata = {}, fulfilledDstEventMetadata = {} } = data;

        hash.srcHash = createdSrcEventMetadata?.transactionHash?.stringValue || null;
        hash.dstHash = fulfilledDstEventMetadata?.transactionHash?.stringValue || null;
    }

    return hash;
};
