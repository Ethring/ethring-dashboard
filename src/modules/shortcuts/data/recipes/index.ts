import ShortcutOp, { IShortcutOp } from '@/modules/shortcuts/core/ShortcutOp';
import { IShortcutRecipe } from '@/modules/shortcuts/core/ShortcutRecipes';
import { ShortcutType } from '../../core/types/ShortcutType';
import { TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';

export interface IRecipesWithOperations {
    id: string;
    operations: IShortcutRecipe[] | IShortcutOp[];
}

const RECIPES: Record<string, IRecipesWithOperations> = {
    'citadel-one-stake': {
        id: 'citadel-one-stake',
        operations: [
            {
                id: 'bridge-eth-to-osmo',
                name: 'Bridge Tokens to COSMOS (Osmosis)',
                type: ShortcutType.operation,
                moduleType: ModuleType.superSwap,
                operationType: 'BRIDGE',
                serviceId: 'squid',
                layoutComponent: 'SuperSwap',
                isShowLayout: true,
                excludeChains: ['osmosis', 'cosmoshub', 'optimism', 'eth', 'fantom', 'injective'],
                ecosystems: ['EVM', 'COSMOS'],
                operationParams: {
                    fromNet: 'bsc',
                    toNet: 'osmosis',
                    fromToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                    toToken: 'uosmo',
                },
                params: [
                    {
                        name: 'srcNetwork',
                        hide: false,
                        disabled: false,
                        ecosystem: 'EVM',
                        chainId: 56,
                    },
                    {
                        name: 'srcToken',
                        disabled: false,
                        hide: false,
                        chain: 'bsc',
                        address: null,
                        id: 'bsc:tokens__native:BNB',
                    },
                    {
                        name: 'dstNetwork',
                        disabled: true,
                        hide: false,
                        ecosystem: 'COSMOS',
                        chainId: 'osmosis',
                    },
                    {
                        name: 'dstToken',
                        disabled: true,
                        hide: false,
                        id: 'osmosis:tokens__native:OSMO',
                        chain: 'osmosis',
                        address: 'uosmo',
                    },
                    {
                        name: 'switchDirection',
                        disabled: true,
                        hide: true,
                    },
                    {
                        name: 'isSendToAnotherAddress',
                        hide: true,
                        disabled: true,
                    },
                    {
                        name: 'isReload',
                        hide: true,
                        disabled: true,
                    },
                ],
            } as IShortcutOp,
            {
                id: 'swap-osmo-to-tokens',
                name: 'Swap OSMO, ATOM, STARS',
                type: ShortcutType.recipe,
                operationType: TRANSACTION_TYPES.BRIDGE,
                moduleType: ModuleType.superSwap,
                layoutComponent: 'SuperSwap',
                isShowLayout: false,
                ecosystems: ['COSMOS'],
                operations: [
                    {
                        id: 'osmo-to-atom',
                        name: 'OSMO to ATOM',
                        type: ShortcutType.operation,
                        operationType: 'BRIDGE',
                        moduleType: 'superSwap',
                        serviceId: 'skip',
                        layoutComponent: 'SuperSwap',
                        ecosystems: ['COSMOS'],
                        isShowLayout: true,
                        dependencies: {
                            operationId: 'bridge-eth-to-osmo',
                            operationParams: [
                                {
                                    dependencyParamKey: 'outputAmount',
                                    paramKey: 'amount',
                                    usePercentage: 50,
                                },
                            ],
                        },
                        operationParams: {
                            fromToken: 'uosmo',
                            toToken: 'uatom',
                            fromNet: 'osmosis',
                            toNet: 'cosmoshub',
                        },
                        params: [
                            {
                                name: 'srcNetwork',
                                disabled: true,
                                hide: false,
                                ecosystem: 'COSMOS',
                                chainId: 'osmosis',
                            },
                            {
                                name: 'srcToken',
                                disabled: true,
                                id: 'osmosis:tokens__native:OSMO',
                                chain: 'osmosis',
                                address: 'uosmo',
                                hide: false,
                            },
                            {
                                name: 'dstNetwork',
                                disabled: true,
                                ecosystem: 'COSMOS',
                                chainId: 'cosmoshub',
                                hide: false,
                            },
                            {
                                name: 'dstToken',
                                disabled: true,
                                id: 'cosmoshub:tokens__native:ATOM',
                                chain: 'cosmoshub',
                                address: 'uatom',
                                hide: false,
                            },
                            {
                                name: 'switchDirection',
                                disabled: true,
                                hide: false,
                            },
                            {
                                name: 'isReload',
                                hide: true,
                                disabled: true,
                            },
                        ],
                    },
                    {
                        id: 'osmo-to-stars',
                        name: 'OSMO to STARS',
                        serviceId: 'skip',
                        type: ShortcutType.operation,
                        operationType: TRANSACTION_TYPES.BRIDGE,
                        moduleType: ModuleType.superSwap,
                        layoutComponent: 'SuperSwap',
                        operationParams: {
                            fromToken: 'uosmo',
                            toToken: 'ustars',
                            fromNet: 'osmosis',
                            toNet: 'stargaze',
                        },
                        ecosystems: ['COSMOS'],
                        dependencies: {
                            operationId: 'bridge-eth-to-osmo',
                            operationParams: [
                                {
                                    dependencyParamKey: 'outputAmount',
                                    paramKey: 'amount',
                                    usePercentage: 20,
                                },
                            ],
                        },
                        params: [
                            {
                                name: 'srcNetwork',
                                disabled: true,
                                ecosystem: 'COSMOS',
                                chainId: 'osmosis',
                                hide: false,
                            },
                            {
                                name: 'srcToken',
                                disabled: true,
                                id: 'osmosis:tokens__native:OSMO',
                                chain: 'osmosis',
                                address: 'uosmo',
                                hide: false,
                            },
                            {
                                name: 'dstNetwork',
                                disabled: true,
                                ecosystem: 'COSMOS',
                                chainId: 'stargaze',
                                hide: false,
                            },
                            {
                                name: 'dstToken',
                                disabled: true,
                                id: 'stargaze:tokens__native:STARS',
                                chain: 'stargaze',
                                address: 'ustars',
                                hide: false,
                            },
                            {
                                name: 'switchDirection',
                                disabled: true,
                                hide: false,
                            },
                            {
                                name: 'isReload',
                                hide: true,
                                disabled: true,
                            },
                        ],
                    },
                ],
            } as IShortcutRecipe,
            {
                id: 'stake-to-citadel-one',
                name: 'Stake to the Citadel.one',
                type: ShortcutType.recipe,
                operationType: TRANSACTION_TYPES.STAKE,
                moduleType: ModuleType.stake,
                layoutComponent: 'StakeLayout',
                isShowLayout: false,
                ecosystems: ['COSMOS'],
                operations: [
                    {
                        id: 'stake-atom',
                        name: 'Stake ATOM',
                        type: ShortcutType.operation,
                        operationType: TRANSACTION_TYPES.STAKE,
                        moduleType: ModuleType.stake,
                        layoutComponent: 'StakeLayout',
                        isShowLayout: true,
                        ecosystems: ['COSMOS'],
                        operationParams: {
                            net: 'cosmoshub',
                            fromNet: 'cosmoshub',
                            fromToken: 'uatom',
                            receiverAddress: 'cosmosvaloper1lzhlnpahvznwfv4jmay2tgaha5kmz5qxerarrl',
                            memo: 'Stake to the Citadel.one validator | From zomet.app',
                        },
                        dependencies: {
                            operationId: 'osmo-to-atom',
                            operationParams: [
                                {
                                    dependencyParamKey: 'outputAmount',
                                    paramKey: 'amount',
                                    usePercentage: 95,
                                },
                            ],
                        },
                        params: [
                            {
                                name: 'srcNetwork',
                                disabled: true,
                                ecosystem: 'COSMOS',
                                chainId: 'cosmoshub',
                                hide: false,
                            },
                            {
                                name: 'srcToken',
                                disabled: true,
                                id: 'cosmoshub:tokens__native:ATOM',
                                chain: 'cosmoshub',
                                address: 'uatom',
                                hide: false,
                            },
                            {
                                name: 'receiverAddress',
                                type: 'address',
                                disabled: true,
                                address: 'cosmosvaloper1lzhlnpahvznwfv4jmay2tgaha5kmz5qxerarrl',
                                hide: false,
                            },
                            {
                                name: 'memo',
                                type: 'string',
                                disabled: true,
                                memo: 'Stake to the Citadel.one validator | From zomet.app',
                                hide: false,
                            },
                        ],
                    },
                    {
                        id: 'stake-osmo',
                        name: 'Stake OSMO',
                        type: ShortcutType.operation,
                        operationType: TRANSACTION_TYPES.STAKE,
                        moduleType: ModuleType.stake,
                        layoutComponent: 'StakeLayout',
                        isShowLayout: true,
                        ecosystems: ['COSMOS'],
                        operationParams: {
                            net: 'osmosis',
                            fromNet: 'osmosis',
                            fromToken: 'uosmo',
                            receiverAddress: 'osmovaloper1lzhlnpahvznwfv4jmay2tgaha5kmz5qxwmj9we',
                            memo: 'Stake to the Citadel.one validator | From zomet.app',
                        },
                        dependencies: {
                            operationId: 'bridge-eth-to-osmo',
                            operationParams: [
                                {
                                    dependencyParamKey: 'outputAmount',
                                    paramKey: 'amount',
                                    usePercentage: 30,
                                },
                            ],
                        },
                        params: [
                            {
                                name: 'srcNetwork',
                                disabled: true,
                                ecosystem: 'COSMOS',
                                chainId: 'osmosis',
                                hide: false,
                            },
                            {
                                name: 'srcToken',
                                disabled: true,
                                id: 'osmosis:tokens__native:OSMO',
                                chain: 'osmosis',
                                address: 'uosmo',
                                hide: false,
                            },
                            {
                                name: 'receiverAddress',
                                type: 'address',
                                disabled: true,
                                hide: false,
                                address: 'osmovaloper1lzhlnpahvznwfv4jmay2tgaha5kmz5qxwmj9we',
                            },
                            {
                                name: 'memo',
                                type: 'string',
                                hide: false,
                                disabled: true,
                                memo: 'Stake to the Citadel.one validator | From zomet.app',
                            },
                        ],
                    },
                    {
                        id: 'stake-stars',
                        name: 'Stake STARS',
                        type: ShortcutType.operation,
                        operationType: TRANSACTION_TYPES.STAKE,
                        moduleType: ModuleType.stake,
                        layoutComponent: 'StakeLayout',
                        isShowLayout: true,
                        ecosystems: ['COSMOS'],
                        operationParams: {
                            net: 'stargaze',
                            fromNet: 'stargaze',
                            fromToken: 'ustars',
                            receiverAddress: 'starsvaloper1qv2tdjma7dcg6jmgawwd0aajjcx89rqca0cqgr',
                            memo: 'Stake to the Citadel.one validator | From zomet.app',
                        },
                        dependencies: {
                            operationId: 'osmo-to-stars',
                            operationParams: [
                                {
                                    dependencyParamKey: 'outputAmount',
                                    paramKey: 'amount',
                                    usePercentage: 95,
                                },
                            ],
                        },
                        params: [
                            {
                                name: 'srcNetwork',
                                disabled: true,
                                hide: false,
                                ecosystem: 'COSMOS',
                                chainId: 'stargaze',
                            },
                            {
                                name: 'srcToken',
                                disabled: true,
                                hide: false,
                                id: 'stargaze:tokens__native:STARS',
                                chain: 'stargaze',
                                address: 'ustars',
                            },
                            {
                                name: 'receiverAddress',
                                type: 'address',
                                disabled: true,
                                hide: false,
                                address: 'starsvaloper1qv2tdjma7dcg6jmgawwd0aajjcx89rqca0cqgr',
                            },
                            {
                                name: 'memo',
                                type: 'string',
                                hide: false,
                                disabled: true,
                                memo: 'Stake to the Citadel.one validator | From zomet.app',
                            },
                        ],
                    },
                ],
            } as IShortcutRecipe,
        ],
    },
    'mint-collection': {
        id: 'mint-collection',
        operations: [
            {
                id: 'mint-nft-stargaze',
                name: 'Mint NFT',
                type: ShortcutType.operation,
                moduleType: ModuleType.nft,
                operationType: TRANSACTION_TYPES.EXECUTE_MULTIPLE,
                layoutComponent: 'MintNftLayout',
                isShowLayout: true,
                excludeChains: [],
                ecosystems: ['COSMOS'],
                operationParams: {
                    fromNet: 'stargaze',
                    fromToken: 'ustars',
                    toNet: null,
                    toToken: null,
                },
                params: [
                    {
                        name: 'srcNetwork',
                        hide: false,
                        disabled: false,
                        ecosystem: 'COSMOS',
                        chainId: 'stargaze',
                    },
                    {
                        name: 'srcToken',
                        disabled: true,
                        id: 'stargaze:tokens__native:STARS',
                        chain: 'stargaze',
                        address: 'ustars',
                        hide: false,
                    },
                    {
                        name: 'contractAddress',
                        type: 'address',
                        disabled: true,
                        address: 'stars13mghwhxmj9athjgc3ge8pgdmh6hnchl0gkqsk29s925p9ta0em3sqssr39',
                        hide: false,
                    },
                ],
            },
        ],
    },
};

export const getRecipeById = (id: string): IRecipesWithOperations => {
    if (!RECIPES[id]) {
        return {
            id: '',
            operations: [],
        };
    }

    return RECIPES[id];
};

export default RECIPES;
