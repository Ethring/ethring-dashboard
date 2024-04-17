import { bech32 } from 'bech32';

export function validateCosmosAddress(address, prefix) {
    const validPrefixes = [
        // Base prefix
        prefix,

        // Legacy prefixes for validators
        `${prefix}valoper`,
        `${prefix}valcons`,
    ];

    try {
        const result = bech32.decode(address);

        return validPrefixes.includes(result.prefix);
    } catch (error) {
        return false;
    }
}

export function validateEthAddress(address, regex) {
    try {
        const reg = new RegExp(regex);
        return reg.test(address);
    } catch (e) {
        return false;
    }
}
