export const NATIVE_CONTRACT = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export const BASE_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'address', name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
        name: 'nonces',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

export const SILO_EXECUTE_ABI = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_wrappedNativeToken',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_siloRepository',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'ApprovalFailed',
        type: 'error',
    },
    {
        inputs: [],
        name: 'ERC20TransferFailed',
        type: 'error',
    },
    {
        inputs: [],
        name: 'EthTransferFailed',
        type: 'error',
    },
    {
        inputs: [],
        name: 'InvalidSilo',
        type: 'error',
    },
    {
        inputs: [],
        name: 'InvalidSiloRepository',
        type: 'error',
    },
    {
        inputs: [],
        name: 'TokenIsNotAContract',
        type: 'error',
    },
    {
        inputs: [],
        name: 'UnsupportedAction',
        type: 'error',
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'enum SiloRouter.ActionType',
                        name: 'actionType',
                        type: 'uint8',
                    },
                    {
                        internalType: 'contract ISilo',
                        name: 'silo',
                        type: 'address',
                    },
                    {
                        internalType: 'contract IERC20',
                        name: 'asset',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bool',
                        name: 'collateralOnly',
                        type: 'bool',
                    },
                ],
                internalType: 'struct SiloRouter.Action[]',
                name: '_actions',
                type: 'tuple[]',
            },
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'siloRepository',
        outputs: [
            {
                internalType: 'contract ISiloRepository',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'siloRouterPing',
        outputs: [
            {
                internalType: 'bytes4',
                name: '',
                type: 'bytes4',
            },
        ],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [],
        name: 'wrappedNativeToken',
        outputs: [
            {
                internalType: 'contract IWrappedNativeToken',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        stateMutability: 'payable',
        type: 'receive',
    },
];

export const BEEFY_DEPOSIT_ABI = [
    {
        inputs: [{ internalType: 'uint256', name: '_amount', type: 'uint256' }],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { inputs: [], name: 'depositAll', outputs: [], stateMutability: 'nonpayable', type: 'function' },
];

export const EXTRA_FI_ABI = [
    {
        inputs: [
            { internalType: 'uint256', name: 'reserveId', type: 'uint256' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'onBehalfOf', type: 'address' },
            { internalType: 'uint16', name: 'referralCode', type: 'uint16' },
        ],
        name: 'depositAndStake',
        outputs: [{ internalType: 'uint256', name: 'eTokenAmount', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function',
    },
];

export const COMPOUND_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'asset', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'supply',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

export const BERACHAIN_ABI = [
    {
        inputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'caller', type: 'address' },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
        name: 'stake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'validator', type: 'address' },
            { internalType: 'uint128', name: 'amount', type: 'uint128' },
        ],
        name: 'queueBoost',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        type: 'function',
        name: 'previewMultiSwap',
        inputs: [
            {
                name: '_steps',
                type: 'tuple[]',
                internalType: 'struct SwapHelpers.SwapStep[]',
                components: [
                    {
                        name: 'poolIdx',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'base',
                        type: 'address',
                        internalType: 'address',
                    },
                    {
                        name: 'quote',
                        type: 'address',
                        internalType: 'address',
                    },
                    {
                        name: 'isBuy',
                        type: 'bool',
                        internalType: 'bool',
                    },
                ],
            },
            {
                name: '_amount',
                type: 'uint128',
                internalType: 'uint128',
            },
        ],
        outputs: [
            {
                name: 'out',
                type: 'uint128',
                internalType: 'uint128',
            },
            {
                name: 'predictedQty',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'multiSwap',
        inputs: [
            {
                name: '_steps',
                type: 'tuple[]',
                internalType: 'struct SwapHelpers.SwapStep[]',
                components: [
                    {
                        name: 'poolIdx',
                        type: 'uint256',
                        internalType: 'uint256',
                    },
                    {
                        name: 'base',
                        type: 'address',
                        internalType: 'address',
                    },
                    {
                        name: 'quote',
                        type: 'address',
                        internalType: 'address',
                    },
                    {
                        name: 'isBuy',
                        type: 'bool',
                        internalType: 'bool',
                    },
                ],
            },
            {
                name: '_amount',
                type: 'uint128',
                internalType: 'uint128',
            },
            {
                name: '_minOut',
                type: 'uint128',
                internalType: 'uint128',
            },
        ],
        outputs: [
            {
                name: 'out',
                type: 'uint128',
                internalType: 'uint128',
            },
        ],
        stateMutability: 'payable',
    },
    {
        type: 'function',
        name: 'getReward',
        inputs: [
            {
                name: 'account',
                type: 'address',
                internalType: 'address',
            },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'earned',
        inputs: [
            {
                name: 'account',
                type: 'address',
                internalType: 'address',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'uint256',
                internalType: 'uint256',
            },
        ],
        stateMutability: 'view',
    },
];

export const MITOSIS_ABI = [
    {
        inputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'receiver', type: 'address' },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
