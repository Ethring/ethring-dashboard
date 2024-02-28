import { ServiceTypes, ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';

type ServiceTypeParams = {
    type: ServiceTypes;
};

type ServiceIdParams = {
    serviceId: string;
};

type ServiceIdOptional = {
    serviceId?: string;
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
    ownerAddresses: OwnerAddresses;

    gasPrice?: string;
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
export type Network<T extends ServiceType> = T extends ServiceType.dex ? OnlyFromNetwork : FromToNetworks;

export type GetSwapTxParams<T extends ServiceType> = ServiceTypeParams & ServiceIdParams & Network<T> & SwapParams;
export type GetQuoteParams<T extends ServiceType> = ServiceTypeParams & ServiceIdOptional & Network<T> & SwapParams;

export type AllQuoteParams = GetQuoteParams<ServiceType.dex> & GetQuoteParams<ServiceType.bridgedex>;

type DexAllowedKeys = keyof ServiceIdOptional | 'type' | keyof SwapParams | keyof OnlyFromNetwork;
type BridgedexAllowedKeys = keyof ServiceIdOptional | 'type' | keyof SwapParams | keyof FromToNetworks;

export type QuoteParams<T extends ServiceType> = T extends ServiceType.dex
    ? Omit<AllQuoteParams, Exclude<keyof AllQuoteParams, DexAllowedKeys>>
    : Omit<AllQuoteParams, Exclude<keyof AllQuoteParams, BridgedexAllowedKeys>>;

export type SwapTxParams<T extends ServiceType> = T extends ServiceType.dex
    ? Omit<AllQuoteParams, Exclude<keyof AllQuoteParams, DexAllowedKeys>>
    : Omit<AllQuoteParams, Exclude<keyof AllQuoteParams, BridgedexAllowedKeys>>;

// variable with key of type ServiceType
export const DexKeys: DexAllowedKeys[] = ['type', 'fromToken', 'toToken', 'amount', 'ownerAddresses', 'net'];

export const BridgedexKeys: BridgedexAllowedKeys[] = [
    'type',
    'fromToken',
    'toToken',
    'amount',
    'serviceId',
    'ownerAddresses',
    'fromNet',
    'toNet',
];

export const AllQuoteParamsKeys = ['type', 'fromToken', 'toToken', 'amount', 'net', 'toNet', 'fromNet', 'serviceId', 'ownerAddresses'];

export const QuoteParamsKeys = {
    [ServiceType.dex]: DexKeys,
    [ServiceType.bridgedex]: BridgedexKeys,
};
