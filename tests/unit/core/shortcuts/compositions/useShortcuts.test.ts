import { computed } from 'vue';

import { describe, test, beforeEach, expect, vi, Mock, beforeAll } from 'vitest';

import useShortcutOperations from '../../../../../src/core/shortcuts/compositions/useShortcutOperations';
import usePrepareFields from '../../../../../src/core/shortcuts/compositions/usePrepareFields';
import { MOCK_SC_CITADEL_ONE_STAKE } from '../../../mocks/shortcuts/index';
import { createTestStore } from '../../../mocks/store/index';
import useShortcuts from '../../../../../src/core/shortcuts/compositions/index';
import { ALL_CHAINS_LIST, CONNECTED_WALLETS, tokensList } from '../../../mocks/compositions';
import { Ecosystem } from '../../../../../src/shared/models/enums/ecosystems.enum';
import { MOCKED_ADAPTER } from '../../../mocks/compositions/index';
import { IChainConfig } from '../../../../../src/shared/models/types/chain-config';
import { IQuoteRoute } from '../../../../../src/modules/bridge-dex/models/Response.interface';

describe('useShortcuts', () => {
    let store;
    let useShortcutsMock;
    let useOperationsMock;
    let usePrepareFieldsMock;

    beforeEach(() => {
        store = createTestStore();

        useShortcutsMock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore: store });
        useOperationsMock = useShortcutOperations(MOCK_SC_CITADEL_ONE_STAKE.id, { tmpStore: store });

        const { addressesByChain } = useOperationsMock;
        usePrepareFieldsMock = usePrepareFields(MOCK_SC_CITADEL_ONE_STAKE.id, addressesByChain, { tmpStore: store });

        vi.mock('../../../../../src/core/wallet-adapter/compositions/useAdapter', () => {
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

        store.dispatch('configs/setConfigLoading', false);
    });

    describe('WATCHERS: HANDLERS', () => {
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
                const result = await useShortcutsMock.handleOnChangeIsConfigLoading(false, true);
                expect(result).toBe(true);
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
                shortcut.operations = [];
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

            test('-> should call "performShortcut" when walletAccount is not equal to oldWalletAccount', async () => {
                await useShortcutsMock.initializations();
                const result = await useShortcutsMock.handleOnChangeWalletAccount('EVM Test Account', 'EVM Test Account 2');
                expect(result).toBe(true);
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
                await useShortcutsMock.initializations();
                const result = await useShortcutsMock.handleOnChangeWalletAccount('EVM Test Account', 'EVM Test Account 2');
                expect(result).toBe(true);

                const { operationsFactory } = useShortcutsMock;

                for (const opKey of operationsFactory.value.getOperationOrder()) {
                    const op = operationsFactory.value.getOperationByKey(opKey);
                    expect(op).toBeDefined();
                    expect(op.getAccount()).toBeDefined();
                }
            });
        });
    });

    describe('initialize', () => {
        test('-> should initialize correctly', async () => {
            const { shortcut, initializations, isShortcutLoading, operationsFactory } = useShortcutsMock;
            await initializations();

            expect(operationsFactory).toBeDefined();
            expect(isShortcutLoading.value).toBeDefined();
            expect(isShortcutLoading.value).toBe(false);

            expect(store.getters['shortcuts/getCurrentShortcutId']).toEqual(MOCK_SC_CITADEL_ONE_STAKE.id);
            const [firstOp] = shortcut.operations;
            expect(store.getters['shortcuts/getCurrentStepId']).toEqual(firstOp.id);
            expect(store.getters['shortcuts/getShortcutIndex']).toEqual(0);
        });

        test('-> should return error when shortcut is passed as null', async () => {
            try {
                useShortcuts(null, { tmpStore: store });
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toEqual('Shortcut id is required');
            }
        });

        test('-> should return error when shortcut id is not passed', async () => {
            try {
                useShortcuts({} as any, { tmpStore: store });
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toEqual('Shortcut id is required');
            }
        });

        test('-> should return error when shortcut is passed as undefined', async () => {
            try {
                useShortcuts(undefined, { tmpStore: store });
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toEqual('Shortcut id is required');
            }
        });

        test('-> should not initialize shortcut when config is loading', async () => {
            store.dispatch('configs/setConfigLoading', true);

            const tmpStore = createTestStore();
            const mock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore });

            const { initShortcutAndLayout } = mock;

            const result = await initShortcutAndLayout();

            expect(result).toBe(false);
            expect(tmpStore.getters['shortcuts/getCurrentShortcutId']).toBe('');
            expect(tmpStore.getters['shortcuts/getCurrentStepId']).toBe('');
            expect(tmpStore.getters['shortcuts/getShortcutIndex']).toBe(0);
        });
    });

    describe('initShortcutAndLayout', () => {
        test('-> should initialize shortcut correctly', async () => {
            const { initShortcutAndLayout } = useShortcutsMock;
            await initShortcutAndLayout();

            expect(store.getters['shortcuts/getCurrentShortcutId']).toEqual(MOCK_SC_CITADEL_ONE_STAKE.id);
            expect(store.getters['shortcuts/getCurrentStepId']).toEqual(MOCK_SC_CITADEL_ONE_STAKE.operations[0].id);
            expect(store.getters['shortcuts/getShortcutIndex']).toEqual(0);
        });

        test('-> should initialize shortcut and current layout for shortcut, without init steps', async () => {
            store.dispatch('shortcuts/setShortcutLoading', true);

            const tmpStore = createTestStore();
            const mock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore });

            tmpStore.dispatch('configs/setConfigLoading', false);

            const { initShortcutAndLayout, shortcut } = mock;

            const result = await initShortcutAndLayout();

            expect(result).toBe(true);
            expect(tmpStore.getters['shortcuts/getCurrentShortcutId']).toBe(MOCK_SC_CITADEL_ONE_STAKE.id);
            expect(tmpStore.getters['shortcuts/getShortcutIndex']).toBe(0);
            expect(tmpStore.getters['shortcuts/getShortcutStatus'](MOCK_SC_CITADEL_ONE_STAKE.id)).toBe('PENDING');
            expect(tmpStore.getters['shortcuts/getShortcut'](MOCK_SC_CITADEL_ONE_STAKE.id)).toEqual(shortcut);
            expect(tmpStore.getters['shortcuts/getCurrentLayout']).toBe(MOCK_SC_CITADEL_ONE_STAKE.operations[0].layoutComponent);
        });
    });

    describe('performShortcut', () => {
        test('-> should perform shortcut correctly', async () => {
            const tmpStore = createTestStore();
            tmpStore.dispatch('configs/setConfigLoading', false);
            const mock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore });
            const shortcutOpMock = useShortcutOperations(MOCK_SC_CITADEL_ONE_STAKE.id, { tmpStore });

            await mock.initShortcutAndLayout();
            await shortcutOpMock.initOperationsFactory();
            await mock.initShortcutSteps();
            const result = await mock.performShortcut(true, true, 'UNIT_TEST');

            expect(result).toBe(true);
        });

        test('-> should not perform shortcut when operationsFactory is not exist', async () => {
            const tmpStore = createTestStore();
            tmpStore.dispatch('configs/setConfigLoading', false);
            const mock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore });

            await mock.initShortcutAndLayout();
            await mock.initShortcutSteps();
            const result = await mock.performShortcut(true, true, 'UNIT_TEST');

            expect(result).toBe(false);
        });
    });

    describe('initShortcutMetaInfo', () => {
        test(`-> shortcut metainfo doesn't call for shortcut ${MOCK_SC_CITADEL_ONE_STAKE.id}`, async () => {
            const { initShortcutMetaInfo } = useShortcutsMock;
            const result = await initShortcutMetaInfo();

            expect(result).toBe(false);
        });
    });
});
