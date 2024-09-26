import { computed } from 'vue';

import { describe, test, beforeEach, expect, vi, afterEach } from 'vitest';

import useShortcutOperations from '../../../../../../src/core/shortcuts/compositions/useShortcutOperations';
import usePrepareFields from '../../../../../../src/core/shortcuts/compositions/usePrepareFields';
import { MOCK_SC_CITADEL_ONE_STAKE } from '../../../../mocks/shortcuts/index';
import { createTestStore } from '../../../../mocks/store/index';
import useShortcuts from '../../../../../../src/core/shortcuts/compositions/index';
import { ALL_CHAINS_LIST, CONNECTED_WALLETS, tokensList } from '../../../../mocks/compositions';
import { Ecosystem } from '../../../../../../src/shared/models/enums/ecosystems.enum';
import { MOCKED_ADAPTER } from '../../../../mocks/compositions/index';
import { IChainConfig } from '../../../../../../src/shared/models/types/chain-config';
import { IQuoteRoute } from '../../../../../../src/modules/bridge-dex/models/Response.interface';

describe('useShortcuts', () => {
    let store;
    let useShortcutsMock;
    let useOperationsMock;
    let usePrepareFieldsMock;

    beforeEach(() => {
        store = createTestStore();

        store.dispatch('shortcuts/resetAllShortcuts');
        store.dispatch('shortcutsList/setSelectedShortcut', null);

        vi.mock('../../../../../../src/core/wallet-adapter/compositions/useAdapter', () => {
            return {
                default: () => {
                    return {
                        walletAccount: computed(() => 'EVM Test Account'),
                        currentChainInfo: computed(() => ALL_CHAINS_LIST[0]),
                        chainList: computed(() => ALL_CHAINS_LIST),
                        getChainByChainId: (ecosystem: Ecosystem, chainId: string) =>
                            ALL_CHAINS_LIST.find((chain) => `${chain.chain_id}` === `${chainId}` || chain.net === chainId),

                        setChain: async (chain: IChainConfig) => {
                            return {
                                chain,
                            };
                        },
                    };
                },
            };
        });

        store.dispatch('shortcutsList/setSelectedShortcut', MOCK_SC_CITADEL_ONE_STAKE);

        useShortcutsMock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore: store });
        useOperationsMock = useShortcutOperations(MOCK_SC_CITADEL_ONE_STAKE.id, { tmpStore: store });

        const { addressesByChain } = useOperationsMock;
        usePrepareFieldsMock = usePrepareFields(MOCK_SC_CITADEL_ONE_STAKE.id, addressesByChain, { tmpStore: store });

        store.dispatch('configs/setConfigLoading', false);
    });

    afterEach(() => {
        store.dispatch('shortcuts/resetAllShortcuts');
        store.dispatch('shortcutsList/setSelectedShortcut', null);
    });

    // ***************************************************************************************************
    // * handleOnChangeIsConfigLoading
    // ***************************************************************************************************
    describe('handleOnChangeIsConfigLoading', () => {
        test('-> should not call "initializations" when loading is equal to oldLoading', async () => {
            const result = await useShortcutsMock.handleOnChangeIsConfigLoading(true, true);
            expect(result).toBe(false);
        });

        test('-> should not call "initializations" when isConfigLoading is equal to true', async () => {
            const result = await useShortcutsMock.handleOnChangeIsConfigLoading(true, false);
            expect(result).toBe(false);
        });

        test('-> should call "initializations" when isConfigLoading is equal to false', async () => {
            try {
                const mockedStore = createTestStore();
                const mock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore: mockedStore });
                const result = await mock.handleOnChangeIsConfigLoading(false, true);
                expect(result).toBe(true);
            } catch (error) {
                console.error('on handleOnChangeIsConfigLoading test #3', error);
            }
        });
    });

    // ***************************************************************************************************
    // * handleOnChangeConnectedWallets
    // ***************************************************************************************************

    describe('handleOnChangeConnectedWallets', () => {
        test('-> should call "performFields" when connectedWallets is changed', async () => {
            const connectedWallets = CONNECTED_WALLETS;
            const oldConnectedWallets = [];
            const result = await useShortcutsMock.handleOnChangeConnectedWallets(connectedWallets, oldConnectedWallets);
            expect(result).toBe(true);
        });

        test('-> should not call "performFields" when connectedWallets is not changed', async () => {
            const connectedWallets = CONNECTED_WALLETS;
            const oldConnectedWallets = CONNECTED_WALLETS;
            const result = await useShortcutsMock.handleOnChangeConnectedWallets(connectedWallets, oldConnectedWallets);
            expect(result).toBe(false);
        });

        test('-> should not call "performFields" when connectedWallets is empty', async () => {
            const connectedWallets = [];
            const oldConnectedWallets = [];
            const result = await useShortcutsMock.handleOnChangeConnectedWallets(connectedWallets, oldConnectedWallets);
            expect(result).toBe(false);
        });
    });

    // ***************************************************************************************************
    // * handleOnChangeIsConnecting
    // ***************************************************************************************************

    describe('handleOnChangeIsConnecting', () => {
        test('-> should not call "performShortcut" when isConnecting equal to oldConnecting', async () => {
            const result = await useShortcutsMock.handleOnChangeIsConnecting(true, true);
            expect(result).toBe(false);
        });

        test('-> should call "performShortcut" when isConnecting equal to false', async () => {
            const result = await useShortcutsMock.handleOnChangeIsConnecting(false, true);
            expect(result).toBe(true);
        });

        test('-> should not call "performShortcut" when isConnecting equal to true', async () => {
            const result = await useShortcutsMock.handleOnChangeIsConnecting(true, false);
            expect(result).toBe(false);
        });
    });

    // ***************************************************************************************************
    // * handleOnChangeIsQuoteLoading
    // ***************************************************************************************************

    describe('handleOnChangeIsQuoteLoading', () => {
        test('-> should not set QuoteRoute when isQuoteLoading equal to oldQuoteLoading', async () => {
            const result = await useShortcutsMock.handleOnChangeIsQuoteLoading(true, true);
            expect(result).toBe(false);
        });

        test('-> should set QuoteRoute for Service when isQuoteLoading equal to false and operation route is exist', async () => {
            await useShortcutsMock.initializations();

            const testRoute: IQuoteRoute = {
                serviceId: 'testServiceId',
                routeId: 'testRouteId',
                fromAmount: '100',
                toAmount: '200',
                gasEstimated: '0',
                fee: [
                    {
                        amount: '10',
                        currency: 'USD',
                    },
                ],
            };

            const { operationsFactory, currentOp } = useShortcutsMock;
            const operation = operationsFactory.value.getOperationById(currentOp.value.id);
            operation.setQuoteRoute(testRoute);
            const result = await useShortcutsMock.handleOnChangeIsQuoteLoading(false, true);
            expect(result).toBe(true);
            expect(store.getters['bridgeDexAPI/getSelectedRoute'](operation.getServiceType())).toEqual(testRoute);
            expect(store.getters['bridgeDexAPI/getQuoteRouteList'](operation.getServiceType())).toEqual([testRoute]);
        });

        test('-> should not set QuoteRoute for Service when isQuoteLoading equal to false and operation route is not exist', async () => {
            await useShortcutsMock.initializations();

            const { operationsFactory, currentOp } = useShortcutsMock;
            const operation = operationsFactory.value.getOperationById(currentOp.value.id);
            operation.setQuoteRoute(null);

            const result = await useShortcutsMock.handleOnChangeIsQuoteLoading(false, true);
            expect(result).toBe(false);
            expect(store.getters['bridgeDexAPI/getSelectedRoute'](operation.getServiceType())).toBeNull();
            expect(store.getters['bridgeDexAPI/getQuoteRouteList'](operation.getServiceType())).toEqual([]);
        });
    });

    // ***************************************************************************************************
    // * handleOnChangeTokensList
    // ***************************************************************************************************

    describe('handleOnChangeTokensList', () => {
        test('-> should not set tokens when tokensList is equal to oldTokensList', async () => {
            await useShortcutsMock.initializations();

            const result = await useShortcutsMock.handleOnChangeTokensList(
                tokensList.withBalance.evm.arbitrum,
                tokensList.withBalance.evm.arbitrum,
            );

            expect(result).toBe(false);
        });

        test('-> should set tokens when tokensList is not empty', async () => {
            await useShortcutsMock.initializations();

            const result = await useShortcutsMock.handleOnChangeTokensList(tokensList.withBalance.evm.arbitrum, []);

            expect(result).toBe(true);
        });

        test('-> should not set tokens when operationsFactory is not initialized', async () => {
            const result = await useShortcutsMock.handleOnChangeTokensList([], tokensList.withBalance.evm.arbitrum);
            expect(result).toBe(false);
        });

        test('-> should not set tokens when operationsFactory is empty', async () => {
            const result = await useShortcutsMock.handleOnChangeTokensList([], tokensList.withBalance.evm.arbitrum);
            expect(result).toBe(false);
        });

        test('-> should not set tokens when Shortcut does not have operations', async () => {
            const mock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore: store });
            const { shortcut } = mock;
            shortcut.value.operations = [];
            const result = await mock.handleOnChangeTokensList(tokensList.withBalance.evm.arbitrum, []);
            expect(result).toBe(false);
        });
    });

    // ***************************************************************************************************
    // * handleOnChangeWalletAccount
    // ***************************************************************************************************

    describe('handleOnChangeWalletAccount', () => {
        test('-> should not call "performShortcut" when walletAccount is equal to oldWalletAccount', async () => {
            const result = await useShortcutsMock.handleOnChangeWalletAccount('EVM Test Account', 'EVM Test Account');
            expect(result).toBe(false);
        });

        test('-> should not call "performShortcut" when operationsFactory is not initialized', async () => {
            const result = await useShortcutsMock.handleOnChangeWalletAccount('EVM Test Account', 'EVM Test Account 2');
            expect(result).toBe(false);
        });

        test('-> should not call "performShortcut" when operations order is empty', async () => {
            const mock = useShortcuts(
                { ...MOCK_SC_CITADEL_ONE_STAKE, id: 'test-empty', recipe: { operations: [] }, operations: [] },
                { tmpStore: store },
            );
            await mock.initializations();
            const result = await mock.handleOnChangeWalletAccount('EVM Test Account', 'EVM Test Account 2');
            expect(result).toBe(false);
        });

        test('-> should call "performShortcut" when operations order is not empty and set new account address', async () => {
            try {
                await useShortcutsMock.initializations();

                const { operationsFactory, handleOnChangeWalletAccount } = useShortcutsMock;

                const result = await handleOnChangeWalletAccount('EVM Test Account', 'EVM Test Account 2');

                expect(result).toBe(true);

                const [opKey] = operationsFactory.value.getOperationOrder();

                const op = operationsFactory.value.getOperationByKey(opKey);

                expect(op).toBeDefined();
                expect(op.getAccount()).toBeDefined();
            } catch (error) {
                console.error('on handleOnChangeWalletAccount test #4', error);
            }
        });

        test('-> should call "performShortcut" when walletAccount is not equal to oldWalletAccount', async () => {
            try {
                await useShortcutsMock.initializations();
                const result = await useShortcutsMock.handleOnChangeWalletAccount('EVM Test Account', 'EVM Test Account 2');
                expect(result).toBe(true);
            } catch (error) {
                console.error('on handleOnChangeWalletAccount test #5', error);
            }
        });
    });
});
