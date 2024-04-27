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

    CALL_CONTRACT_METHOD = 'CALL_CONTRACT_METHOD',
}

export type TX_TYPES = keyof typeof TRANSACTION_TYPES;
