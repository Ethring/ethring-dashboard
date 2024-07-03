import { describe, test, expect, vi, beforeEach, expectTypeOf } from 'vitest';

import useTokensList from '../../../../src/compositions/useTokensList';
import useAdapter from '../../../../src/core/wallet-adapter/compositions/useAdapter';

import { createTestStore } from '../../mocks/store';
import { Ecosystem } from '../../../../src/shared/models/enums/ecosystems.enum';
import { COSMOS_TEST_ADAPTER, EVM_TEST_ADAPTER, chainListMockCosmos, chainListMockEvm } from '../../mocks/compositions';

const list = [...chainListMockEvm, ...chainListMockCosmos];

describe('getTokensFromConfig', () => {
    let store: any;

    beforeEach(() => {
        vi.resetAllMocks();
        store = createTestStore();
    });

    for (const chain of list)
        test(`-> ${chain.ecosystem}:${chain.net} must return tokens list from config`, async () => {
            const { getTokensFromConfig } = useTokensList({ tmpStore: store });
            const tokens = await getTokensFromConfig(chain.net);

            expect(tokens).not.toEqual([]);
            expect(tokens.length).toBeGreaterThan(0);

            expect(tokens[0]).toHaveProperty('chain');
            expect(tokens[0].chain).toBe(chain.net);
            expect(tokens[0]).toHaveProperty('symbol');
        });
});

describe('setNativeTokenInfo', () => {
    let store: any;

    beforeEach(() => {
        vi.resetAllMocks();
        store = createTestStore();
    });

    for (const chain of list) {
        test(`-> ${chain.ecosystem}:${chain.net} must set Native token info to allTokens list if its not exist`, async () => {
            const tokensList = [];
            const { setNativeTokenInfo } = useTokensList({ tmpStore: store });

            const tokens = setNativeTokenInfo(chain, tokensList);

            expect(tokens).not.toEqual([]);
            expect(tokens).toHaveLength(1);
            expect(tokens[0]).toHaveProperty('chain');
            expect(tokens[0].chain).toBe(chain.net);
            expect(tokens[0]).toHaveProperty('symbol');
            expect(tokens[0].id).toContain('native');
        });

        test(`-> ${chain.ecosystem}:${chain.net} must update Native token info to allTokens list if its exist`, async () => {
            const chainConfig = chain as any;
            const nativeToken = chainConfig?.native_token || chainConfig?.asset;

            const tokensList = [
                {
                    id: `${chain.net}:tokens__native:${nativeToken.symbol}`,
                },
            ];

            const { setNativeTokenInfo } = useTokensList({ tmpStore: store });

            const tokens = setNativeTokenInfo(chain, tokensList);

            expect(tokens).not.toEqual([]);
            expect(tokens).toHaveLength(1);
            expect(tokens[0]).toHaveProperty('chain');
            expect(tokens[0].chain).toBe(chain.net);
            expect(tokens[0]).toHaveProperty('symbol');
            expect(tokens[0].id).toContain('native');
        });
    }
});

