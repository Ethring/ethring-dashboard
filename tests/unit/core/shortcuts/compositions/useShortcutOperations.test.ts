import { computed } from 'vue';

import { describe, test, beforeEach, expect, vi, Mock, beforeAll } from 'vitest';

import useShortcutOperations from '../../../../../src/core/shortcuts/compositions/useShortcutOperations';
import usePrepareFields from '../../../../../src/core/shortcuts/compositions/usePrepareFields';
import { MOCK_SC_CITADEL_ONE_STAKE } from '../../../mocks/shortcuts/index';
import { createTestStore } from '../../../mocks/store/index';
import useShortcuts from '../../../../../src/core/shortcuts/compositions/index';
import { ALL_CHAINS_LIST, CONNECTED_WALLETS, MOCKED_ADDRESSES_BY_CHAIN } from '../../../mocks/compositions';
import { Ecosystem } from '../../../../../src/shared/models/enums/ecosystems.enum';
import { MOCKED_ADAPTER } from '../../../mocks/compositions/index';
import { ModuleType } from '../../../../../src/shared/models/enums/modules.enum';
import { SHORTCUT_STATUSES } from '../../../../../src/shared/models/enums/statuses.enum';
import { delay } from '../../../../../src/shared/utils/helpers';

describe('useOperations', () => {
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
                    };
                },
            };
        });

        store.dispatch('configs/setConfigLoading', false);
    });

    describe('initOperationsFactory', () => {
        test('-> should return false if shortcutId not exist', async () => {
            const mock = useShortcutOperations('', { tmpStore: store });
            const result = await mock.initOperationsFactory();
            expect(result).toBe(false);
        });

        test('-> should return false if shortcut not exist', async () => {
            const mock = useShortcutOperations('1', { tmpStore: store });
            const result = await mock.initOperationsFactory();
            expect(result).toBe(false);
        });

        test('-> should return false if shortcut operations is empty', async () => {
            const tmpStore = createTestStore();
            const useShortcutMock = useShortcuts({ ...MOCK_SC_CITADEL_ONE_STAKE, recipe: { operations: [] } }, { tmpStore });
            const mock = useShortcutOperations(useShortcutMock.shortcutId, { tmpStore });
            const result = await mock.initOperationsFactory();
            expect(result).toBe(false);
        });

        test('-> should return true if shortcutId and shortcut exist and operation exist in shortcut', async () => {
            const result = await useOperationsMock.initOperationsFactory();
            expect(result).toBe(true);
        });
    });

    describe('handleOnTryAgain', () => {
        test('-> should set the status to PENDING and the current step to the first step when operation is not successful', async () => {
            await useShortcutsMock.initializations();

            await store.dispatch('shortcuts/setShortcutStatus', {
                shortcutId: MOCK_SC_CITADEL_ONE_STAKE.id,
                status: 'FAILED',
            });

            await store.dispatch('shortcuts/setShortcutIndex', {
                index: 0,
            });

            const { handleOnTryAgain } = useOperationsMock;
            handleOnTryAgain();

            expect(store.getters['shortcuts/getShortcutStatus'](MOCK_SC_CITADEL_ONE_STAKE.id)).toEqual('PENDING');
            expect(store.getters['shortcuts/getCurrentStepId']).toEqual(MOCK_SC_CITADEL_ONE_STAKE.recipe.operations[0].id);
        });

        test('-> should call callOnSuccess when operation is successful', async () => {
            await useShortcutsMock.initializations();
            await store.dispatch('shortcuts/setShortcutStatus', {
                shortcutId: MOCK_SC_CITADEL_ONE_STAKE.id,
                status: 'SUCCESS',
            });

            await store.dispatch('shortcuts/setShortcutIndex', {
                index: 0,
            });

            const { handleOnTryAgain } = useOperationsMock;
            handleOnTryAgain();
            const [firstOp] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            expect(store.getters['shortcuts/getShortcutStatus'](MOCK_SC_CITADEL_ONE_STAKE.id)).toEqual('PENDING');
            expect(store.getters['shortcuts/getCurrentStepId']).toEqual(firstOp.id);
            expect(store.getters['tokenOps/srcAmount']).toBe('');
            expect(store.getters['tokenOps/dstAmount']).toBe('');
        });

        test('-> should call "setCallConfirm" when operation is not successful on not first step', async () => {
            await useShortcutsMock.initializations();

            const [, secondOp] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            await store.dispatch('shortcuts/setShortcutStatus', {
                shortcutId: MOCK_SC_CITADEL_ONE_STAKE.id,
                status: 'FAILED',
            });

            await store.dispatch('shortcuts/setShortcutIndex', {
                index: 1,
            });

            await store.dispatch('shortcuts/setCurrentStepId', {
                stepId: secondOp.id,
                shortcutId: MOCK_SC_CITADEL_ONE_STAKE.id,
            });

            const { handleOnTryAgain } = useOperationsMock;

            handleOnTryAgain();

            expect(store.getters['tokenOps/isForceCallConfirm'](ModuleType.shortcut)).toBe(true);
            expect(store.getters['shortcuts/getCurrentStepId']).toEqual(secondOp.id);
        });
    });

    describe('handleOnChangeCurrentStepId', () => {
        // ***************************************************************************************************
        // * handleOnChangeCurrentStepId
        // ***************************************************************************************************

        test('-> should return false if operationsFactory is not initialized', async () => {
            const { handleOnChangeCurrentStepId } = useOperationsMock;

            const result = handleOnChangeCurrentStepId('1', '2');

            expect(result).toBe(false);
        });

        test('-> should return false if stepId equal to oldStepId', async () => {
            const { handleOnChangeCurrentStepId } = useOperationsMock;

            const result = handleOnChangeCurrentStepId('1', '1');

            expect(result).toBe(false);
        });

        test('-> should call "setOperationAccount" if stepId not equal to oldStepId and operationsFactory is initialized', async () => {
            await useShortcutsMock.initializations();
            const { handleOnChangeCurrentStepId } = useOperationsMock;

            const result = handleOnChangeCurrentStepId('1', '2');

            expect(result).toBe(true);
        });
    });

    describe('handleOnChangeAddressByChain', () => {
        test('-> should return false if addresses equal to oldAddresses', async () => {
            const { handleOnChangeAddressByChain } = useOperationsMock;

            const result = await handleOnChangeAddressByChain(MOCKED_ADDRESSES_BY_CHAIN, MOCKED_ADDRESSES_BY_CHAIN);

            expect(result).toBe(false);
        });

        test('-> should return false if operationsFactory is not initialized', async () => {
            const { handleOnChangeAddressByChain } = useOperationsMock;

            const result = await handleOnChangeAddressByChain(MOCKED_ADDRESSES_BY_CHAIN, {});

            expect(result).toBe(false);
        });

        test('-> should return false if opIds is empty', async () => {
            const { handleOnChangeAddressByChain } = useOperationsMock;

            const result = await handleOnChangeAddressByChain(MOCKED_ADDRESSES_BY_CHAIN, {});

            expect(result).toBe(false);
        });

        test('-> should call "setOperationAccount" if addresses not equal to oldAddresses and operations factory is initialized', async () => {
            await useShortcutsMock.initializations();
            const { handleOnChangeAddressByChain, opIds, operationsFactory } = useOperationsMock;

            const result = await handleOnChangeAddressByChain(MOCKED_ADDRESSES_BY_CHAIN, {});

            expect(result).toBe(true);

            for (const opId of opIds.value) {
                const operation = operationsFactory.value.getOperationById(opId);
                expect(operation.getParamByField('ownerAddresses')).toEqual(MOCKED_ADDRESSES_BY_CHAIN);
            }
        });
    });

    describe('setOperationAccount', () => {
        test('-> should set the account to the operation if account not exist', async () => {
            await useShortcutsMock.initializations();
            const { setOperationAccount, operationsFactory } = useOperationsMock;

            const [firstOp] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            const options = {
                force: false,
            };

            const operation = operationsFactory.value.getOperationById(firstOp.id);

            operation.setAccount(null);

            const result = setOperationAccount(firstOp.id, options);

            expect(result).toBe(true);
        });

        test('-> should set the account to the operation if account exist and force is true', async () => {
            await useShortcutsMock.initializations();
            const { setOperationAccount, operationsFactory } = useOperationsMock;

            const [firstOp] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            const options = {
                force: true,
            };

            const result = setOperationAccount(firstOp.id, options);

            expect(result).toBe(true);
        });

        test('-> should return false if operation not exist', async () => {
            await useShortcutsMock.initializations();
            const { setOperationAccount } = useOperationsMock;

            const options = {
                force: false,
            };

            const result = setOperationAccount('1', options);

            expect(result).toBe(false);
        });

        test('-> should return false if account exist equal to account from store and "force" is false', async () => {
            await useShortcutsMock.initializations();
            const { setOperationAccount } = useOperationsMock;
            await delay(1000);

            const [firstOp] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            const options = {
                force: false,
            };

            const result = setOperationAccount(firstOp.id, options);

            expect(result).toBe(false);
        });

        test('-> should return false if account not found for chain', async () => {
            await useShortcutsMock.initializations();
            const { setOperationAccount, operationsFactory } = useOperationsMock;

            const [firstOp] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            const options = {
                force: false,
            };

            const operation = operationsFactory.value.getOperationById(firstOp.id);

            operation.setParamByField('net', 'test');
            operation.setParamByField('fromNet', 'test');

            const result = setOperationAccount(firstOp.id, options);

            expect(result).toBe(false);
        });

        test('-> should return false and not set account to the operation if account not found for chain and "force" is true', async () => {
            await useShortcutsMock.initializations();
            const { setOperationAccount, operationsFactory } = useOperationsMock;

            const [firstOp] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            const options = {
                force: true,
            };

            const operation = operationsFactory.value.getOperationById(firstOp.id);

            operation.setParamByField('net', 'test');
            operation.setParamByField('fromNet', 'test');

            const result = setOperationAccount(firstOp.id, options);

            expect(result).toBe(false);
        });
    });

    describe('handleOnChangeShortcutIndex', () => {
        test('-> should return false if index equal to oldIndex', async () => {
            const result = await useOperationsMock.handleOnChangeShortcutIndex(0, 0);
            expect(result).toBe(false);
        });

        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.handleOnChangeShortcutIndex(0, 1);
            expect(result).toBe(false);
        });

        test('-> should call "updateProgress" if index not equal to oldIndex and operationsFactory is initialized', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnChangeShortcutIndex(0, 1);
            expect(result).toBe(true);
        });
    });

    describe('handleOnChangeOperationStatus', () => {
        test('-> should return false if status equal to oldStatus', async () => {
            const result = await useOperationsMock.handleOnChangeOperationStatus(SHORTCUT_STATUSES.PENDING, SHORTCUT_STATUSES.PENDING);
            expect(result).toBe(false);
        });

        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.handleOnChangeOperationStatus(SHORTCUT_STATUSES.PENDING, SHORTCUT_STATUSES.SUCCESS);
            expect(result).toBe(false);
        });

        test('-> should call "updateProgress" if status not equal to oldStatus and operationsFactory is initialized', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnChangeOperationStatus(SHORTCUT_STATUSES.PENDING, SHORTCUT_STATUSES.SUCCESS);
            expect(result).toBe(true);
        });
    });

    describe('updateProgress', () => {
        test('-> should return 0 if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.updateProgress();
            expect(result).toBe(0);
        });

        test('-> should call "getPercentageOfSuccessOperations" if operationsFactory is initialized', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.updateProgress();
            expect(result).toBeGreaterThanOrEqual(0);
        });
    });

    describe('updateAmountAndEstimate', () => {
        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.updateAmountAndEstimate();
            expect(result).toBe(false);
        });

        test('-> should set new "outputAmount" for currentOp if "isEstimate" false and operationsFactory is initialized', async () => {
            const amount = 11,
                oldAmount = 12;

            const isEstimate = false;

            await useShortcutsMock.initializations();
            const { operationsFactory, currentOp, updateAmountAndEstimate } = useOperationsMock;
            const result = await updateAmountAndEstimate(amount, oldAmount, isEstimate);

            const operation = operationsFactory.value.getOperationById(currentOp.value.id);

            expect(result).toBe(true);
            expect(operation.getParamByField('outputAmount')).toEqual(amount);
        });

        test('-> should set new "amount" for currentOp if "isEstimate" true with calling "handleOnCallEstimateOutput"', async () => {
            const amount = 15,
                oldAmount = 11;

            const isEstimate = true;

            await useShortcutsMock.initializations();
            const { operationsFactory, currentOp, updateAmountAndEstimate } = useOperationsMock;
            const result = await updateAmountAndEstimate(amount, oldAmount, isEstimate);

            const operation = operationsFactory.value.getOperationById(currentOp.value.id);

            expect(result).toBe(true);
            expect(operation.getParamByField('amount')).toEqual(amount);
        });

        test('-> should return false if isConfigLoading true', async () => {
            store.dispatch('configs/setConfigLoading', true);

            const amount = 15,
                oldAmount = 11;

            const isEstimate = true;

            await useShortcutsMock.initializations();

            const { updateAmountAndEstimate } = useOperationsMock;
            const result = await updateAmountAndEstimate(amount, oldAmount, isEstimate);

            expect(result).toBe(false);
        });

        test('-> should return false if amount is not valid (STRING)', async () => {
            const amount = 'test',
                oldAmount = 11;

            const isEstimate = true;

            await useShortcutsMock.initializations();

            const { updateAmountAndEstimate } = useOperationsMock;
            const result = await updateAmountAndEstimate(amount, oldAmount, isEstimate);

            expect(result).toBe(false);
        });

        test('-> should return false if amount is not valid (EMPTY_STRING)', async () => {
            const amount = '',
                oldAmount = 11;

            const isEstimate = true;

            await useShortcutsMock.initializations();

            const { updateAmountAndEstimate } = useOperationsMock;
            const result = await updateAmountAndEstimate(amount, oldAmount, isEstimate);

            expect(result).toBe(false);
        });

        test('-> should return false if amount is not valid (NULL)', async () => {
            const amount = null,
                oldAmount = 11;

            const isEstimate = true;

            await useShortcutsMock.initializations();

            const { updateAmountAndEstimate } = useOperationsMock;
            const result = await updateAmountAndEstimate(amount, oldAmount, isEstimate);

            expect(result).toBe(false);
        });

        test('-> should return false if amount is not valid (UNDEFINED)', async () => {
            const amount = undefined,
                oldAmount = 11;

            const isEstimate = true;

            await useShortcutsMock.initializations();

            const { updateAmountAndEstimate } = useOperationsMock;
            const result = await updateAmountAndEstimate(amount, oldAmount, isEstimate);

            expect(result).toBe(false);
        });
    });

    describe('handleOnUpdateOperationParamsAndEstimate', () => {
        const srcNetwork = {
            net: 'srcTestNetwork',
        };

        const dstNetwork = {
            net: 'dstTestNetwork',
        };

        const srcToken = {
            id: 'srcTestToken',
        };

        const dstToken = {
            id: 'dstTestToken',
        };

        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.handleOnUpdateOperationParamsAndEstimate([], []);
            expect(result).toBe(false);
        });

        test('-> should return false if isConfigLoading is true', async () => {
            store.dispatch('configs/setConfigLoading', true);
            const result = await useOperationsMock.handleOnUpdateOperationParamsAndEstimate([], []);
            expect(result).toBe(false);
        });

        test('-> should return false params are equal to oldParams', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnUpdateOperationParamsAndEstimate([], []);
            expect(result).toBe(false);
        });

        test('-> should return false params are equal to oldParams and operationsFactory is initialized', async () => {
            const oldParams = [srcNetwork, srcToken, dstNetwork, dstToken];

            await useShortcutsMock.initializations();

            const result = await useOperationsMock.handleOnUpdateOperationParamsAndEstimate(
                [srcNetwork, srcToken, dstNetwork, dstToken],
                oldParams,
            );

            expect(result).toBe(false);
        });

        test('-> should call "handleOnCallEstimateOutput" if src network and token are changed and operationsFactory is initialized', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnUpdateOperationParamsAndEstimate(
                [srcNetwork, srcToken, dstNetwork, dstToken],
                [],
            );

            expect(result).toBe(true);
        });
    });

    describe('updateContractParams', () => {
        const address = 'testAddress';
        const callCount = 1;
        const oldAddress = 'oldTestAddress';
        const oldCallCount = 2;

        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.updateContractParams();
            expect(result).toBe(false);
        });

        test('-> should return false if params are equal to oldParams', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.updateContractParams(address, callCount, address, callCount);
            expect(result).toBe(false);
        });

        test('-> should set new params if params are changed and operationsFactory is initialized', async () => {
            await useShortcutsMock.initializations();
            const { updateContractParams, currentOp, operationsFactory } = useOperationsMock;
            const result = await updateContractParams(address, callCount, oldAddress, oldCallCount);
            const operation = operationsFactory.value.getOperationById(currentOp.value.id);

            expect(result).toBe(true);

            expect(operation.getParamByField('contract')).toEqual(address);
            expect(operation.getParamByField('count')).toEqual(callCount);
        });
    });

    describe('handleOnUpdateOperationParams', () => {
        const srcNetwork = {
            net: 'srcTestNetwork',
        };

        const dstNetwork = {
            net: 'dstTestNetwork',
        };

        const srcToken = {
            id: 'srcTestToken',
            balance: 1,
        };

        const dstToken = {
            id: 'dstTestToken',
            balance: 1,
        };

        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.handleOnUpdateOperationParams([], []);
            expect(result).toBe(false);
        });

        test('-> should return false if isConfigLoading is true', async () => {
            store.dispatch('configs/setConfigLoading', true);
            const result = await useOperationsMock.handleOnUpdateOperationParams([], []);
            expect(result).toBe(false);
        });

        test('-> should return false params are equal to oldParams', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnUpdateOperationParams([], []);
            expect(result).toBe(false);
        });

        test('-> should return false params are equal to oldParams and operationsFactory is initialized', async () => {
            const oldParams = [srcNetwork, srcToken, dstNetwork, dstToken];

            await useShortcutsMock.initializations();

            const result = await useOperationsMock.handleOnUpdateOperationParams([srcNetwork, srcToken, dstNetwork, dstToken], oldParams);

            expect(result).toBe(false);
        });

        test('-> should  return true and set params if params are changed and operationsFactory is initialized', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnUpdateOperationParams([srcNetwork, srcToken, dstNetwork, dstToken], []);
            expect(result).toBe(true);
        });

        test('-> should return true if src or dst token balance is changed', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnUpdateOperationParams(
                [srcNetwork, srcToken, dstNetwork, dstToken],
                [srcNetwork, { ...srcToken, balance: 0 }, dstNetwork, { ...dstToken, balance: 0 }],
            );
            expect(result).toBe(true);
        });
    });

    describe('checkMinAmount', () => {
        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = useOperationsMock.checkMinAmount();
            expect(result).toBe(false);
        });

        test('-> should return false if amount is 0', async () => {
            await useShortcutsMock.initializations();
            const result = useOperationsMock.checkMinAmount();
            expect(result).toBe(false);
        });

        const CASES = [0, null, undefined, 'some-string'];
        for (const testCase of CASES)
            test(`-> should return true if current minUsdAmount is equal to "${testCase}"`, async () => {
                await useShortcutsMock.initializations();

                const mockedShortcut = { ...MOCK_SC_CITADEL_ONE_STAKE, minUsdAmount: testCase };

                await store.dispatch('shortcuts/setShortcut', {
                    shortcut: mockedShortcut.id,
                    data: mockedShortcut,
                });

                const result = useOperationsMock.checkMinAmount();

                expect(result).toBe(true);
            });
    });

    describe('handleOnChangeIsCallEstimateOutput', () => {
        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.handleOnChangeIsCallEstimateOutput();
            expect(result).toBe(false);
        });

        test('-> should return false if isCallEstimateOutput equal to oldIsCallEstimateOutput', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnChangeIsCallEstimateOutput(true, true);
            expect(result).toBe(false);
        });

        test('-> should return false if isCallEstimateOutput equal to false', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnChangeIsCallEstimateOutput(false, true);
            expect(result).toBe(false);
        });

        test('-> should return true if isCallEstimateOutput not equal to oldIsCallEstimateOutput and operationsFactory is initialized', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.handleOnChangeIsCallEstimateOutput(true, false);
            expect(result).toBe(true);
        });
    });

    describe('processShortcutOperation', () => {
        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.processShortcutOperation(null);
            expect(result).toBe(false);
        });

        test('-> should return false if Operation is empty', async () => {
            await useShortcutsMock.initializations();
            const result = await useOperationsMock.processShortcutOperation(null);
            expect(result).toBe(false);
        });

        test('-> should return true if operationsFactory is initialized', async () => {
            const tmpStore = createTestStore();
            const mockShortcut = useShortcuts(MOCK_SC_CITADEL_ONE_STAKE, { tmpStore });
            const mockOperations = useShortcutOperations(MOCK_SC_CITADEL_ONE_STAKE.id, { tmpStore });

            await tmpStore.dispatch('configs/setConfigLoading', false);
            await mockShortcut.initShortcutAndLayout();
            await mockOperations.initOperationsFactory();
            await mockShortcut.initShortcutSteps();

            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const result = await mockOperations.processShortcutOperation(operation);

            expect(result).toBe(true);
        });
    });

    describe('handleOnCallEstimateOutput', () => {
        test('-> should return false if operationsFactory is not initialized', async () => {
            const result = await useOperationsMock.handleOnCallEstimateOutput();
            expect(result).toBe(false);
        });

        test('-> should return false if isConfigLoading is true', async () => {
            await useShortcutsMock.initializations();
            await store.dispatch('configs/setConfigLoading', true);
            const result = await useOperationsMock.handleOnCallEstimateOutput();
            expect(result).toBe(false);
        });

        test('-> should return false if isTransactionSigning is true', async () => {
            await useShortcutsMock.initializations();
            await store.dispatch('txManager/setTransactionSigning', true);
            const result = await useOperationsMock.handleOnCallEstimateOutput();
            expect(result).toBe(false);
        });

        test('-> should return false if isShortcutLoading is true', async () => {
            await useShortcutsMock.initializations();
            await store.dispatch('shortcuts/setIsShortcutLoading', {
                shortcutId: MOCK_SC_CITADEL_ONE_STAKE.id,
                value: true,
            });
            const result = await useOperationsMock.handleOnCallEstimateOutput();
            expect(result).toBe(false);
        });

        test('-> should return false if isQuoteLoading is true', async () => {
            await useShortcutsMock.initializations();
            await store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'quote', value: true });
            const result = await useOperationsMock.handleOnCallEstimateOutput();
            expect(result).toBe(false);
        });

        const CASES = [0, null, undefined, 'some-string'];
        for (const testCase of CASES)
            test(`-> should return false if amount is ${testCase}`, async () => {
                await useShortcutsMock.initializations();
                await store.dispatch('configs/setConfigLoading', false);
                await store.dispatch('txManager/setTransactionSigning', false);
                await store.dispatch('shortcuts/setIsShortcutLoading', {
                    shortcutId: MOCK_SC_CITADEL_ONE_STAKE.id,
                    value: false,
                });
                await store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'quote', value: false });
                await store.dispatch('tokenOps/setSrcAmount', testCase);
                const result = await useOperationsMock.handleOnCallEstimateOutput();
                expect(result).toBe(false);
            });
    });
});
