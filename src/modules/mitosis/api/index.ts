import axios from 'axios';
import ApiClient from '@/modules/mitosis/api/axios';

export interface IMitosisApi {
    getPoints(account: string): Promise<any>;
    getLineaPoints(account: string): Promise<any>;
}

class MitosisApi implements IMitosisApi {
    async getPoints(account: string): Promise<any> {
        try {
            const startsAt = new Date('2024-04-25').toISOString();
            const endsAt = new Date().toISOString();

            const responseStatus = await ApiClient.get(`/status/${account}?asset=weETH`);
            const responseHistory = await ApiClient.get(
                `/status/${account}/points/history?asset=weETH&startsAt=${startsAt}&endsAt=${endsAt}`,
            );

            return { ...responseHistory.data, ...responseStatus.data };
        } catch (error) {
            console.error('MitosisApi.getPoints', error);

            throw error;
        }
    }

    async getLineaPoints(account: string): Promise<any> {
        try {
            const response = await axios.get(
                `https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/linea/getUserPointsSearch?user=${account}`,
            );

            return response.data;
        } catch (error) {
            console.error('MitosisApi.getLineaPoints', error);

            throw error;
        }
    }
}
// ============= API Requests End =============

export default MitosisApi;
