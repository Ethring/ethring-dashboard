import { computed } from 'vue';

import { describe, beforeEach, vi, expect, test } from 'vitest';

import { createTestStore } from '../../mocks/store/index';
import useModuleOperations from '../../../../src/compositions/useModuleOperation';
import { ALL_CHAINS_LIST, MOCKED_ADDRESSES_BY_CHAIN, SRC_TOKEN } from '../../mocks/compositions';
import { Ecosystem } from '../../../../src/shared/models/enums/ecosystems.enum';
import { IChainConfig } from '../../../../src/shared/models/types/chain-config';
import { ModuleType } from '../../../../src/shared/models/enums/modules.enum';

describe('useModuleOperations', () => {
    let store;

    beforeEach(() => {
        store = createTestStore();
        store.dispatch('tokenOps/setSrcNetwork', ALL_CHAINS_LIST[0]);
        store.dispatch('tokenOps/setSrcToken', SRC_TOKEN);
        store.dispatch('tokenOps/setReceiverAddress', MOCKED_ADDRESSES_BY_CHAIN.eth);

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

    describe('isDisableConfirmButton', () => {
        test('-> disabled should be false, when adapter is not connected', async () => {
            const store = createTestStore(false);
            store.dispatch('tokenOps/setSrcNetwork', ALL_CHAINS_LIST[0]);

            const { isDisableConfirmButton } = useModuleOperations(ModuleType.send, { tmpStore: store });

            expect(isDisableConfirmButton.value).toBe(false);
        });

        test('-> disabled should be true, when amount is 0', async () => {
            const { isDisableConfirmButton } = useModuleOperations(ModuleType.send, { tmpStore: store });
            store.dispatch('tokenOps/setSrcAmount', '0');

            expect(isDisableConfirmButton.value).toBe(true);
        });

        test('-> disabled should be false, when amount, address are entered', async () => {
            store.dispatch('tokenOps/setSrcAmount', '0.01');
            store.dispatch('tokenOps/setReceiverAddress', MOCKED_ADDRESSES_BY_CHAIN.eth);

            const { isDisableConfirmButton } = useModuleOperations(ModuleType.send, { tmpStore: store });

            expect(isDisableConfirmButton.value).toBe(false);
        });

        test('-> disabled should be true, when amount is more than balance', async () => {
            const { isDisableConfirmButton } = useModuleOperations(ModuleType.send, { tmpStore: store });
            store.dispatch('tokenOps/setSrcAmount', '1');

            expect(isDisableConfirmButton.value).toBe(true);
        });

        test('-> disabled should be true, when receiver address is not entered', async () => {
            const { isDisableConfirmButton } = useModuleOperations(ModuleType.send, { tmpStore: store });
            store.dispatch('tokenOps/setSrcAmount', '0.01');
            store.dispatch('tokenOps/setReceiverAddress', null);

            expect(isDisableConfirmButton.value).toBe(true);
        });
    });
});
