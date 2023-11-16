import axios from 'axios';

import { fetchData } from '../fetchData';
import { checkErrors } from '@/helpers/checkErrors';
// import HttpRequest from '@/shared/utils/request';
import { delay } from '@/helpers/utils';

const NATIVE_CONTRACT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const DEBRIDGE_TRADE_ORDERS = 'https://api.dln.trade/v1.0/dln/tx';
const DEBRIDGE_TX_ORDERS = 'https://dln-api.debridge.finance/api/Orders';

export const estimateSwap = async ({ url, net, fromTokenAddress, toTokenAddress, amount, ownerAddress, ...rest }) => {
    if (!url) {
        throw new Error('url is required');
    }

    try {
        const response = await fetchData({
            url,
            route: 'estimateSwap',
            params: {
                net,
                fromTokenAddress: fromTokenAddress || NATIVE_CONTRACT,
                toTokenAddress: toTokenAddress || NATIVE_CONTRACT,
                amount,
                ownerAddress,
                ...rest,
            },
        });

        if (response.error) {
            return checkErrors(response.error);
        }

        return response;
    } catch (error) {
        return checkErrors(error);
    }
};

export const estimateBridge = async ({ url, fromNet, toNet, fromTokenAddress, toTokenAddress, amount, ownerAddress, ...rest }) => {
    if (!url) {
        throw new Error('url is required');
    }

    try {
        const response = await fetchData({
            url,
            route: 'estimateBridge',
            params: {
                fromNet,
                toNet,
                fromTokenAddress: fromTokenAddress || NATIVE_CONTRACT,
                toTokenAddress: toTokenAddress || NATIVE_CONTRACT,
                amount,
                ownerAddress,
                ...rest,
            },
        });

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
    if (!url) {
        throw new Error('url is required');
    }

    try {
        const response = await fetchData({
            url,
            route: 'getApproveTx',
            params: {
                net,
                tokenAddress,
                ownerAddress,
            },
        });

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
    try {
        const response = await fetchData({
            url,
            route: 'getSwapTx',
            params: {
                net,
                fromTokenAddress: fromTokenAddress || NATIVE_CONTRACT,
                toTokenAddress: toTokenAddress || NATIVE_CONTRACT,
                amount,
                ownerAddress,
                slippage,
            },
        });

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
    try {
        const response = await fetchData({
            url,
            route: 'getBridgeTx',
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
        });

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
