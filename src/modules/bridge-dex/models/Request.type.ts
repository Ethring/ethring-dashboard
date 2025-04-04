import { ServiceTypes, ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';

type ServiceTypeParams = {
    type: ServiceTypes;
    routeId?: string;
};

type ServiceIdParams = {
    serviceId: string;
};

type ServiceIdOptional = {
    serviceId?: string;
    routeId?: string;
};

export type OwnerAddresses = {
    [key: string]: string;
};

type AllowanceParams = {
    tokenAddress: string;
    ownerAddress: string;
};

type ApproveParams = AllowanceParams & {
    amount: string;
    gasPrice?: string;
};

type SwapParams = {
    fromToken: string;
    toToken: string;

    amount: string;
    ownerAddresses: OwnerAddresses | string;

    gasPrice?: string;
    receiverAddress?: OwnerAddresses | string;

    slippageTolerance: number;
};

type FromToNetworks = {
    fromNet: string;
    toNet: string;
};

type OnlyFromNetwork = {
    net: string;
};

export type Allowance = OnlyFromNetwork & AllowanceParams;
export type Approve = OnlyFromNetwork & ApproveParams;
export type Swap = FromToNetworks & SwapParams;

export type GetAllowanceParams = ServiceTypeParams & ServiceIdParams & Allowance;
export type GetApproveTxParams = ServiceTypeParams & ServiceIdParams & Approve;

// This is a conditional type that will return the correct type based on the service type
export type GetSwapTxParams = ServiceTypeParams & ServiceIdParams & Swap & OnlyFromNetwork;

export type GetQuoteParams = ServiceTypeParams & ServiceIdOptional & SwapParams & FromToNetworks;

export type AllQuoteParams = ServiceTypeParams & ServiceIdOptional & OnlyFromNetwork & FromToNetworks & SwapParams;

type DexAllowedKeys = keyof ServiceIdOptional | 'type' | keyof SwapParams | keyof OnlyFromNetwork;
type BridgedexAllowedKeys = keyof ServiceIdOptional | 'type' | keyof SwapParams | keyof FromToNetworks;

export type QuoteParams<T extends ServiceType> = T extends ServiceType.dex
    ? Omit<AllQuoteParams, Exclude<keyof AllQuoteParams, DexAllowedKeys>>
    : Omit<AllQuoteParams, Exclude<keyof AllQuoteParams, BridgedexAllowedKeys>>;

export type SwapTxParams<T extends ServiceType> = T extends ServiceType.dex
    ? Omit<AllQuoteParams, Exclude<keyof AllQuoteParams, DexAllowedKeys>>
    : Omit<AllQuoteParams, Exclude<keyof AllQuoteParams, BridgedexAllowedKeys>>;

// variable with key of type ServiceType
export const DexKeys: DexAllowedKeys[] = [
    'type',
    'fromToken',
    'toToken',
    'amount',
    'ownerAddresses',
    'net',
    'slippageTolerance',
    'receiverAddress',
    'routeId',
];

export const BridgedexKeys: BridgedexAllowedKeys[] = [
    'type',
    'fromToken',
    'toToken',
    'amount',
    'serviceId',
    'ownerAddresses',
    'fromNet',
    'toNet',
    'slippageTolerance',
    'receiverAddress',
    'routeId',
];

export const AllQuoteParamsKeys = [
    'type',
    'fromToken',
    'toToken',
    'amount',
    'net',
    'toNet',
    'fromNet',
    'serviceId',
    'ownerAddresses',
    'slippageTolerance',
    'routeId',
];

export const QuoteParamsKeys = {
    [ServiceType.dex]: DexKeys,
    [ServiceType.bridgedex]: BridgedexKeys,
    [ServiceType.superswap]: BridgedexKeys,
};
