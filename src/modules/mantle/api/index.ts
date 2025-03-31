import ApiClient from '@/modules/mantle/api/axios';

export interface IMMantleApi {
    getPoints(account: string): Promise<any>;
}

class MantleApi implements IMMantleApi {
    async getPoints(account: string): Promise<any> {
        try {
            const response = await ApiClient.get(`${account}`);

            return response.data?.data;
        } catch (error) {
            console.error('MantleApi.getPoints', error);

            throw error;
        }
    }
}
// ============= API Requests End =============

export default MantleApi;
