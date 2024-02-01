// Axios instance
import axiosInstance from '../axios';
import { errorRegister } from '@/shared/utils/errors';

const BRIDGE_DEX_URL = import.meta.env.VITE_BRIDGE_DEX_API || null;

export const getServices = async () => {
    if (!BRIDGE_DEX_URL) {
        return null;
    }

    const params = {
        url: `${BRIDGE_DEX_URL}/services`,
    };

    try {
        const response = await axiosInstance.get(params.url);

        if (response?.error) {
            return errorRegister(response?.error);
        }

        if (response && response.status === 200) {
            return response.data;
        }

        return [];
    } catch (e) {
        console.error('Error while fetching list of services:', e);

        return errorRegister(e);
    }
};

export const getBestRoute = async (amount, walletAddress, fromToken, toToken, srcNetwork, dstNetwork, nativeTokenInfo) => {
    if (!BRIDGE_DEX_URL) {
        return null;
    }

    const requestParams = {
        url: `${BRIDGE_DEX_URL}/routing/best`,
        params: {
            amount,
            walletAddress,
            fromToken,
            toToken,
            srcNetwork,
            dstNetwork,
            nativeTokenInfo,
        },
    };

    try {
        const response = await axiosInstance.post(requestParams.url, requestParams.params);

        if (response?.error) {
            return errorRegister(response?.error);
        }

        if (response && response.status === 200) {
            return response.data;
        }

        return null;
    } catch (e) {
        console.error('Error while fetching best route:', e);

        return errorRegister(e);
    }
};
