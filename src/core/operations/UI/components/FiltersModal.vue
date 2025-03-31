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
                <a-slider v-model:value="filters.tvl" range :max="maxTVL" />
                <a-input-number v-model:value="filters.tvl[0]" :min="1" :max="maxTVL" />
                <a-input-number v-model:value="filters.tvl[1]" :min="1" :max="maxTVL" />
            </a-collapse-panel>
            <a-collapse-panel key="apy" header="APY Range" class="filter-panel">
                <a-slider v-model:value="filters.apy" range :max="500" />

                <a-input-number v-model:value="filters.apy[0]" :min="1" :max="500" />
                <a-input-number v-model:value="filters.apy[1]" :min="1" :max="500" />
            </a-collapse-panel> -->
        </a-collapse>
    </a-modal>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import TokenIcon from '@/components/ui/Tokens/TokenIcon';

import { useAssetFilters } from '@/compositions/useAssetFilters';

export default {
    name: 'SettingsModal',
    components: {},
    setup() {
        const store = useStore();
        const activeKey = ref(['chains']);

        const isModalOpen = computed({
            get: () => store.getters['app/modal']('filtersModal'),
            set: (value) => store.dispatch('app/toggleModal', 'filtersModal'),
        });

        const { filters, maxTVL, totalCountOfFilters, chainsOptions, protocolsOptions, categoriesOptions, resetFilters } =
            useAssetFilters();

        return {
            activeKey,

            isModalOpen,

            filters,

            maxTVL,

            totalCountOfFilters,

            chainsOptions,
            protocolsOptions,
            categoriesOptions,

            resetFilters,
        };
    },
};
</script>
