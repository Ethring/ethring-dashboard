import BridgeDexAPI from '@/modules/bridge-dex';

import { getAllServices } from '@/modules/bridge-dex/api';

import { IService } from '@/modules/bridge-dex/models/Service.interface';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { ServiceType, ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';

import { IQuoteRoute, IQuoteRoutes, QuoteRoutes, ResponseBridgeDex } from '@/modules/bridge-dex/models/Response.interface';
import logger from '@/shared/logger';

const TYPES = {
    SET_SERVICES: 'SET_SERVICES',

    SET_QUOTE_ROUTES: 'SET_QUOTE_ROUTES',

    SET_SELECTED_ROUTE: 'SET_SELECTED_ROUTE',

    SET_SERVICE_ID: 'SET_SERVICE_ID',

    SET_SERVICE_TYPE: 'SET_SERVICE_TYPE',

    SET_RELOAD_ROUTES: 'SET_RELOAD_ROUTES',

    SET_ROUTE_FEE: 'SET_ROUTE_FEE',

    SET_SERVICE_ALLOWANCE: 'SET_SERVICE_ALLOWANCE',

    SET_LOADER_STATE_BY_TYPE: 'SET_LOADER_STATE_BY_TYPE',

    SET_QUOTE_ERROR_MESSAGE: 'SET_QUOTE_ERROR_MESSAGE',
};

interface IState {
    loaders: {
        [key: string]: boolean;
    };

    services: IService[];

    reloadRoutes: boolean;

    quoteRoutes: {
        [ServiceType.dex]: IQuoteRoutes;
        [ServiceType.bridgedex]: IQuoteRoutes;
    };

    selectedRoute: {
        [ServiceType.dex]: IQuoteRoute;
        [ServiceType.bridgedex]: IQuoteRoute;
    };

    selectedServiceId: string;

    selectedServiceType: ServiceTypes | null;

    quoteErrorMessage: string;

    allowanceByService: {
        [key: string]: {
            [key: string]: {
                [key: string]: string;
            };
        };
    };
}

export default {
    namespaced: true,

    state: (): IState => ({
        loaders: {},

        services: [],

        reloadRoutes: false,

        quoteRoutes: {
            [ServiceType.dex]: null,
            [ServiceType.bridgedex]: null,
        },

        selectedRoute: {
            [ServiceType.dex]: null,
            [ServiceType.bridgedex]: null,
        },

        allowanceByService: {},

        selectedServiceId: '',

        selectedServiceType: null,

        quoteErrorMessage: '',
    }),

    getters: {
        // * Loaders
        isReloadRoutes: (state: IState) => state.reloadRoutes,
        getLoaderState: (state: IState) => (type: string) => {
            if (typeof state.loaders[type] === 'undefined') state.loaders[type] = false;
            return state.loaders[type] || false;
        },

        // * Getters for Services
        getAllServiceList: (state: IState) => state.services,
        getAllServicesHash: (state: IState) => {
            const services = state.services;
            const hash: { [key: string]: IService } = {};

            services.forEach((service) => {
                hash[service.id] = service;
            });

            return hash || {};
        },
        getServiceById: (state: IState) => (id: string) => state.services.find((service) => service.id === id) || {},
        getServiceByType: (state: IState) => (type: ServiceTypes) => state.services.find((service) => service.type === type) || {},
        getServicesByType: (state: IState) => (type: ServiceTypes) => state.services.filter((service) => service.type === type),
        getServiceByEcosystem: (state: IState) => (ecosystem: Ecosystems) =>
            state.services.filter((service: IService) => service.ecosystems.includes(ecosystem)),

        // * Getters for Quote Routes
        getQuoteRouteList: (state: IState) => (serviceType: ServiceTypes) => state.quoteRoutes[serviceType] || null,

        // * Getters for Selected Route
        getSelectedRoute: (state: IState) => (serviceType: ServiceTypes) => state.selectedRoute[serviceType] || null,

        // * Getters for Service Allowance
        getServiceAllowance: (state: IState) => (serviceId: string, owner: string, token: string) => {
            if (!serviceId || !owner || !token) {
                return null;
            }

            if (state.allowanceByService[serviceId] && state.allowanceByService[serviceId][owner]) {
                return state.allowanceByService[serviceId][owner][token] || null;
            }

            return null;
        },

        // * Getters for Service Type
        getSelectedServiceType: (state: IState) => state.selectedServiceType,

        getQuoteErrorMessage: (state: IState) => state.quoteErrorMessage,
    },

    mutations: {
        [TYPES.SET_SERVICES](state: IState, value: IService[]) {
            state.services = value;
        },

        [TYPES.SET_QUOTE_ROUTES](state: IState, { serviceType, value }: { serviceType: ServiceTypes; value: IQuoteRoutes }) {
            state.quoteRoutes[serviceType] = value;
        },

        [TYPES.SET_SELECTED_ROUTE](state: IState, { serviceType, value }: { serviceType: ServiceTypes; value: IQuoteRoute }) {
            state.selectedRoute[serviceType] = value;
        },

        [TYPES.SET_SERVICE_ALLOWANCE](
            state: IState,
            { serviceId, owner, token, value }: { serviceId: string; owner: string; token: string; value: string },
        ) {
            !state.allowanceByService[serviceId] && (state.allowanceByService[serviceId] = {});
            !state.allowanceByService[serviceId][owner] && (state.allowanceByService[serviceId][owner] = {});
            state.allowanceByService[serviceId][owner][token] = value;
        },

        [TYPES.SET_LOADER_STATE_BY_TYPE](state: IState, { type, value }: { type: string; value: boolean }) {
            state.loaders[type] = value;
        },

        [TYPES.SET_SERVICE_TYPE](state: IState, value: ServiceTypes) {
            state.selectedServiceType = value;
        },
        [TYPES.SET_RELOAD_ROUTES](state: IState, value: boolean) {
            state.reloadRoutes = value;
        },
        [TYPES.SET_QUOTE_ERROR_MESSAGE](state: IState, value: string) {
            state.quoteErrorMessage = value;
        },
    },
    actions: {
        async getServices({ commit }) {
            const response = await getAllServices();

            if (!response.length) {
                return [];
            }

            commit(TYPES.SET_SERVICES, response);
        },

        setSelectedRoute({ commit }, value: { serviceType: ServiceTypes; value: IQuoteRoute }) {
            commit(TYPES.SET_SELECTED_ROUTE, value);
        },

        setTargetServiceType({ commit }, value: ServiceTypes) {
            commit(TYPES.SET_SERVICE_TYPE, value);
        },

        resetSelectedRoute({ commit }, value: { serviceType: ServiceTypes }) {
            commit(TYPES.SET_SELECTED_ROUTE, {
                serviceType: value.serviceType,
                value: null,
            });
        },

        setQuoteRoutes({ commit }, value: { serviceType: ServiceTypes; value: IQuoteRoute }) {
            commit(TYPES.SET_QUOTE_ROUTES, value);
        },

        setServiceAllowance({ commit }, value: { serviceId: string; owner: string; token: string; value: string }) {
            commit(TYPES.SET_SERVICE_ALLOWANCE, value);
        },

        setLoaderStateByType({ commit }, value: { type: string; value: boolean }) {
            commit(TYPES.SET_LOADER_STATE_BY_TYPE, value);
        },

        setReloadRoutes({ commit }, value: boolean) {
            commit(TYPES.SET_RELOAD_ROUTES, value);
        },
        setQuoteErrorMessage({ commit }, value: string) {
            commit(TYPES.SET_QUOTE_ERROR_MESSAGE, value);
        },
    },
};
