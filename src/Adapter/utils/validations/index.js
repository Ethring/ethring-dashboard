import { bech32 } from 'bech32';

export function validateCosmosAddress(address, prefix) {
    try {
        const result = bech32.decode(address);
        return result.prefix === prefix;
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
