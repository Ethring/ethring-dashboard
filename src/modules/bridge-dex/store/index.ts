import { getAllServices } from '@/modules/bridge-dex/api';

import { IService } from '@/modules/bridge-dex/models/Service.interface';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { ServiceType, ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';

import { IQuoteRoute, IQuoteRoutes } from '@/modules/bridge-dex/models/Response.interface';

const QUOTE_AVAILABLE_TIME = 60;

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

    SET_ROUTE_TIMER: 'SET_ROUTE_TIMER',
};

interface IState {
    loaders: {
        [key: string]: boolean;
    };

    services: IService[];

    reloadRoutes: boolean;

    quoteRoutes: {
        [ServiceType.dex]: IQuoteRoutes | null;
        [ServiceType.bridgedex]: IQuoteRoutes | null;
        [key: string]: IQuoteRoutes | null;
    };

    selectedRoute: {
        [ServiceType.dex]: IQuoteRoute | null;
        [ServiceType.bridgedex]: IQuoteRoute | null;
        [key: string]: IQuoteRoute | null;
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

    routeTimer: {
        [key: string]: any;
    };

    routeTimerSeconds: {
        [key: string]: {
            seconds: number | null;
            percent: number | null;
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

        routeTimer: {},

        routeTimerSeconds: {},
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
        getQuoteRouteList: (state: IState) => (serviceType: ServiceTypes) => {
            if (!state.quoteRoutes[serviceType]) return [];
            return state.quoteRoutes[serviceType] || [];
        },

        // * Getters for Selected Route
        getSelectedRoute: (state: IState) => (serviceType: ServiceTypes) => {
            if (!state.selectedRoute[serviceType]) return null;
            return state.selectedRoute[serviceType] || null;
        },

        // * Getters for Service Allowance
        getServiceAllowance: (state: IState) => (serviceId: string, owner: string, token: string) => {
            if (!serviceId || !owner || !token) return null;

            if (state.allowanceByService[serviceId] && state.allowanceByService[serviceId][owner])
                return state.allowanceByService[serviceId][owner][token] || null;

            return null;
        },

        // * Getters for Service Type
        getSelectedServiceType: (state: IState) => state.selectedServiceType,

        getQuoteErrorMessage: (state: IState) => state.quoteErrorMessage,

        // ******************

        // * Getters for Route Timer
        getRouteTimer: (state: IState) => (routeId: string) => state.routeTimer[routeId] || null,
        getRouteTimerSeconds: (state: IState) => (routeId: string) => state.routeTimerSeconds[routeId] || { seconds: 0, percent: 0 },
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
        [TYPES.SET_ROUTE_TIMER](state: IState, { routeId, type }: { routeId: string; type: string }) {
            state.routeTimerSeconds[routeId] = {
                seconds: QUOTE_AVAILABLE_TIME,
                percent: 100,
            };

            state.routeTimer[routeId] = setInterval(() => {
                const step = 100 / QUOTE_AVAILABLE_TIME;

                state.routeTimerSeconds[routeId].seconds = (state.routeTimerSeconds[routeId].seconds as number) - 1;
                state.routeTimerSeconds[routeId].percent = (state.routeTimerSeconds[routeId].percent as number) - step;

                if ((state.routeTimerSeconds[routeId].seconds as number) <= 0) {
                    clearInterval(state.routeTimer[routeId]);
                    state.selectedRoute[type]?.routeId === routeId && (state.quoteErrorMessage = 'Quote expired, please refresh routes.');
                }
            }, 1000);
        },
    },
    actions: {
        async getServices({ commit }: { commit: any }) {
            const response = await getAllServices();

            if (!response.length) return [];

            commit(TYPES.SET_SERVICES, response);
        },

        setSelectedRoute({ commit }: { commit: any }, value: { serviceType: ServiceTypes; value: IQuoteRoute }) {
            commit(TYPES.SET_SELECTED_ROUTE, value);
        },

        setTargetServiceType({ commit }: { commit: any }, value: ServiceTypes) {
            commit(TYPES.SET_SERVICE_TYPE, value);
        },

        resetSelectedRoute({ commit }: { commit: any }, value: { serviceType: ServiceTypes }) {
            commit(TYPES.SET_QUOTE_ROUTES, {
                serviceType: value.serviceType,
                value: null,
            });

            commit(TYPES.SET_SELECTED_ROUTE, {
                serviceType: value.serviceType,
                value: null,
            });
        },

        setQuoteRoutes({ commit }: { commit: any }, value: { serviceType: ServiceTypes; value: IQuoteRoute }) {
            commit(TYPES.SET_QUOTE_ROUTES, value);
        },

        setServiceAllowance({ commit }: { commit: any }, value: { serviceId: string; owner: string; token: string; value: string }) {
            commit(TYPES.SET_SERVICE_ALLOWANCE, value);
        },

        setLoaderStateByType({ commit }: { commit: any }, value: { type: string; value: boolean }) {
            commit(TYPES.SET_LOADER_STATE_BY_TYPE, value);
        },

        setReloadRoutes({ commit }: { commit: any }, value: boolean) {
            commit(TYPES.SET_RELOAD_ROUTES, value);
        },

        setQuoteErrorMessage({ commit }: { commit: any }, value: string) {
            commit(TYPES.SET_QUOTE_ERROR_MESSAGE, value);
        },

        setRouteTimer({ state, commit }: { state: IState; commit: any }, { routeId, type }: { routeId: string; type: string }) {
            commit(TYPES.SET_ROUTE_TIMER, { routeId, type });
        },

        clearRouteTimer({ state, commit }: { state: IState; commit: any }, { routeId }: { routeId: string }) {
            clearInterval(state.routeTimer[routeId]);
            state.routeTimer[routeId] = null;
            state.routeTimerSeconds[routeId] = { seconds: null, percent: null };
        },
    },
};
