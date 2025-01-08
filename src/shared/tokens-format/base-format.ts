import { toLower, toUpper } from 'lodash';
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

export const formatRecord = (ecosystem: Ecosystems, chain: string, token: any) => {
    if (![Ecosystem.COSMOS as string].includes(ecosystem?.toUpperCase())) token.address = toLower(token.address);

    const symbolUpperCase = token.symbol.toUpperCase();
    token.id = `${chain}:tokens__${token.address}:${symbolUpperCase}`;
    token.chain = chain;
    token.ecosystem = ecosystem?.toUpperCase() || '';
    token.balance = 0;
    token.balanceUsd = 0;

    if (token.ecosystem === Ecosystem.COSMOS) token.base = token.address;

    return token;
};
