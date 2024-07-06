export enum TRANSACTION_TYPES {
    APPROVE = 'APPROVE',
    BRIDGE = 'BRIDGE',
    BUY = 'BUY',
    DEPOSIT = 'DEPOSIT',

    DEX = 'DEX',
    EXECUTE_MULTIPLE = 'EXECUTE_MULTIPLE',
    IBC = 'IBC',

    MINT = 'MINT',

    SEND = 'SEND',
    SIGN = 'SIGN',
    SWAP = 'SWAP',

    TRANSFER = 'TRANSFER',

    STAKE = 'STAKE',
    WRAP = 'WRAP',

    APPROVE_PT = 'APPROVE_PT',
    SWAP_TOKEN_TO_PT = 'SWAP_TOKEN_TO_PT',
    ADD_LIQUIDITY_SINGLE_TOKEN = 'ADD_LIQUIDITY_SINGLE_TOKEN',

    CALL_CONTRACT_METHOD = 'CALL_CONTRACT_METHOD',

    ADD_LIQUIDITY = 'ADD_LIQUIDITY',
    REMOVE_LIQUIDITY = 'REMOVE_LIQUIDITY',
}

export type TX_TYPES = keyof typeof TRANSACTION_TYPES;
