import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============

const portalApiClient = new ApiClient({
    baseURL: process.env.PORTAL_FI_API as string,
});

const dpApiClient = new ApiClient({
    baseURL: process.env.DATA_PROVIDER_API || '',
    timeout: 10000,
});

const PortalApiInstance = portalApiClient.getInstance();

const DpApiInstance = dpApiClient.getInstance();

export { PortalApiInstance, DpApiInstance };

// ============== API Client Settings End ==============
