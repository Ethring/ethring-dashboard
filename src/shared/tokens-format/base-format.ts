import { ECOSYSTEMS } from '@/Adapter/config';

export const formatRecord = (ecosystem: string, chain: string, token: any) => {
    token.id = `${chain}:tokens__${token.address}:${token.symbol}`;
    token.chain = chain;
    token.ecosystem = ecosystem?.toUpperCase() || '';
    token.balance = 0;
    token.balanceUsd = 0;

    if (token.ecosystem === ECOSYSTEMS.COSMOS) {
        token.base = token.address;
    }

    return token;
};
