<template>
    <a-modal v-model:open="isModalOpen" centered :footer="null" class="filters-modal select-modal">
        <template #title>
            <div class="filters-modal__title">
                Filters

                <a-badge v-if="totalCountOfFilters > 0" :count="totalCountOfFilters" class="filters-badge-count" color="#969696" />

                <a-button type="text" @click="resetFilters"> Clear all </a-button>
            </div>
        </template>
        <div class="filters-modal__top-filters">
            <a-checkbox v-model:checked="filters.onlyWithRewards">Only show vaults with rewards</a-checkbox>
        </div>

        <a-collapse v-model:activeKey="activeKey" accordion expand-icon-position="end">
            <a-collapse-panel key="chains" class="filter-panel">
                <template #header>
                    <div class="filter-panel-header">
                        Chain
                        <a-badge
                            v-if="filters.chains.length > 0"
                            :count="filters.chains.length"
                            class="filters-badge-count"
                            color="#969696"
                        />
                    </div>
                </template>
                <a-checkbox-group v-model:value="filters.chains" name="checkboxgroup" :options="chainsOptions">
                    <template #label="{ label, logo }">
                        <div class="filters-checkbox-with-icon">
                            <TokenIcon
                                :token="{
                                    logo,
                                    symbol: label,
                                }"
                                width="16"
                                height="16"
                            />

                            <span>{{ label }}</span>
                        </div>
                    </template>
                </a-checkbox-group>
            </a-collapse-panel>
            <a-collapse-panel key="protocol" class="filter-panel">
                <template #header>
                    <div class="filter-panel-header">
                        Protocol
                        <a-badge
                            v-if="filters.protocols.length > 0"
                            :count="filters.protocols.length"
                            class="filters-badge-count"
                            color="#969696"
                        />
                    </div>
                </template>

                <a-checkbox-group v-model:value="filters.protocols" name="checkboxgroup" :options="protocolsOptions">
                    <template #label="{ label, logo }">
                        <div class="filters-checkbox-with-icon">
                            <TokenIcon
                                :token="{
                                    logo,
                                    symbol: label,
                                }"
                                width="16"
                                height="16"
                            />

                            <span>{{ label }}</span>
                        </div>
                    </template>
                </a-checkbox-group>
            </a-collapse-panel>
            <a-collapse-panel key="categories" class="filter-panel">
                <template #header>
                    <div class="filter-panel-header">
                        Yield Type
                        <a-badge
                            v-if="filters.categories.length > 0"
                            :count="filters.categories.length"
                            class="filters-badge-count"
                            color="#969696"
                        />
                    </div>
                </template>
                <a-checkbox-group v-model:value="filters.categories" name="checkboxgroup" :options="categoriesOptions" />
            </a-collapse-panel>
            <!-- <a-collapse-panel key="tvl" header="TVL Range" class="filter-panel">
                <a-input-number v-model:value="filters.tvl.min" />
                <a-input-number v-model:value="filters.tvl.max" />
            </a-collapse-panel>
            <a-collapse-panel key="apy" header="APY Range" class="filter-panel">
                <a-input-number v-model:value="filters.apy.min" />
                <a-input-number v-model:value="filters.apy.max" />
            </a-collapse-panel> -->
        </a-collapse>
    </a-modal>
</template>
<script>
import { computed, ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { orderBy } from 'lodash';

import TokenIcon from '@/components/ui/Tokens/TokenIcon';

export default {
    name: 'SettingsModal',
    components: {},
    setup() {
        const store = useStore();
        const route = useRoute();
        const activeKey = ref(['chains']);

        const isModalOpen = computed({
            get: () => store.getters['app/modal']('filtersModal'),
            set: (value) => store.dispatch('app/toggleModal', 'filtersModal'),
        });

        const filters = computed({
            get: () => store.getters['stakeAssets/getFilters'],
            set: (value) => store.dispatch('stakeAssets/setFilters', value),
        });

        const totalCountOfFilters = computed(() => store.getters['stakeAssets/getTotalCountOfFilters']);

        const chainsOptions = computed(() => {
            const chains = store.getters['stakeAssets/getChains'];

            const options = chains.map((chain) => ({
                logo: chain.logo,
                label: chain.name,
                value: chain.net,
            }));

            return orderBy(options, ['label'], ['asc']);
        });
        const protocolsOptions = computed(() => {
            const protocols = store.getters['stakeAssets/getProtocols'];

            const options = protocols.map((protocol) => ({
                logo: protocol.logo,
                label: protocol.name,
                value: protocol.id,
            }));

            return orderBy(options, ['label'], ['asc']);
        });

        const categoriesOptions = computed(() => {
            const categories = store.getters['stakeAssets/getCategories'];

            const options = categories.map((category) => ({
                label: category.name,
                value: category.id,
            }));

            return orderBy(options, ['label'], ['asc']);
        });

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
            activeKey,

            isModalOpen,

            filters,

            totalCountOfFilters,

            chainsOptions,
            protocolsOptions,
            categoriesOptions,

            resetFilters,
        };
    },
};
</script>
