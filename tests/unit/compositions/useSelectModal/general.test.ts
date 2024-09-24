import { describe, test, expect, vi, beforeEach } from 'vitest';

import useSelectModal from '../../../../src/compositions/useSelectModal';

import { createTestStore } from '../../mocks/store';
import { COSMOS_TEST_ADAPTER, EVM_TEST_ADAPTER, chainListMockCosmos, chainListMockEvm, tokensList } from '../../mocks/compositions';
import { DIRECTIONS, ModuleType, TOKEN_SELECT_TYPES } from '../../../../src/shared/models/enums/modules.enum';
import { computed } from 'vue';

const list = [...chainListMockEvm, ...chainListMockCosmos];

describe.only('useSelectModal', () => {
    let store: any;

    beforeEach(() => {
        store = createTestStore();
        vi.resetAllMocks();

        vi.mock('../../../../src/shared/utils/prices.js', () => {
            return {
                assignPriceInfo: () => {
                    return 1;
                },
            };
        });
    });

    test('-> MAX_OPTIONS_PER_PAGE must be 20', () => {
        const type = computed(() => 'network');
        const { MAX_OPTIONS_PER_PAGE } = useSelectModal(type, { tmpStore: store });
        expect(MAX_OPTIONS_PER_PAGE).toBe(20);
    });

    describe('getList', () => {
        test('-> for: network must return list', () => {
            const type = computed(() => 'network');
            const { getList } = useSelectModal(type, { tmpStore: store });

            const list = getList();

            expect(list).not.toBeNull();
            expect(list).not.toBeUndefined();
        });

        test('-> for: token must return list', async () => {
            const type = computed(() => 'token');

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const { getList } = useSelectModal(type, { tmpStore: store });

            const list = getList();

            expect(list).not.toBeNull();
            expect(list).not.toBeUndefined();
        });
    });

    describe('handleOnSelectNetwork', () => {
        test('-> for: SEND network must set srcNetwork', async () => {
            const type = computed(() => 'network');

            await store.dispatch('tokenOps/setDirection', DIRECTIONS.SOURCE);
            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const { handleOnSelectNetwork } = useSelectModal(type, { tmpStore: store });

            handleOnSelectNetwork(list[0]);

            expect(store.getters['tokenOps/srcNetwork']).toEqual(list[0]);
        });

        test('-> for: SEND must check and reset dstNetwork', async () => {
            const type = computed(() => 'network');

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            await store.dispatch('tokenOps/setDirection', DIRECTIONS.DESTINATION);

            const { handleOnSelectNetwork } = useSelectModal(type, { tmpStore: store });

            handleOnSelectNetwork(list[0]);

            expect(store.getters['tokenOps/dstNetwork']).toBeNull();
        });

        test('-> for: BRIDGE DIFF NETS must set srcNetwork & dstNetwork', async () => {
            const type = computed(() => 'network');
            const [src, dst] = chainListMockEvm;

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.bridge });

            const { handleOnSelectNetwork } = useSelectModal(type, { tmpStore: store });

            await store.dispatch('tokenOps/setDirection', DIRECTIONS.SOURCE);

            handleOnSelectNetwork(src);

            await store.dispatch('tokenOps/setDirection', DIRECTIONS.DESTINATION);

            handleOnSelectNetwork(dst);

            expect(store.getters['tokenOps/srcNetwork']).toEqual(src);
            expect(store.getters['tokenOps/dstNetwork']).toEqual(dst);
        });

        test('-> for: SUPERSWAP SAME NETS must set srcNetwork & dstNetwork', async () => {
            const type = computed(() => 'network');
            const [src] = chainListMockEvm;

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.superSwap });

            const { handleOnSelectNetwork } = useSelectModal(type, { tmpStore: store });

            await store.dispatch('tokenOps/setDirection', DIRECTIONS.SOURCE);

            handleOnSelectNetwork(src);

            await store.dispatch('tokenOps/setDirection', DIRECTIONS.DESTINATION);

            handleOnSelectNetwork(src);

            expect(store.getters['tokenOps/srcNetwork']).toEqual(src);
            expect(store.getters['tokenOps/dstNetwork']).toEqual(src);
        });
    });

    describe('handleOnSelectToken', () => {
        test('-> for: SEND, must return null if pass null', async () => {
            const type = computed(() => 'token');

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);
            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const { handleOnSelectToken } = useSelectModal(type, { tmpStore: store });

            handleOnSelectToken(null);

            expect(store.getters['tokenOps/srcToken']).toBeNull();
        });

        test('-> for: SEND, must set srcToken', async () => {
            const type = computed(() => 'token');

            const [token] = tokensList.withBalance.evm.arbitrum;

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);
            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const { handleOnSelectToken } = useSelectModal(type, { tmpStore: store });

            handleOnSelectToken(token);

            expect(store.getters['tokenOps/srcToken']).toEqual(token);
        });

        test('-> for: SEND, must check & reset dstToken', async () => {
            const type = computed(() => 'token');

            const [token] = tokensList.withBalance.evm.arbitrum;

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.TO);

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const { handleOnSelectToken } = useSelectModal(type, { tmpStore: store });

            handleOnSelectToken(token);

            expect(store.getters['tokenOps/dstToken']).toBeNull();
        });

        test('-> for: SWAP, must set src & dst tokens', async () => {
            const type = computed(() => 'token');

            const [from, to] = tokensList.withBalance.evm.arbitrum;

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.swap });

            const { handleOnSelectToken } = useSelectModal(type, { tmpStore: store });

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);
            handleOnSelectToken(from);

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.TO);
            handleOnSelectToken(to);

            expect(store.getters['tokenOps/srcToken']).toEqual(from);
            expect(store.getters['tokenOps/dstToken']).toEqual(to);
        });
    });

    describe('onChangeIsOpen', () => {
        test('-> loadingState: true, not call handleOnSelectToken', async () => {
            const type = computed(() => 'token');

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);
            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const selectModal = useSelectModal(type, { tmpStore: store });

            const onChangeIsOpenMock = vi.spyOn(selectModal, 'onChangeIsOpen');
            const handleOnSelectTokenMock = vi.spyOn(selectModal, 'handleOnSelectToken');

            await selectModal.onChangeIsOpen(true);

            expect(onChangeIsOpenMock).toHaveBeenCalled();
            expect(onChangeIsOpenMock).toHaveBeenCalledWith(true);
            expect(handleOnSelectTokenMock).not.toHaveBeenCalled();
        });

        test('-> loadingState: false, must call handleOnSelectToken', async () => {
            const type = computed(() => 'token');

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);
            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const selectModal = useSelectModal(type, { tmpStore: store });

            const onChangeIsOpenMock = vi.spyOn(selectModal, 'onChangeIsOpen');

            await selectModal.onChangeIsOpen(false);

            expect(onChangeIsOpenMock).toHaveBeenCalled();
            expect(onChangeIsOpenMock).toHaveBeenCalledWith(false);
        });
    });

    describe('handleOnFilterNetworks', () => {
        test('-> must return MAX_OPTIONS_PER_PAGE as 20, when nothing to search', async () => {
            const type = computed(() => 'token');

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const { MAX_OPTIONS_PER_PAGE, handleOnFilterNetworks } = useSelectModal(type, { tmpStore: store });

            handleOnFilterNetworks('');

            expect(MAX_OPTIONS_PER_PAGE).toBe(20);
        });
    });

    describe('CHAIN_LIST', () => {
        vi.mock('../../../../src/core/wallet-adapter/compositions/useAdapter.ts', () => {
            return {
                default: () => EVM_TEST_ADAPTER(),
            };
        });

        test('-> must return EVM chain list', async () => {
            const type = computed(() => 'network');

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.send });

            const { CHAIN_LIST } = useSelectModal(type, { tmpStore: store });

            expect(CHAIN_LIST.value).toEqual(chainListMockEvm);
        });
    });

    describe('Token list', () => {
        test('-> must return tokens list with sorted order for "et" searchValue', async () => {
            const type = computed(() => 'token');

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.superSwap });

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);

            await store.dispatch('tokenOps/setDirection', DIRECTIONS.SOURCE);

            await store.dispatch('tokenOps/setSrcNetwork', chainListMockEvm[0]);

            const { MAX_OPTIONS_PER_PAGE, searchValue, options, getList, handleOnTokenSelect } = useSelectModal(type, { tmpStore: store });

            searchValue.value = 'et';

            await handleOnTokenSelect();

            expect(MAX_OPTIONS_PER_PAGE).toBe(20);
            expect(options.value[0]).contains({ verified: true });
            expect(options.value[0].logo).not.toBeNull();
            expect(options.value[0].logo).not.toBeUndefined();
        });

        test('-> must return tokens list with sorted order for "us" searchValue', async () => {
            const type = computed(() => 'token');

            await store.dispatch('app/toggleSelectModal', { type: type.value, module: ModuleType.superSwap });

            await store.dispatch('tokenOps/setSelectType', TOKEN_SELECT_TYPES.FROM);

            await store.dispatch('tokenOps/setDirection', DIRECTIONS.SOURCE);

            await store.dispatch('tokenOps/setSrcNetwork', chainListMockEvm[0]);

            const { MAX_OPTIONS_PER_PAGE, searchValue, options, getList, handleOnTokenSelect } = useSelectModal(type, { tmpStore: store });

            searchValue.value = 'us';

            await handleOnTokenSelect();

            expect(MAX_OPTIONS_PER_PAGE).toBe(20);
            expect(options.value[0]).contains({ verified: true });
            expect(options.value[0].logo).not.toBeNull();
            expect(options.value[0].logo).not.toBeUndefined();
        });
    });
});