describe('getTokensList', () => {
    let store: any;

    beforeEach(() => {
        vi.resetAllMocks();
        store = createTestStore();
    });

    for (const chain of chainListMockEvm)
        test(`-> ${chain.ecosystem}:${chain.net} must return tokens list`, async () => {
            const { getTokensList } = useTokensList({ tmpStore: store });

            const tokens = await getTokensList({
                srcNet: chain,
            });

            expect(tokens).not.toEqual([]);
            expect(tokens.length).toBeGreaterThan(0);

            expect(tokens[0]).toHaveProperty('chain');
            expect(tokens[0].chain).toBe(chain.net);
            expect(tokens[0]).toHaveProperty('symbol');
        });

    for (const chain of chainListMockCosmos)
        test(`-> ${chain.ecosystem}:${chain.net} must return tokens list & tokens must have base`, async () => {
            const { getTokensList } = useTokensList({ tmpStore: store });

            const tokens = await getTokensList({
                srcNet: chain,
            });

            expect(tokens).not.toEqual([]);
            expect(tokens.length).toBeGreaterThan(0);

            expect(tokens[0]).toHaveProperty('base');
            expect(tokens[0].base).toBe(chain.asset.base);

            expect(tokens[0]).toHaveProperty('chain');
            expect(tokens[0].chain).toBe(chain.net);
            expect(tokens[0]).toHaveProperty('symbol');
        });

    for (const chain of list) {
        test(`-> ${chain.ecosystem}:${chain.net} must return tokens list with selected flag`, async () => {
            const { getTokensList } = useTokensList({ tmpStore: store });

            const chainConfig = chain as any;
            const nativeToken = chainConfig?.native_token || chainConfig?.asset;

            const selectedToken = {
                id: `${chain.net}:tokens__native:${nativeToken.symbol}`,
            };

            const tokens = await getTokensList({
                srcNet: chain,
                srcToken: selectedToken,
            });

            expect(tokens).not.toEqual([]);
            expect(tokens.length).toBeGreaterThan(0);
            expect(tokens[0]).toHaveProperty('chain');
            expect(tokens[0].chain).toBe(chain.net);
            expect(tokens[0]).toHaveProperty('selected');
            expect(tokens[0].selected).toBe(true);
        });

        test(`-> ${chain.ecosystem}:${chain.net} must return tokens list without native token`, async () => {
            const { getTokensList } = useTokensList({ tmpStore: store });

            const chainConfig = chain as any;
            const nativeToken = chainConfig?.native_token || chainConfig?.asset;

            const selectedToken = {
                id: `${chain.net}:tokens__native:${nativeToken.symbol}`,
            };

            const tokens = await getTokensList({
                srcNet: chain,
                srcToken: selectedToken,
                exclude: [selectedToken.id],
            });

            expect(tokens).not.toEqual([]);
            expect(tokens.length).toBeGreaterThan(0);
            expect(tokens[0]).toHaveProperty('chain');
            expect(tokens[0].chain).toBe(chain.net);

            expect(tokens.find((tkn) => tkn.id === selectedToken.id)).toBeUndefined();
        });

        test(`-> ${chain.ecosystem}:${chain.net} must return tokens list only with balance`, async () => {
            const { getTokensList } = useTokensList({ tmpStore: store });

            const tokens = await getTokensList({
                srcNet: chain,
                onlyWithBalance: true,
            });

            expect(tokens).not.toEqual([]);
            expect(tokens.length).toBeGreaterThan(0);
            expect(tokens[0]).toHaveProperty('chain');
            expect(tokens[0].chain).toBe(chain.net);
            expect(tokens[0]).toHaveProperty('balanceUsd');
            expect(tokens[0]).toHaveProperty('verified');
            expect(tokens[0].verified).toEqual(expect.any(Boolean));
        });
    }
});

describe('getTokenById', () => {
    let store: any;

    beforeEach(() => {
        vi.resetAllMocks();
        store = createTestStore();
    });

    for (const chain of list) {
        test(`-> ${chain.ecosystem}:${chain.net} must return native token`, async () => {
            const { getTokenById } = useTokensList({ tmpStore: store });

            const chainConfig = chain as any;
            const nativeToken = chainConfig?.native_token || chainConfig?.asset;

            const selectedToken = {
                id: `${chain.net}:tokens__native:${nativeToken.symbol}`,
            };

            const token = await getTokenById(chainConfig, selectedToken.id);

            expect(token).not.toBeNull();
            expect(token).toHaveProperty('chain');
            expect(token.chain).toBe(chain.net);
            expect(token).toHaveProperty('symbol');
        });

        test(`-> ${chain.ecosystem}:${chain.net} must return undefined if token not found`, async () => {
            const { getTokenById } = useTokensList({ tmpStore: store });

            const token = await getTokenById(chain, 'not_exist');

            expect(token).toBeUndefined();
        });
    }
});
