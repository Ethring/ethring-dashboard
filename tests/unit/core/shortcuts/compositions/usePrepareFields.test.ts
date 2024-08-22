import { computed } from 'vue';

import { describe, test, beforeEach, expect, vi, Mock, beforeAll } from 'vitest';

import useShortcutOperations from '../../../../../src/core/shortcuts/compositions/useShortcutOperations';
import usePrepareFields from '../../../../../src/core/shortcuts/compositions/usePrepareFields';
import { MOCK_SC_CITADEL_ONE_STAKE } from '../../../mocks/shortcuts/index';
import { createTestStore } from '../../../mocks/store/index';
import useShortcuts from '../../../../../src/core/shortcuts/compositions/index';
import { ALL_CHAINS_LIST } from '../../../mocks/compositions';
import { Ecosystem } from '../../../../../src/shared/models/enums/ecosystems.enum';
import { ModuleType } from '../../../../../src/shared/models/enums/modules.enum';
import { IChainConfig } from '../../../../../src/shared/models/types/chain-config';
import { ShortcutFieldOpAssociated, TokenDestinationByField } from '../../../../../src/core/shortcuts/core/types/ShortcutType';
import { delay } from '../../../../../src/shared/utils/helpers';

describe('usePrepareFields', () => {
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

    describe('prepareDisabledField', () => {
        test('-> should return false if "operationId" not provided', async () => {
            const { prepareDisabledField } = usePrepareFieldsMock;
            const result = await prepareDisabledField(null, ModuleType.superSwap, 'srcNetwork', false);
            expect(result).toBe(false);
        });

        test('-> should return false if "srcNetwork" not provided', async () => {
            const { prepareDisabledField } = usePrepareFieldsMock;
            const result = await prepareDisabledField('operationId', ModuleType.superSwap, null, true);
            expect(result).toBe(false);
        });

        test('-> should return true and set "disabled" to true for "srcNetwork"', async () => {
            const { prepareDisabledField } = usePrepareFieldsMock;
            const result = await prepareDisabledField('operationId', ModuleType.superSwap, 'srcNetwork', true);
            expect(result).toBe(true);
            expect(store.getters['moduleStates/getFieldsForModule'](ModuleType.superSwap).srcNetwork.disabled).toBe(true);
        });

        test('-> should return true and set "disabled" to false for "srcNetwork"', async () => {
            const { prepareDisabledField } = usePrepareFieldsMock;
            const result = await prepareDisabledField('operationId', ModuleType.superSwap, 'srcNetwork', false);
            expect(result).toBe(true);
            expect(store.getters['moduleStates/getFieldsForModule'](ModuleType.superSwap).srcNetwork.disabled).toBe(false);
        });
    });

    describe('prepareHiddenField', () => {
        test('-> should return false if "operationId" not provided', async () => {
            const { prepareHiddenField } = usePrepareFieldsMock;
            const result = await prepareHiddenField(null, ModuleType.superSwap, 'srcNetwork', false);
            expect(result).toBe(false);
        });

        test('-> should return false if "srcNetwork" not provided', async () => {
            const { prepareHiddenField } = usePrepareFieldsMock;
            const result = await prepareHiddenField('operationId', ModuleType.superSwap, null, true);
            expect(result).toBe(false);
        });

        test('-> should return true and set "hide" to true for "srcNetwork"', async () => {
            const { prepareHiddenField } = usePrepareFieldsMock;
            const result = await prepareHiddenField('operationId', ModuleType.superSwap, 'srcNetwork', true);
            expect(result).toBe(true);
            expect(store.getters['moduleStates/getFieldsForModule'](ModuleType.superSwap).srcNetwork.hide).toBe(true);
        });

        test('-> should return true and set "hide" to false for "srcNetwork"', async () => {
            const { prepareHiddenField } = usePrepareFieldsMock;
            const result = await prepareHiddenField('operationId', ModuleType.superSwap, 'srcNetwork', false);
            expect(result).toBe(true);
            expect(store.getters['moduleStates/getFieldsForModule'](ModuleType.superSwap).srcNetwork.hide).toBe(false);
        });
    });

    describe('performFields', () => {
        test('-> should return false if "params" is empty', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            const options = {
                isUpdateInStore: true,
                id: operation.id,
                from: 'UNIT_TEST',
            };

            const result = await usePrepareFieldsMock.performFields(ModuleType.superSwap, [], options);
            expect(result).toBe(false);
        });

        test('-> should return false if "isTransactionSigning" is true', async () => {
            await store.dispatch('txManager/setTransactionSigning', true);
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            const options = {
                isUpdateInStore: true,
                id: operation.id,
                from: 'UNIT_TEST',
            };

            const result = await usePrepareFieldsMock.performFields(ModuleType.superSwap, operation.params, options);
            expect(result).toBe(false);
        });

        test('-> should return true if everything is OK', async () => {
            await store.dispatch('txManager/setTransactionSigning', false);
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;

            const options = {
                isUpdateInStore: true,
                id: operation.id,
                from: 'UNIT_TEST',
            };

            const result = await usePrepareFieldsMock.performFields(ModuleType.superSwap, operation.params, options);
            expect(result).toBe(true);
        });
    });

    describe('prepareValueByField', () => {
        test('-> should return false if operationsFactory is not initialized', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const [parameter] = operation.params || [];

            const options = {
                isUpdateInStore: true,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(operation.id, parameter.name, parameter, options);

            expect(result).toBe(false);
        });

        test('-> should return false if "operationId" is not provided', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const [parameter] = operation.params || [];

            const options = {
                isUpdateInStore: true,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(null, parameter.name, parameter, options);

            expect(result).toBe(false);
        });

        test('-> should return false if "fieldName" is not provided', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const [parameter] = operation.params || [];

            const options = {
                isUpdateInStore: true,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(operation.id, null, parameter, options);

            expect(result).toBe(false);
        });

        test('-> should return false if "params" is not provided', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const [parameter] = operation.params || [];

            const options = {
                isUpdateInStore: true,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(operation.id, parameter.name, null, options);

            expect(result).toBe(false);
        });

        test('-> should return true if operationsFactory initialized and everything is OK', async () => {
            await useShortcutsMock.initializations();
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const [parameter] = operation.params || [];

            const options = {
                isUpdateInStore: true,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(operation.id, parameter.name, parameter, options);

            expect(result).toBe(true);
            const { operationsFactory } = useOperationsMock;

            const operationById = operationsFactory.value.getOperationById(operation.id);

            expect(operationById.getEcosystem()).toBe(parameter.ecosystem);
            expect(operationById.getChainId()).toBe(`${parameter.chainId}`);
        });

        test('-> should return true without updating field value in Store and in Operation', async () => {
            await useShortcutsMock.initializations();
            await delay(1000);
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const parameter = {
                name: 'srcToken',
                disabled: false,
                hide: false,
                chain: 'eth',
                address: null,
                id: 'eth:tokens__native:ETH',
            };

            const options = {
                isUpdateInStore: false,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(operation.id, parameter.name, parameter, options);
            expect(result).toBe(true);

            const { operationsFactory } = useOperationsMock;

            const operationById = operationsFactory.value.getOperationById(operation.id);

            const token = store.getters[`tokenOps/${parameter.name}`];

            if (token) expect(token.id).not.toBe(parameter.id);

            expect(operationById.getToken(TokenDestinationByField[parameter.name]).id).not.toBe(parameter.id);
            expect(operationById.getToken(TokenDestinationByField[parameter.name]).chain).not.toBe(parameter.chain);
        });
    });

    describe('prepareValueByField with each CASE', () => {
        const OPERATION_ID = 'bridge-eth-to-osmo';

        const OPERATION_FIELD_SRC_NETWORK = {
            name: 'srcNetwork',
            hide: false,
            disabled: false,
            ecosystem: 'EVM',
            chainId: 56,
        };

        const OPERATION_FIELD_PRE_SET = {
            name: 'srcToken',
            disabled: false,
            hide: false,
            value: {
                id: 'base:pools__0xedc817a28e8b93b03976fbd4a3ddbc9f7d176c22:musdc',
                chain: 'base',
                ecosystem: 'EVM',
                symbol: 'mUSDC',
                address: '0xedc817a28e8b93b03976fbd4a3ddbc9f7d176c22',
                name: 'mUSDC',
                decimals: 18,
                standard: 'erc20',
                logo: 'https://app.portals.fi/_next/image?url=https%3A%2F%2Fassets.coingecko.com%2Fcoins%2Fimages%2F26133%2Fsmall%2FWELL.png&w=3840&q=75',
                balance: 0,
                balanceUsd: 0,
                amount: null,
            },
        };

        const OPERATION_FIELD_DST_TOKEN = {
            name: 'dstToken',
            disabled: true,
            hide: false,
            id: 'osmosis:tokens__native:OSMO',
            chain: 'osmosis',
            address: 'uosmo',
        };

        test('-> PRE_SET_VALUE: -> should return true and tokenOps field value to PRE_SET_VALUE', async () => {
            await useShortcutsMock.initializations();
            const { operationsFactory } = useOperationsMock;

            const options = {
                isUpdateInStore: true,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(
                OPERATION_ID,
                OPERATION_FIELD_PRE_SET.name,
                OPERATION_FIELD_PRE_SET,
                options,
            );

            const operation = operationsFactory.value.getOperationById(OPERATION_ID);

            expect(result).toBe(true);
            expect(store.getters[`tokenOps/${OPERATION_FIELD_PRE_SET.name}`]).toEqual(OPERATION_FIELD_PRE_SET.value);
            expect(operation.getToken(TokenDestinationByField[OPERATION_FIELD_PRE_SET.name])).toEqual(OPERATION_FIELD_PRE_SET.value);
        });

        test('-> NETWORK -> should return true for srcNetwork, params must have chainId and ecosystem', async () => {
            await useShortcutsMock.initializations();
            const { operationsFactory } = useOperationsMock;

            const options = {
                isUpdateInStore: true,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(
                OPERATION_ID,
                OPERATION_FIELD_SRC_NETWORK.name,
                OPERATION_FIELD_SRC_NETWORK,
                options,
            );

            expect(result).toBe(true);
            const srcNetwork = store.getters['tokenOps/srcNetwork'];
            const chain = `${srcNetwork.chain_id}` || srcNetwork.chain;

            expect(srcNetwork).toBeDefined();
            expect(srcNetwork.ecosystem).toBe(OPERATION_FIELD_SRC_NETWORK.ecosystem);
            expect(chain).toBe(`${OPERATION_FIELD_SRC_NETWORK.chainId}`);

            const operation = operationsFactory.value.getOperationById(OPERATION_ID);
            expect(operation.getChainId()).toBe(`${OPERATION_FIELD_SRC_NETWORK.chainId}`);
            expect(operation.getEcosystem()).toBe(OPERATION_FIELD_SRC_NETWORK.ecosystem);
            expect(operation.getParamByField(ShortcutFieldOpAssociated[OPERATION_FIELD_SRC_NETWORK.name])).toEqual(srcNetwork.net);
        });

        test('-> TOKEN -> should return true for dstToken, params must have id, chain and address', async () => {
            await useShortcutsMock.initializations();
            const { operationsFactory } = useOperationsMock;

            const options = {
                isUpdateInStore: true,
            };

            const result = await usePrepareFieldsMock.prepareValueByField(
                OPERATION_ID,
                OPERATION_FIELD_DST_TOKEN.name,
                OPERATION_FIELD_DST_TOKEN,
                options,
            );

            expect(result).toBe(true);

            const dstToken = store.getters['tokenOps/dstToken'];

            expect(dstToken).toBeDefined();
            expect(dstToken.id).toBe(OPERATION_FIELD_DST_TOKEN.id);
            expect(dstToken.chain).toBe(OPERATION_FIELD_DST_TOKEN.chain);
            expect(dstToken.address).toBe(OPERATION_FIELD_DST_TOKEN.address);

            const operation = operationsFactory.value.getOperationById(OPERATION_ID);
            expect(operation.getToken(TokenDestinationByField[OPERATION_FIELD_DST_TOKEN.name])).toEqual(dstToken);
        });
    });

    describe('performDisabledOrHiddenFields', () => {
        test('-> should return false if "operationId" is not provided', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const result = await usePrepareFieldsMock.performDisabledOrHiddenFields(null, operation.moduleType, operation.params);
            expect(result).toBe(false);
        });

        test('-> should return false if "moduleType" is not provided', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const result = await usePrepareFieldsMock.performDisabledOrHiddenFields(operation.id, null, operation.params);
            expect(result).toBe(false);
        });

        test('-> should return false if "fields" is not provided', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const result = await usePrepareFieldsMock.performDisabledOrHiddenFields(operation.id, operation.moduleType, []);
            expect(result).toBe(false);
        });

        test('-> should return false if operation is not initialized', async () => {
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const result = await usePrepareFieldsMock.performDisabledOrHiddenFields(operation.id, operation.moduleType, operation.params);
            expect(result).toBe(false);
        });

        test('-> should return false current operation is not equal to operationId', async () => {
            await useShortcutsMock.initializations();
            const { currentOp } = useShortcutsMock;
            const [, operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const result = await usePrepareFieldsMock.performDisabledOrHiddenFields(operation.id, operation.moduleType, operation.params);
            expect(result).toBe(false);
            expect(currentOp.value.id).not.toEqual(operation.id);
        });

        test('-> should return true if everything is OK', async () => {
            await useShortcutsMock.initializations();
            const [operation] = MOCK_SC_CITADEL_ONE_STAKE.recipe.operations;
            const result = await usePrepareFieldsMock.performDisabledOrHiddenFields(operation.id, operation.moduleType, operation.params);
            expect(result).toBe(true);
        });
    });

    describe('callPerformOnWatchOnMounted', () => {
        test('-> should return false if operations not initialized', async () => {
            const result = await usePrepareFieldsMock.callPerformOnWatchOnMounted();
            expect(result).toBe(false);
        });

        test('-> should return true if everything is OK', async () => {
            await useShortcutsMock.initializations();
            const result = await usePrepareFieldsMock.callPerformOnWatchOnMounted();
            expect(result).toBe(true);
        });
    });
});
