import _ from 'lodash';
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

export const formatRecord = (ecosystem: Ecosystems, chain: string, token: any) => {
    if (![Ecosystem.COSMOS as string].includes(ecosystem?.toUpperCase())) token.address = _.toLower(token.address);

    token.id = `${chain}:tokens__${token.address}:${token.symbol}`;
    token.chain = chain;
    token.ecosystem = ecosystem?.toUpperCase() || '';
    token.balance = 0;
    token.balanceUsd = 0;

    if (token.ecosystem === Ecosystem.COSMOS) token.base = token.address;

    return token;
};
