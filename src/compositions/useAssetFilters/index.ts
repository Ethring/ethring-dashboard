import { computed, ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { orderBy } from 'lodash';

export function useAssetFilters() {
    const store = useStore();
    const route = useRoute();

    const filters = computed({
        get: () => store.getters['stakeAssets/getFilters'],
        set: (value) => store.dispatch('stakeAssets/setFilters', value),
    });

    const isAllChains = computed({
        get: () => filters.value.isAllChains,
        set: (value) => store.dispatch('stakeAssets/setIsAllChains', value),
    });

    const maxTVL = computed(() => store.getters['stakeAssets/getMaxTvl']);
    const totalCountOfFilters = computed(() => store.getters['stakeAssets/getTotalCountOfFilters']);

    // *********************************************************
    // * Filter Options
    // *********************************************************

    const chainsOptions = computed(() => {
        const chains = store.getters['stakeAssets/getChains'];

        const options = chains.map((chain: any) => ({
            logo: chain.logo,
            label: chain.name,
            value: chain.net,
        }));

        return orderBy(options, ['label'], ['asc']);
    });

    const protocolsOptions = computed(() => {
        const protocols = store.getters['stakeAssets/getProtocols'];

        const options = protocols.map((protocol: any) => ({
            logo: protocol.logo,
            label: protocol.name,
            value: protocol.id,
        }));

        return orderBy(options, ['label'], ['asc']);
    });

    const categoriesOptions = computed(() => {
        const categories = store.getters['stakeAssets/getCategories'];

        const options = categories.map((category: any) => ({
            label: category.name,
            value: category.id,
        }));

        return orderBy(options, ['label'], ['asc']);
    });

    // *********************************************************
    // * Methods
    // *********************************************************

    const onCheckAllChains = () => {
        // if (isAllChains.value) return (filters.value.chains = chainsOptions.value.map((chain: any) => chain.value));
        // return (filters.value.chains = []);
    };

    const openFiltersModal = (e: any) => {
        const { target } = e;
        const isFilterButton = target.closest('.dashboard__filters');
        if (!isFilterButton) return;
        return store.dispatch('app/toggleModal', 'filtersModal');
    };

    const resetFilters = () => store.dispatch('stakeAssets/resetFilters');

    onMounted(async () => {
        await Promise.all([
            store.dispatch('stakeAssets/setChains'),
            store.dispatch('stakeAssets/setProtocols'),
            store.dispatch('stakeAssets/setCategories'),
        ]);
    });

    watch(
        () => route,
        () => {
            resetFilters();
        },
        { immediate: true },
    );

    return {
        maxTVL,
        totalCountOfFilters,
        isAllChains,

        // Main filters
        filters,

        // Options
        chainsOptions,
        protocolsOptions,
        categoriesOptions,

        // Methods
        openFiltersModal,

        onCheckAllChains,

        resetFilters,
    };
}
