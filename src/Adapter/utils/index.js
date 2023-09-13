import { bech32 } from 'bech32';

function decodeBech32(address) {
    const decoded = bech32.decode(address);
    return {
        prefix: decoded.prefix,
        data: Buffer.from(bech32.fromWords(decoded.words)),
    };
}

export function reEncodeWithNewPrefix(prefix, originalAddress) {
    const decoded = decodeBech32(originalAddress);
    return bech32.encode(prefix, bech32.toWords(decoded.data));
}

export function isSVG(str) {
    return str.includes('<svg');
}
