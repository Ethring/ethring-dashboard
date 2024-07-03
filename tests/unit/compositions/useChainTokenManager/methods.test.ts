import { describe, test, expect, vi, beforeEach } from 'vitest';

import useChainTokenManager from '../../../../src/compositions/useChainTokenManager';
import { ModuleType } from '../../../../src/shared/models/enums/modules.enum';

import { MOCKED_ADAPTER } from '../../mocks/compositions/index';
import { createTestStore } from '../../mocks/store';
import { Ecosystem } from '../../../../src/shared/models/enums/ecosystems.enum';

const generalTests = () => {
    let store: any;

    beforeEach(() => {
        store = createTestStore();
    });

    describe('defaultChainMangerByModule', () => {
        describe(`${ModuleType.send.toUpperCase()}`, () => {
            test(`-> for: ${ModuleType.send.toUpperCase()} must set srcNetwork and dstNetwork to null`, async () => {
                const { defaultChainMangerByModule, isNeedDstNetwork, defaultSrcNetwork } = useChainTokenManager(ModuleType.send, {
                    tmpStore: store,
                });
                defaultChainMangerByModule();
                expect(store.getters['tokenOps/srcNetwork']).toEqual(defaultSrcNetwork.value);
                expect(store.getters['tokenOps/dstNetwork']).toBeNull();
                expect(isNeedDstNetwork.value).toBe(false);
            });
        });

        describe(`${ModuleType.swap.toUpperCase()}`, () => {
            test(`-> for: ${ModuleType.swap.toUpperCase()} must set srcNetwork and dstNetwork to null`, async () => {
                const { defaultChainMangerByModule, isNeedDstNetwork, defaultSrcNetwork } = useChainTokenManager(ModuleType.swap, {
                    tmpStore: store,
                });
                defaultChainMangerByModule();
                expect(store.getters['tokenOps/srcNetwork']).toEqual(defaultSrcNetwork.value);
                expect(store.getters['tokenOps/dstNetwork']).toBeNull();
                expect(isNeedDstNetwork.value).toBe(false);
            });
        });

        describe(`${ModuleType.bridge.toUpperCase()}`, () => {
            test(`-> for: ${ModuleType.bridge.toUpperCase()} must set srcNetwork default and dstNetwork to default, when src is current chain & dst not set`, async () => {
                const { defaultChainMangerByModule, isNeedDstNetwork, defaultSrcNetwork, defaultDstNetwork } = useChainTokenManager(
                    ModuleType.bridge,
                    {
                        tmpStore: store,
                    },
                );

                await store.dispatch('tokenOps/setDstNetwork', null);

                defaultChainMangerByModule();

                expect(store.getters['tokenOps/srcNetwork']).toEqual(defaultSrcNetwork.value);
                expect(store.getters['tokenOps/dstNetwork']).toEqual(defaultDstNetwork.value);

                expect(isNeedDstNetwork.value).toBe(true);
            });

            test(`-> for: ${ModuleType.bridge.toUpperCase()} must set srcNetwork default and dstNetwork to default, when src & dst nets are null`, async () => {
                const { defaultChainMangerByModule, isNeedDstNetwork, defaultSrcNetwork, defaultDstNetwork } = useChainTokenManager(
                    ModuleType.bridge,
                    {
                        tmpStore: store,
                    },
                );

                await store.dispatch('tokenOps/setSrcNetwork', null);
                await store.dispatch('tokenOps/setDstNetwork', null);

                defaultChainMangerByModule();

                expect(store.getters['tokenOps/srcNetwork']).toEqual(defaultSrcNetwork.value);
                expect(store.getters['tokenOps/dstNetwork']).toEqual(defaultDstNetwork.value);
                expect(isNeedDstNetwork.value).toBe(true);
            });
        });

        describe(`${ModuleType.superSwap.toUpperCase()}`, () => {
            test(`-> for: ${ModuleType.superSwap.toUpperCase()} must set srcNetwork and dstNetwork`, async () => {
                const { defaultChainMangerByModule, isNeedDstNetwork, defaultSrcNetwork, defaultDstNetwork } = useChainTokenManager(
                    ModuleType.superSwap,
                    {
                        tmpStore: store,
                    },
                );

                defaultChainMangerByModule();

                expect(store.getters['tokenOps/srcNetwork']).toEqual(defaultSrcNetwork.value);
                expect(store.getters['tokenOps/dstNetwork']).toEqual(defaultDstNetwork.value);
                expect(isNeedDstNetwork.value).toBe(true);
            });
        });
    });

    describe('validateChainsByModule', () => {
        describe('SEND', () => {
            test(`-> should reset dst network & token`, () => {
                const chainTokenManager = useChainTokenManager(ModuleType.send, { tmpStore: store });
                chainTokenManager.validateChainsByModule(ModuleType.send);
                expect(store.getters['tokenOps/dstNetwork']).toBeNull();
                expect(store.getters['tokenOps/dstToken']).toBeNull();
            });
        });

        describe('STAKE', () => {
            test(`-> should reset dst network & token`, () => {
                const chainTokenManager = useChainTokenManager(ModuleType.stake, { tmpStore: store });
                chainTokenManager.validateChainsByModule(ModuleType.stake);
                expect(store.getters['tokenOps/dstNetwork']).toBeNull();
                expect(store.getters['tokenOps/dstToken']).toBeNull();
            });
        });

        describe('SWAP', () => {
            test(`-> should reset dst network`, () => {
                const chainTokenManager = useChainTokenManager(ModuleType.swap, { tmpStore: store });
                chainTokenManager.validateChainsByModule(ModuleType.swap);
                expect(store.getters['tokenOps/dstNetwork']).toBeNull();
            });
        });

        describe('BRIDGE', () => {
            test(`DST EMPTY -> should validate dst network, if its empty must set to default dstNetwork`, async () => {
                const chainTokenManager = useChainTokenManager(ModuleType.bridge, { tmpStore: store });
                await store.dispatch('tokenOps/setDstNetwork', null);
                chainTokenManager.validateChainsByModule(ModuleType.bridge);
                expect(store.getters['tokenOps/dstNetwork']).not.toBeNull();
                expect(store.getters['tokenOps/dstNetwork']).toEqual(chainTokenManager.defaultDstNetwork.value);
            });

            test(`DST NOT EMPTY -> should validate dst network, if its empty must set to default dstNetwork`, () => {
                const chainTokenManager = useChainTokenManager(ModuleType.bridge, { tmpStore: store });
                chainTokenManager.validateChainsByModule(ModuleType.bridge);
                expect(store.getters['tokenOps/dstNetwork']).not.toBeNull();
                expect(store.getters['tokenOps/dstNetwork']).toEqual(chainTokenManager.defaultDstNetwork.value);
            });
        });

        describe('SUPERSWAP', () => {
            test(`DST EMPTY -> should validate dst network, if its empty must set to default dstNetwork`, async () => {
                const chainTokenManager = useChainTokenManager(ModuleType.superSwap, { tmpStore: store });
                await store.dispatch('tokenOps/setDstNetwork', null);
                chainTokenManager.validateChainsByModule(ModuleType.superSwap);
                expect(store.getters['tokenOps/dstNetwork']).not.toBeNull();
                expect(store.getters['tokenOps/dstNetwork']).toEqual(chainTokenManager.defaultDstNetwork.value);
            });

            test(`DST NOT EMPTY -> should validate dst network, if its empty must set to default dstNetwork`, () => {
                const chainTokenManager = useChainTokenManager(ModuleType.superSwap, { tmpStore: store });
                chainTokenManager.validateChainsByModule(ModuleType.superSwap);
                expect(store.getters['tokenOps/dstNetwork']).not.toBeNull();
                expect(store.getters['tokenOps/dstNetwork']).toEqual(chainTokenManager.defaultDstNetwork.value);
            });
        });
    });

    // describe('onChangeSrcDstNetwork', () => {
    //     describe('SEND', () => {
    //         test(`-> should reset dst network & token`, () => {
    //             const chainTokenManager = useChainTokenManager(ModuleType.send, { tmpStore: store });
    //             expect(store.getters['tokenOps/dstNetwork']).toBeNull();
    //             expect(store.getters['tokenOps/dstToken']).toBeNull();
    //         });
    //     });
    // });
};

describe(`useChainTokenManager ${Ecosystem.EVM}`, () => {
    vi.mock('../../../../src/core/wallet-adapter/compositions/useAdapter.ts', () => {
        return {
            default: () => MOCKED_ADAPTER[Ecosystem.EVM](),
        };
    });

    generalTests();
});

describe(`useChainTokenManager ${Ecosystem.COSMOS}`, () => {
    vi.mock('../../../../src/core/wallet-adapter/compositions/useAdapter.ts', () => {
        return {
            default: () => MOCKED_ADAPTER[Ecosystem.COSMOS](),
        };
    });

    generalTests();
});
