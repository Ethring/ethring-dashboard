import { filter, slice } from 'lodash';

import { ref, computed, nextTick, watch, ComputedRef, onUnmounted } from 'vue';
import { useStore, Store } from 'vuex';

import useTokenList from '@/compositions/useTokensList';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import usePoolsList from '@/compositions/usePoolList';

import { searchByKey } from '@/shared/utils/helpers';
import { assignPriceInfo } from '@/shared/utils/prices';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { IS_NEED_DST_NETWORK, IS_NOT_NEED_DST_TOKEN, ModuleType } from '@/shared/models/enums/modules.enum';
import { IChainConfig } from '@/shared/models/types/chain-config';
import { IAsset } from '@/shared/models/fields/module-fields';

export default function useSelectModal(type: ComputedRef<string>, { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null }) {
    // *****************************************************************************************************************
    // * Store
    // *****************************************************************************************************************

    const store = tmpStore || useStore();

    // *****************************************************************************************************************
    // * Constants
    // *****************************************************************************************************************

    const MAX_OPTIONS_PER_PAGE = 20;
    const LIST_CONTAINER = '.select-modal-list-container';

    const TYPES = {
        NETWORK: 'network',
        TOKEN: 'token',
        POOL: 'pool',
    };

    // *****************************************************************************************************************
    // * Refs
    // *****************************************************************************************************************

    const currentIndex = ref(MAX_OPTIONS_PER_PAGE);
    const searchValue = ref('');
    const isLoadMore = ref(true);

    // *****************************************************************************************************************
    // * Shortcuts and operations
    // *****************************************************************************************************************

    const CurrentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);
    const CurrentShortcut = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

    const CurrentOperation = computed(() => {
        if (!CurrentShortcut.value) return null;
        if (!CurrentStepId.value) return null;

        return store.getters['shortcuts/getCurrentOperation'](CurrentShortcut.value);
    });

    const excludeChainList = computed(() => {
        const { excludeChains = [] } = CurrentOperation.value || {};
        return excludeChains || [];
    });

    const includeChainList = computed(() => {
        const { includeChains = [] } = CurrentOperation.value || {};
        return includeChains || [];
    });

    // TODO: Add also for exclude tokens
    const includeTokenList = computed(() => {
        const { includeTokens = {} } = CurrentOperation.value || {};

        if (includeTokens[selectedSrcNetwork.value?.net]) return includeTokens[selectedSrcNetwork.value?.net];

        return [];
    });

    // *****************************************************************************************************************
    // * Adapter and TokenList
    // *****************************************************************************************************************

    const { chainList, getAllChainsList } = useAdapter({ tmpStore: store });
    const { getTokensList } = useTokenList({ tmpStore: store });

    // *****************************************************************************************************************
    // * Pools with balances
    // *****************************************************************************************************************

    const pools = usePoolsList();

    // *****************************************************************************************************************
    // * Getters
    // *****************************************************************************************************************

    const selectModal = computed(() => store.getters['app/selectModal']);
    const module = computed(() => selectModal.value?.module);

    // * Modal window is open
    const isOpen = computed(() => selectModal.value?.isOpen);

    // *****************************************************************************************************************
    // * Fields for selected network and token
    // *****************************************************************************************************************

    const selectType = computed(() => store.getters['tokenOps/selectType']);
    const direction = computed(() => store.getters['tokenOps/direction']);

    const selectedSrcNetwork = computed<IChainConfig>({
        get: () => store.getters['tokenOps/srcNetwork'],
        set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
    });

    const selectedDstNetwork = computed<IChainConfig>({
        get: () => store.getters['tokenOps/dstNetwork'],
        set: (value) => store.dispatch('tokenOps/setDstNetwork', value),
    });

    const selectedTokenFrom = computed<IAsset>({
        get: () => store.getters['tokenOps/srcToken'],
        set: (value) => store.dispatch('tokenOps/setSrcToken', value),
    });

    const selectedTokenTo = computed<IAsset>({
        get: () => store.getters['tokenOps/dstToken'],
        set: (value) => store.dispatch('tokenOps/setDstToken', value),
    });

    // *****************************************************************************************************************
    // * Flags
    // *****************************************************************************************************************

    const isSrcDirection = computed(() => direction.value === DIRECTIONS.SOURCE);
    const isFromSelect = computed(() => selectType.value === TOKEN_SELECT_TYPES.FROM);
    const selectedNetwork = computed(() => (isSrcDirection.value ? selectedSrcNetwork.value : selectedDstNetwork.value));

    // *****************************************************************************************************************
    // * Network & Token Select
    // *****************************************************************************************************************

    const handleOnSelectNetwork = (item: IChainConfig) => {
        switch (direction.value) {
            case DIRECTIONS.SOURCE:
                selectedSrcNetwork.value = item;
                break;
            case DIRECTIONS.DESTINATION:
                IS_NEED_DST_NETWORK.includes(module.value) && (selectedDstNetwork.value = item);
                break;
        }
    };

    const handleOnSelectToken = (item: IAsset) => {
        assignPriceInfo(selectedNetwork.value, item);

        if (!selectType.value) return;

        if (!item) return;

        switch (selectType.value) {
            case TOKEN_SELECT_TYPES.FROM:
                selectedTokenFrom.value = item;
                break;
            case TOKEN_SELECT_TYPES.TO:
                !IS_NOT_NEED_DST_TOKEN.includes(module.value) && (selectedTokenTo.value = item);
                break;
        }
    };

    const handleOnSelect = (e: any, item: any) => {
        if (!type.value) return;

        const { classList = [] } = e?.target || {};

        // * Prevent select when click on link or icon in list
        if (classList?.contains('link') || classList?.contains('link-icon')) return;

        switch (type.value) {
            case TYPES.NETWORK:
                handleOnSelectNetwork(item);
                break;

            case TYPES.TOKEN:
                handleOnSelectToken(item);
                break;
            case TYPES.POOL:
                handleOnSelectToken(item);
                break;
        }

        return store.dispatch('app/toggleSelectModal', { type: type.value, module: module.value });
    };

    // *****************************************************************************************************************
    // * Methods
    // *****************************************************************************************************************

    // * Change scroll
    const changeScroll = () => {
        const scrollToBottom = () => {
            const listContainer = document.querySelector(LIST_CONTAINER);

            if (!listContainer) return;

            listContainer.scrollTo({
                top: listContainer.scrollTop + 450,
                behavior: 'smooth',
            });
        };

        nextTick(() => scrollToBottom());
    };

    // * Handle after close
    const handleAfterClose = () => {
        changeScroll();
        isLoadMore.value = false;
        currentIndex.value = MAX_OPTIONS_PER_PAGE;
        handleOnFilterNetworks('');
    };

    // * Load more
    const handleLoadMore = () => {
        const list = getList();
        currentIndex.value += MAX_OPTIONS_PER_PAGE;
        if (currentIndex.value >= list.length) isLoadMore.value = false;
    };

    // * Search filter
    const handleOnFilterNetworks = (val: string) => {
        if (!val) currentIndex.value = MAX_OPTIONS_PER_PAGE;
        return (searchValue.value = val);
    };

    // * Search in tokens
    const searchInTokens = (list = [], value: string) => {
        return filter(
            list,
            (elem) => searchByKey(elem, value, 'name') || searchByKey(elem, value, 'symbol') || searchByKey(elem, value, 'address'),
        );
    };

    // * Get chains for modules
    const getChainListForModules = () => {
        switch (module.value) {
            // return all chains for superSwap, including COSMOS & EVM ecosystems;
            case ModuleType.liquidityProvider:
            case ModuleType.superSwap:
                return getAllChainsList().filter((elem) => !elem.isTestNet);

            // return default chains for module
            default:
                return chainList.value;
        }
    };

    // * Get chains for modules
    const getChainsList = () => {
        const list = getChainListForModules();

        // * Set Selected state for chains
        for (const chain of list)
            chain.selected = chain.net === selectedSrcNetwork.value?.net || chain.net === selectedDstNetwork.value?.net;

        return list;
    };

    // *****************************************************************************************************************
    // * Computed
    // *****************************************************************************************************************

    const TOKEN_LIST = ref<IAsset[]>([]);

    const CHAIN_LIST = computed(() => {
        if (type.value === TYPES.TOKEN) return [];

        let list = getChainsList();

        // * Filter chains by include
        if (includeChainList.value.length) list = list.filter((chain) => includeChainList.value.includes(chain.net));

        // * Filter chains by exclude
        if (excludeChainList.value.length) list = list.filter((chain) => !excludeChainList.value.includes(chain.net));

        // * Filter chains by module
        if (module.value === ModuleType.bridge) list = list.filter((chain) => !chain.selected || chain.net !== selectedNetwork.value?.net);

        return list;
    });

    // *****************************************************************************************************************

    // * Get list
    const getList = (): any[] => {
        switch (type.value) {
            case TYPES.NETWORK:
                return CHAIN_LIST.value || [];
            case TYPES.TOKEN:
                return TOKEN_LIST.value || [];
            case TYPES.POOL:
                return pools.value[selectedSrcNetwork.value?.net] || [];
            default:
                return [];
        }
    };

    // * Get options
    const options = computed(() => {
        const list = getList() || [];

        let records = list;

        if (searchValue.value) records = searchInTokens(list as any, searchValue.value);

        if (records.length <= MAX_OPTIONS_PER_PAGE) {
            isLoadMore.value = false;
            return records;
        }

        isLoadMore.value = list.length > MAX_OPTIONS_PER_PAGE && currentIndex.value <= records.length;

        return slice(records, 0, currentIndex.value);
    });

    const handleOnTokenSelect = async () => {
        store.dispatch('app/setLoadingTokenList', true);

        const exclude = [];

        const isSameNet =
            selectedSrcNetwork.value && selectedDstNetwork.value && selectedSrcNetwork.value.net === selectedDstNetwork.value.net;

        const isExcludeExist = module.value === ModuleType.swap || isSameNet;

        // * Exclude selected token
        if (isExcludeExist && isFromSelect.value) selectedTokenTo.value && exclude.push(selectedTokenTo.value?.id);
        if (isExcludeExist && !isFromSelect.value) selectedTokenFrom.value && exclude.push(selectedTokenFrom.value?.id);

        // * Get token list
        TOKEN_LIST.value = await getTokensList({
            srcNet: selectedNetwork.value,
            srcToken: selectedTokenFrom.value,
            dstToken: selectedTokenTo.value,
            onlyWithBalance: module.value === ModuleType.send,
            exclude,
        });

        // * Filter tokens by include
        if (includeTokenList.value.length)
            TOKEN_LIST.value = TOKEN_LIST.value.filter((token: IAsset) => includeTokenList.value.includes(token.id));

        setTimeout(() => {
            store.dispatch('app/setLoadingTokenList', false);
        }, 300);
    };

    const onChangeIsOpen = async (loadingState: boolean) => {
        if (!loadingState) return;

        switch (type.value) {
            case TYPES.NETWORK:
                break;
            case TYPES.TOKEN:
                await handleOnTokenSelect();
                break;
        }
    };

    // *****************************************************************************************************************
    // * Watchers
    // *****************************************************************************************************************

    const unWatchIsOpen = watch(isOpen, async (loading) => {
        TOKEN_LIST.value = []; // clear token list
        await onChangeIsOpen(loading); // handle loading
    });

    // *****************************************************************************************************************
    // * Lifecycle onUnmounted
    // *****************************************************************************************************************
    onUnmounted(() => {
        currentIndex.value = MAX_OPTIONS_PER_PAGE;
        unWatchIsOpen();
    });

    return {
        options,
        MAX_OPTIONS_PER_PAGE,

        CHAIN_LIST,
        TOKEN_LIST,

        searchValue,

        isLoadMore,

        getList,
        getChainsList,
        getChainListForModules,

        onChangeIsOpen,

        handleOnSelectNetwork,
        handleOnSelectToken,
        handleOnTokenSelect,

        handleOnSelect,
        handleLoadMore,
        handleAfterClose,
        handleOnFilterNetworks,
    };
}
