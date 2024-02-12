// Export configs from data-provider
// export * from './chains';

import { AxiosResponse, HttpStatusCode } from 'axios';

import axiosInstance from '@/shared/axios';

import { ProviderRequestOptions } from '@/modules/balance-provider/models/types';
import { BalanceResponse, DataProviderResponse } from './models/types';

axiosInstance.defaults.baseURL = process.env.DATA_PROVIDER_API || null;

export const getBalancesByAddress = async (
    chain: string,
    address: string,
    options: ProviderRequestOptions = {},
): Promise<BalanceResponse | null> => {
    const { fetchTokens = true, fetchIntegrations = true, fetchNfts = true } = options;

    if (!process.env.DATA_PROVIDER_API) {
        return null;
    }

    if (!chain || !address) {
        return null;
    }

    try {
        const { data, status }: AxiosResponse = await axiosInstance.get(
            `/balances?net=${chain}&address=${address}&tokens=${fetchTokens}&integrations=${fetchIntegrations}&nfts=${fetchNfts}`,
        );

        if (status !== HttpStatusCode.Ok) {
            return null;
        }

        const { data: response, ok = false } = data as DataProviderResponse;

        if (!ok) {
            return null;
        }

        const { tokens, integrations, nfts } = response as BalanceResponse;

        return {
            tokens,
            integrations,
            nfts,
        };
    } catch (e) {
        console.error('Error while fetching balances from provider:', e);
        return null;
    }
};
