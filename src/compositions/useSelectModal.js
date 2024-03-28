import _ from 'lodash';

import { ref, computed, inject, nextTick, watch, onMounted } from 'vue';
import { useStore } from 'vuex';

import useTokenList from '@/compositions/useTokensList';

import { searchByKey } from '@/shared/utils/helpers';
import { assignPriceInfo } from '@/shared/utils/prices';

import { DIRECTIONS, TOKEN_SELECT_TYPES, PRICE_UPDATE_TIME } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { ECOSYSTEMS } from '@/Adapter/config';

export default function useSelectModal(type) {
    const TYPES = {
        NETWORK: 'network',
        TOKEN: 'token',
    };

    const LIST_CONTAINER = '.select-modal-list-container';

    const MAX_OPTIONS_PER_PAGE = 12;

    // =================================================================================================================

    const store = useStore();
    const useAdapter = inject('useAdapter');

    const { chainList, getChainListByEcosystem } = useAdapter();
    const { getTokensList } = useTokenList();

    // =================================================================================================================

    const currentIndex = ref(MAX_OPTIONS_PER_PAGE);
    const searchValue = ref('');
    const isLoadMore = ref(true);

    // =================================================================================================================

    const selectType = computed(() => store.getters['tokenOps/selectType']);
    const direction = computed(() => store.getters['tokenOps/direction']);

    const selectModal = computed(() => store.getters['app/selectModal']);
    const module = computed(() => selectModal.value.module);
    const isOpen = computed(() => selectModal.value.isOpen);

    // =================================================================================================================

    const selectedSrcNetwork = computed({
        get: () => store.getters['tokenOps/srcNetwork'],
        set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
    });

    const selectedDstNetwork = computed({
        get: () => store.getters['tokenOps/dstNetwork'],
        set: (value) => store.dispatch('tokenOps/setDstNetwork', value),
    });

    // =================================================================================================================

    const selectedTokenFrom = computed({
        get: () => store.getters['tokenOps/srcToken'],
        set: (value) => store.dispatch('tokenOps/setSrcToken', value),
    });

    const selectedTokenTo = computed({
        get: () => store.getters['tokenOps/dstToken'],
        set: (value) => store.dispatch('tokenOps/setDstToken', value),
    });

    // =================================================================================================================

    const isSrcDirection = computed(() => direction.value === DIRECTIONS.SOURCE);
    const isFromSelect = computed(() => selectType.value === TOKEN_SELECT_TYPES.FROM);

    // =================================================================================================================

    const selectedNetwork = computed(() => (isSrcDirection.value ? selectedSrcNetwork.value : selectedDstNetwork.value));

    // =================================================================================================================

    const handleOnSelectNetwork = (item) => (isSrcDirection.value ? (selectedSrcNetwork.value = item) : (selectedDstNetwork.value = item));

    const handleOnSelectToken = (item) => {
        assignPriceInfo(selectedNetwork.value, item);

        return isFromSelect.value ? (selectedTokenFrom.value = item) : (selectedTokenTo.value = item);
    };

    const HANDLE_ON_SELECT = {
        [TYPES.NETWORK]: handleOnSelectNetwork,
        [TYPES.TOKEN]: handleOnSelectToken,
    };

    const handleOnSelect = (e, item) => {
        const { classList = [] } = e?.target || {};

        if (classList?.contains('link') || classList?.contains('link-icon')) {
            return;
        }

        if (!type.value) {
            return;
        }

        HANDLE_ON_SELECT[type.value](item);
        return store.dispatch('app/toggleSelectModal', { type: type.value });
    };

    // =================================================================================================================

    const handleOnFilterNetworks = (val) => {
        if (!val) {
            currentIndex.value = MAX_OPTIONS_PER_PAGE;
        }

        return (searchValue.value = val);
    };

    const changeScroll = () => {
        nextTick(() => {
            const listContainer = document.querySelector(LIST_CONTAINER);
            listContainer.scrollTo({
                top: listContainer.scrollTop + 450,
                behavior: 'smooth',
            });
        });
    };

    const handleAfterClose = () => {
        changeScroll(true);
        isLoadMore.value = false;
        currentIndex.value = MAX_OPTIONS_PER_PAGE;
        handleOnFilterNetworks('');
    };

    const handleLoadMore = () => {
        currentIndex.value += MAX_OPTIONS_PER_PAGE;

        if (currentIndex.value >= list.value.length) {
            isLoadMore.value = false;
        }

        changeScroll();
    };

    // =================================================================================================================

    const searchInTokens = (list = [], value) => {
        return _.filter(
            list,
            (elem) => searchByKey(elem, value, 'name') || searchByKey(elem, value, 'symbol') || searchByKey(elem, value, 'address'),
        );
    };

    const chains = computed(() => {
        if (type.value === TYPES.TOKEN) {
            return [];
        }

        let list = chainList.value || [];

        if (module.value === ModuleType.superSwap) {
            list = [...getChainListByEcosystem(ECOSYSTEMS.EVM), ...getChainListByEcosystem(ECOSYSTEMS.COSMOS)];
        }

        for (const chain of list) {
            chain.selected = chain.net === selectedSrcNetwork.value?.net || chain.net === selectedDstNetwork.value?.net;
        }

        return list.filter((chain) => {
            if (module.value === 'bridge') {
                return !chain.selected || chain?.net !== selectedNetwork.value?.net;
            }

            return chain;
        });
    });

    const tokens = ref([]);

    const list = computed(() => {
        const values = {
            [TYPES.NETWORK]: chains.value,
            [TYPES.TOKEN]: tokens.value,
        };

        return values[type.value];
    });

    const options = computed(() => {
        isLoadMore.value = false;

        let records = list.value || [];

        if (searchValue.value) {
            records = searchInTokens(list.value, searchValue.value);
        }

        if (records.length <= MAX_OPTIONS_PER_PAGE) {
            isLoadMore.value = false;
            return records;
        }

        isLoadMore.value = list.value.length > MAX_OPTIONS_PER_PAGE && currentIndex.value <= records.length;

        return _.slice(records, 0, currentIndex.value);
    });

    watch(isOpen, async () => {
        if (isOpen.value && selectModal.value?.type === TYPES.TOKEN) {
            store.dispatch('app/setLoadingTokenList', true);

            const isSameNet =
                selectedSrcNetwork.value && selectedDstNetwork.value && selectedSrcNetwork.value.net === selectedDstNetwork.value.net;

            const isExcludeExist = module.value === ModuleType.swap || isSameNet;

            const exclude = [];

            if (isExcludeExist && isFromSelect.value) {
                selectedTokenTo.value && exclude.push(selectedTokenTo.value?.id);
            }

            if (isExcludeExist && !isFromSelect.value) {
                selectedTokenFrom.value && exclude.push(selectedTokenFrom.value?.id);
            }

            tokens.value = await getTokensList({
                srcNet: selectedNetwork.value,
                srcToken: selectedTokenFrom.value,
                dstToken: selectedTokenTo.value,
                isSameNet,
                onlyWithBalance: isFromSelect.value,
                exclude,
            });

            store.dispatch('app/setLoadingTokenList', false);
        }
    });

    return {
        options,
        searchValue,

        isLoadMore,

        handleOnSelect,
        handleLoadMore,
        handleAfterClose,
        handleOnFilterNetworks,
    };
}
