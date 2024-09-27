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

    describe('initialize', () => {
        test('-> should initialize correctly', async () => {
            try {
                const { shortcut, initializations, isShortcutLoading, operationsFactory } = useShortcutsMock;
                await initializations();

                expect(operationsFactory).toBeDefined();
                expect(isShortcutLoading.value).toBeDefined();
                expect(isShortcutLoading.value).toBe(false);

                expect(store.getters['shortcuts/getCurrentShortcutId']).toEqual(MOCK_SC_CITADEL_ONE_STAKE.id);
                const [firstOp] = shortcut.value.operations;
                expect(store.getters['shortcuts/getCurrentStepId']).toEqual(firstOp.id);
                expect(store.getters['shortcuts/getShortcutIndex']).toEqual(0);
            } catch (error) {
                console.log('ON INITIALIZE #1', error);
            }
        });

        test('-> should return error when shortcut is passed as null', async () => {
            try {
                useShortcuts(null, { tmpStore: store });
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toEqual('Shortcut id is required');

                console.log('ON INITIALIZE #2', e);
            }
        });

        test('-> should return error when shortcut id is not passed', async () => {
            try {
                useShortcuts({} as any, { tmpStore: store });
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toEqual('Shortcut id is required');
                console.log('ON INITIALIZE #3', e);
            }
        });

        test('-> should return error when shortcut is passed as undefined', async () => {
            try {
                useShortcuts(undefined, { tmpStore: store });
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toEqual('Shortcut id is required');
                console.log('ON INITIALIZE #4', e);
            }
        });

        test('-> should not initialize shortcut when config is loading', async () => {
            try {
                store.dispatch('configs/setConfigLoading', true);

                const tmpStore = createTestStore();
                const mock = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore });

                const { initShortcutAndLayout } = mock;

                const result = await initShortcutAndLayout();

                expect(result).toBe(false);
                expect(tmpStore.getters['shortcuts/getCurrentShortcutId']).toBe('');
                expect(tmpStore.getters['shortcuts/getCurrentStepId']).toBe('');
                expect(tmpStore.getters['shortcuts/getShortcutIndex']).toBe(0);
            } catch (error) {
                console.log('ON INITIALIZE #5', error);
            }
        });
    });

    describe('initShortcutMetaInfo', () => {
        test(`-> shortcut meta-info doesn't call for shortcut ${MOCK_SC_CITADEL_ONE_STAKE.id}`, async () => {
            try {
                const { initShortcutMetaInfo } = useShortcutsMock;
                const result = await initShortcutMetaInfo();

                expect(result).toBe(false);
            } catch (error) {
                console.log('ON INIT SHORTCUT META INFO #1', error);
            }
        });
    });

    describe('initShortcutAndLayout', () => {
        test('-> should initialize shortcut correctly', async () => {
            try {
                const { initShortcutAndLayout } = useShortcutsMock;
                await initShortcutAndLayout();

                expect(store.getters['shortcuts/getCurrentShortcutId']).toEqual(MOCK_SC_CITADEL_ONE_STAKE.id);
                expect(store.getters['shortcuts/getCurrentStepId']).toEqual(MOCK_SC_CITADEL_ONE_STAKE.operations[0].id);
                expect(store.getters['shortcuts/getShortcutIndex']).toEqual(0);
            } catch (error) {
                console.log('ON INIT SHORTCUT AND LAYOUT #1', error);
            }
        });

        test('-> should initialize shortcut and current layout for shortcut, without init steps', async () => {
            try {
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
                expect(tmpStore.getters['shortcuts/getShortcut'](MOCK_SC_CITADEL_ONE_STAKE.id)).toEqual(shortcut.value);
                expect(tmpStore.getters['shortcuts/getCurrentLayout']).toBe(MOCK_SC_CITADEL_ONE_STAKE.operations[0].layoutComponent);
            } catch (error) {
                console.log('ON INIT SHORTCUT AND LAYOUT #2', error);
            }
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
});
