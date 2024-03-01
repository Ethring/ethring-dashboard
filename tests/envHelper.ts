export enum TEST_CONST {
    MM_VERSION = 'MM_VERSION',
    MM_ID = 'MM_ID',
    PASS_BY_MM_WALLET = 'PASS_BY_MM_WALLET',

    KEPLR_VERSION = 'KEPLR_VERSION',
    KEPLR_ID = 'KEPLR_ID',
    PASS_BY_KEPLR_WALLET = 'PASS_BY_KEPLR_WALLET',

    SEED_BY_MOCK_TX = 'SEED_BY_MOCK_TX',
    ETH_ADDRESS_TX = 'ETH_ADDRESS_TX',
    COSMOS_ADDRESS_TX = 'COSMOS_ADDRESS_TX',

    SEED_BY_MOCK_TX_2 = 'SEED_BY_MOCK_TX_2',
    ETH_ADDRESS_TX_2 = 'ETH_ADDRESS_TX_2',

    SEED_BY_MOCK_TX_3 = 'SEED_BY_MOCK_TX_3',
    ETH_ADDRESS_TX_3 = 'ETH_ADDRESS_TX_3',

    RECIPIENT_ADDRESS = 'RECIPIENT_ADDRESS',
    SUCCESS_TX_HASH_BY_MOCK = 'SUCCESS_TX_HASH_BY_MOCK',

    SEED_BY_PROTOCOL_TEST = 'SEED_BY_PROTOCOL_TEST',
    ETH_ADDRESS_BY_PROTOCOL_TEST = 'ETH_ADDRESS_BY_PROTOCOL_TEST',

    EMPTY_SEED = 'EMPTY_SEED',
    EMPTY_ETH_ADDRESS = 'EMPTY_ETH_ADDRESS'
}

export function getTestVar(key: TEST_CONST): string {
    const value = process.env[key];
    if (value === undefined) {
        throw new Error(`Environment variable ${key} is not defined.`);
    }
    return value;
}
