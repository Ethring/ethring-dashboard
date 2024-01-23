import _ from 'lodash';
import { ref, computed, inject } from 'vue';
import { useStore } from 'vuex';

import useTokenList from '@/compositions/useTokensList';

import { searchByKey } from '@/helpers/utils';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';

export default function useSelectModal(type) {
    const TYPES = {
        NETWORK: 'network',
        TOKEN: 'token',
    };

    const MAX_OPTIONS_PER_PAGE = 12;

    // =================================================================================================================

    const store = useStore();
    const useAdapter = inject('useAdapter');

    const { chainList } = useAdapter();
    const { getTokensList } = useTokenList();

    // =================================================================================================================

    const currentIndex = ref(MAX_OPTIONS_PER_PAGE);
    const searchValue = ref('');
    const isLoadMore = ref(false);

    // =================================================================================================================

    const selectType = computed(() => store.getters['tokenOps/selectType']);
    const direction = computed(() => store.getters['tokenOps/direction']);

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

    const selectedNetwork = computed(() => {
        const isSrc = direction.value === DIRECTIONS.SOURCE;

        return isSrc ? selectedSrcNetwork.value : selectedDstNetwork.value;
    });

    // =================================================================================================================

    const handleOnSelectNetwork = (item) => {
        const isSrc = direction.value === DIRECTIONS.SOURCE;

        if (isSrc) {
            return (selectedSrcNetwork.value = item);
        }

        selectedDstNetwork.value = item;
    };

    const handleOnSelectToken = (item) => {
        const isSrc = selectType.value === TOKEN_SELECT_TYPES.FROM;

        if (isSrc) {
            return (selectedTokenFrom.value = item);
        }

        return (selectedTokenTo.value = item);
    };

    const HANDLE_ON_SELECT = {
        [TYPES.NETWORK]: handleOnSelectNetwork,
        [TYPES.TOKEN]: handleOnSelectToken,
    };

    const handleOnSelect = (item) => {
        HANDLE_ON_SELECT[type.value](item);
        return store.dispatch('app/toggleSelectModal');
    };

    // =================================================================================================================

    const handleOnFilterNetworks = (val) => (searchValue.value = val);

    const handleAfterClose = () => {
        isLoadMore.value = false;
        currentIndex.value = MAX_OPTIONS_PER_PAGE;
        handleOnFilterNetworks('');
    };

    const handleLoadMore = () => {
        currentIndex.value += MAX_OPTIONS_PER_PAGE;

        if (currentIndex.value >= list.value.length) {
            isLoadMore.value = false;
        }
    };

    const searchInTokens = (list = [], value) => {
        return _.filter(
            list,
            (elem) => searchByKey(elem, value, 'name') || searchByKey(elem, value, 'symbol') || searchByKey(elem, value, 'address')
        );
    };

    // =================================================================================================================

    const list = computed(() => {
        if (type.value === TYPES.NETWORK) {
            return chainList.value || [];
        }

        return (
            getTokensList({
                srcNet: selectedNetwork.value,
                srcToken: selectedTokenFrom.value,
                dstToken: selectedTokenTo.value,
                isSameNet: selectedDstNetwork.value === selectedSrcNetwork.value || !selectedDstNetwork.value,
            }) || []
        );
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
