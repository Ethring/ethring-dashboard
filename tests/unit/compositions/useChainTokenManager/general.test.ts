import { describe, test, expect, vi, beforeAll, beforeEach } from 'vitest';
import { createStore, Store } from 'vuex';

import { ModuleType, LIKE_SUPER_SWAP, IS_NEED_DST_NETWORK } from '../../../../src/shared/models/enums/modules.enum';

import useChainTokenManager from '../../../../src/compositions/useChainTokenManager';

import { createTestStore } from '../../mocks/store';

describe('useChainTokenManager', () => {
    let store: any;

    beforeEach(() => {
        vi.resetAllMocks();
        store = createTestStore();
    });

    describe('isSuperSwap', () => {
        for (const module of Object.values(ModuleType))
            test(`-> for: ${module} must be ${LIKE_SUPER_SWAP.includes(module)}`, async () => {
                const { isSuperSwap } = useChainTokenManager(module, { tmpStore: store });
                if (LIKE_SUPER_SWAP.includes(module)) expect(isSuperSwap.value).toBe(true);
                else expect(isSuperSwap.value).toBe(false);
            });
    });

    describe('isNeedDstNetwork', () => {
        for (const module of Object.values(ModuleType))
            test(`-> for: ${module} must be ${IS_NEED_DST_NETWORK.includes(module)}`, async () => {
                const { isNeedDstNetwork } = useChainTokenManager(module, { tmpStore: store });
                if (IS_NEED_DST_NETWORK.includes(module)) expect(isNeedDstNetwork.value).toBe(true);
                else expect(isNeedDstNetwork.value).toBe(false);
            });
    });

    describe('onChangeLoadingConfig: SEND', () => {
        test('-> to haveBeen Called with TRUE', async () => {
            const chainTokenManager = useChainTokenManager(ModuleType.send, { tmpStore: store });

            const onChangeLoadingConfigMock = vi.spyOn(chainTokenManager, 'onChangeLoadingConfig');
            const defaultChainMangerByModuleMock = vi.spyOn(chainTokenManager, 'defaultChainMangerByModule');

            await store.dispatch('configs/setConfigLoading', true);
            expect(store.getters['configs/isConfigLoading']).toBe(true);

            chainTokenManager.onChangeLoadingConfig(store.getters['configs/isConfigLoading']);

            expect(onChangeLoadingConfigMock).toHaveBeenCalled();
            expect(onChangeLoadingConfigMock).toHaveBeenCalledWith(true);
            expect(defaultChainMangerByModuleMock).not.toHaveBeenCalled();
        });

        test('-> haveBeen Called with FALSE', async () => {
            const chainTokenManager = useChainTokenManager(ModuleType.send, { tmpStore: store });
            const onChangeLoadingConfigMock = vi.spyOn(chainTokenManager, 'onChangeLoadingConfig');

            await store.dispatch('configs/setConfigLoading', false);

            expect(store.getters['configs/isConfigLoading']).toBe(false);

            chainTokenManager.onChangeLoadingConfig(store.getters['configs/isConfigLoading']);

            expect(onChangeLoadingConfigMock).toHaveBeenCalled();
            expect(onChangeLoadingConfigMock).toHaveBeenCalledWith(false);
        });
    });
});
