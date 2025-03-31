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
});
