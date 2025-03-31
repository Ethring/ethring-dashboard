import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createStore } from 'vuex';

import useChainTokenManager from '../../../../src/compositions/useChainTokenManager';

import { ModuleType } from '../../../../src/shared/models/enums/modules.enum';

import { MOCKED_ADAPTER } from '../../mocks/compositions/index';
import { computed } from 'vue';
import { createTestStore } from '../../mocks/store';
import { Ecosystem, Ecosystems } from '../../../../src/shared/models/enums/ecosystems.enum';

describe('useChainTokenManager', () => {
    let store: any;

    beforeEach(() => {
        store = createTestStore();
    });

    vi.mock('../../../../src/core/wallet-adapter/compositions/useAdapter.ts', () => {
        return {
            default: () => MOCKED_ADAPTER[Ecosystem.EVM](),
        };
    });

    describe('onChangeAccount', () => {
        // test(`SEND: DIFFERENT ECOSYSTEM -> must set srcNetwork and dstNetwork to null`, async () => {
        //     const { onChangeAccount } = useChainTokenManager(ModuleType.send, { tmpStore: store });
        //     await store.dispatch('tokenOps/setSrcNetwork', null);

        //     await onChangeAccount(
        //         MOCKED_ADAPTER[Ecosystem.COSMOS]().walletAccount.value,
        //         MOCKED_ADAPTER[Ecosystem.EVM]().walletAccount.value,
        //     );

        //     expect(store.getters['tokenOps/srcNetwork']).toEqual(MOCKED_ADAPTER[Ecosystem.COSMOS]().currentChainInfo.value);
        //     expect(store.getters['tokenOps/dstNetwork']).toBeNull();
        // });

        // test(`SEND: SAME ECOSYSTEM -> must set srcNetwork and dstNetwork to null`, async () => {
        //     const { onChangeAccount } = useChainTokenManager(ModuleType.send, { tmpStore: store });
        //     await store.dispatch('tokenOps/setSrcNetwork', null);

        //     await onChangeAccount(
        //         MOCKED_ADAPTER[`${Ecosystem.EVM}-1`]().walletAccount.value,
        //         MOCKED_ADAPTER[Ecosystem.EVM]().walletAccount.value,
        //     );

        //     expect(store.getters['tokenOps/srcNetwork']).toEqual(MOCKED_ADAPTER[Ecosystem.COSMOS]().currentChainInfo.value);
        //     expect(store.getters['tokenOps/dstNetwork']).toBeNull();
        // });

        test(`BRIDGE: SAME ECOSYSTEM -> must set srcNetwork and dstNetwork to default`, async () => {
            const firstAcc = Ecosystem.EVM;
            const secondAcc = `${Ecosystem.EVM}-1`;

            const { onChangeAccount, defaultDstNetwork } = useChainTokenManager(ModuleType.bridge, { tmpStore: store });

            await store.dispatch('tokenOps/setSrcNetwork', null);

            await onChangeAccount(MOCKED_ADAPTER[secondAcc]().walletAccount.value, MOCKED_ADAPTER[firstAcc]().walletAccount.value);

            expect(store.getters['tokenOps/dstNetwork']).toEqual(defaultDstNetwork.value);
        });

        test(`BRIDGE: SAME ECOSYSTEM -> must set srcNetwork and dstNetwork to default if both of them null`, async () => {
            const firstAcc = Ecosystem.EVM;
            const secondAcc = `${Ecosystem.EVM}-1`;

            const { onChangeAccount, defaultDstNetwork } = useChainTokenManager(ModuleType.bridge, { tmpStore: store });

            await store.dispatch('tokenOps/setDstNetwork', null);

            await onChangeAccount(MOCKED_ADAPTER[secondAcc]().walletAccount.value, MOCKED_ADAPTER[firstAcc]().walletAccount.value);

            // expect(store.getters['tokenOps/srcNetwork']).toEqual(MOCKED_ADAPTER[secondAcc]().currentChainInfo.value);
            expect(store.getters['tokenOps/dstNetwork']).toEqual(defaultDstNetwork.value);
        });
    });
});
