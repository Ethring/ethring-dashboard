export enum TEST_CONST {
    DEV_URL = 'DEV_URL',
    MM_VERSION = 'MM_VERSION',
    MM_ID = 'MM_ID',
    TEST_SEED = 'TEST_SEED',
    TEST_ETH_ADDRESS = 'TEST_ETH_ADDRESS',
    TEST_RECIPIENT_ADDRESS = 'TEST_RECIPIENT_ADDRESS',
}

export function getTestVar(key: TEST_CONST): string {
    const value = process.env[key];
    if (value === undefined) {
        throw new Error(`Environment variable ${key} is not defined.`);
    }
    return value;
}
