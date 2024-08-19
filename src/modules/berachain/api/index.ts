import axios from 'axios';

import ApiClient from '@/modules/berachain/api/axios';
import { IGetRouteRequest } from '@/modules/berachain/models/request';
import { BERACHAIN_ABI } from '@/core/wallet-adapter/config';
import { getContract } from '@/shared/utils/contract';

export interface IBerachainApi {
    getRoute(params: IGetRouteRequest): Promise<any>;
}

const CAPSOLVER_KEY = 'CAP-FD810E2AF7B9909A2C143E3CF7483F44';
const BERACHAIN_RPC = 'https://bartio.rpc.berachain.com/';

class BerachainApi implements IBerachainApi {
    async getRoute(params: IGetRouteRequest): Promise<any> {
        try {
            const response = await ApiClient.get(`/dex/route`, { params });

            return response.data;
        } catch (error) {
            console.error('BerachainApi.getRoute', error);

            throw error;
        }
    }

    async getUsdPrice(address: string): Promise<any> {
        try {
            const response = await axios.post(
                'https://api.goldsky.com/api/public/project_clq1h5ct0g4a201x18tfte5iv/subgraphs/bgt-subgraph/v1000000/gn',
                {
                    operationName: 'GetTokenInformation',
                    variables: {
                        id: address,
                    },
                    query: 'query GetTokenInformation($id: String) {\n  tokenInformation(id: $id) {\n    id\n    address\n    symbol\n    name\n    decimals\n    usdValue\n    beraValue\n    __typename\n  }\n}',
                },
            );
            return response.data.data;
        } catch {}
    }

    async getStakedAmount(account: string): Promise<any> {
        try {
            const response = await axios.post(
                'https://api.goldsky.com/api/public/project_clq1h5ct0g4a201x18tfte5iv/subgraphs/bgt-staker-subgraph/v1/gn',
                {
                    operationName: 'GetUserValidatorInformation',
                    variables: {
                        address: account,
                    },
                    query: 'query GetUserValidatorInformation($address: String!) {\n  userValidatorInformations(where: {user: $address}) {\n    id\n    amountQueued\n  amountDeposited\n }\n}',
                },
            );
            return response.data.data;
        } catch (error) {
            throw error;
        }
    }

    async getUserVaults(address: string): Promise<any> {
        try {
            const response = await axios.get(
                `https://bartio-pol-indexer.berachain-devnet.com/berachain/v1alpha1/beacon/user/${address}/vaults`,
            );

            if (!response.data.userVaults) return null;

            for (const vault of response.data.userVaults) {
                const vaultContract = getContract(vault.vaultAddress, BERACHAIN_RPC, BERACHAIN_ABI);
                const bgtAmount = (await vaultContract.methods.earned(address).call()) as number;
                vault.bgtEarned = +BigInt(bgtAmount || 0).toString() / Math.pow(10, 18);
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async solveCaptcha(): Promise<any> {
        try {
            let result;
            const task = await axios.post('https://api.capsolver.com/createTask', {
                clientKey: CAPSOLVER_KEY,
                task: {
                    type: 'AntiTurnstileTaskProxyLess',
                    websiteURL: 'https://bartio.faucet.berachain.com/',
                    websiteKey: '0x4AAAAAAARdAuciFArKhVwt',
                },
            });

            do
                try {
                    result = await axios.post('https://api.capsolver.com/getTaskResult', {
                        clientKey: CAPSOLVER_KEY,
                        taskId: task.data.taskId,
                    });

                    await new Promise((resolve) => setTimeout(resolve, 500));
                } catch (error) {
                    console.log(error);
                    break;
                }
            while (result.data.status != 'ready');

            return result.data.solution.token;
        } catch (error) {
            throw new Error('Error with captcha');
        }
    }

    async dripTokens(address: string): Promise<void> {
        try {
            const bearer = await this.solveCaptcha();

            await axios.post(
                `https://bartio-faucet.berachain-devnet.com/api/claim?address=${address}`,
                { address },
                {
                    headers: {
                        Authorization: `Bearer ${bearer}`,
                    },
                },
            );
        } catch (error) {
            if (error?.response) {
                if (error?.response?.status == 402)
                    throw new Error(`Wallet: ${address.slice(0, 4)}...${address.slice(-4)} You don't have 0.001 ETH.`);

                throw new Error(`Wallet: ${address.slice(0, 4)}...${address.slice(-4)} ${error.response.data.msg}`);
            }
            throw new Error(`Wallet: ${address.slice(0, 4)}...${address.slice(-4)} Could not make a response ${error}`);
        }
    }
}
// ============= API Requests End =============

export default BerachainApi;
