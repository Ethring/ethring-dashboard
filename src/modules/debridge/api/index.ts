import ApiClient from '@/modules/debridge/api/axios';

export interface IDebridgeApi {
    getDebridgePoints(address: string): Promise<any>;
    getMultiplierInfo(address: string): Promise<any>;
}

class DebridgeApi implements IDebridgeApi {
    async getDebridgePoints(address: string): Promise<any> {
        try {
            const response = await ApiClient.get(`/${address}/shortSummary`);

            return response.data;
        } catch (error) {
            console.error('DebridgeApi.getDebridgePoints', error);

            throw error;
        }
    }

    async getMultiplierInfo(address: string): Promise<any> {
        try {
            const response = await ApiClient.get(`/multiplierInfo?senderAddress=${address}`);

            return response.data;
        } catch (error) {
            console.error('DebridgeApi.getMultiplierInfo', error);

            throw error;
        }
    }
}
// ============= API Requests End =============

export default DebridgeApi;
