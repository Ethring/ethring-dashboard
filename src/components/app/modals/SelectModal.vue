<template>
    <a-modal
        v-model:open="isModalOpen"
        centered
        :footer="null"
        :title="$t(modalTitle)"
        :after-close="handleAfterClose"
        class="select-modal"
    >
        <div data-qa="select-record-modal">
            <div v-if="type === 'token'" class="select-record__chain-list">
                <div
                    v-for="chain in chains"
                    :key="chain.id"
                    class="select-record__chain"
                    :class="{
                        'select-record__chain--selected': network?.id === chain.id,
                    }"
                    @click="handleOnSelectNetwork(chain)"
                >
                    <TokenIcon :key="chain.id" :token="chain" width="24" height="24" />
                </div>
            </div>
            <a-form>
                <SearchInput
                    :placeholder="$t(inputPlaceholder)"
                    :value="searchValue"
                    class="select-modal-search"
                    @on-change="handleOnFilterNetworks"
                />
            </a-form>

            <div v-if="!isLoadingTokenList" ref="scrollComponent" class="select-modal-list-container" @scroll="handleScroll">
                <SelectOption
                    v-for="option in optionList"
                    :key="option"
                    :record="option"
                    :type="type"
                    :label="type === 'network' ? option?.name : option?.symbol"
                    @click="(event) => handleOnSelect(event, option)"
                />

                <!-- <div v-if="isLoadMore" class="select-modal-load-more">
                    <UiButton :title="$t('tokenOperations.loadMore')" @click="handleLoadMore" />
                </div> -->

                <a-empty
                    v-if="isModalOpen && !isLoadingTokenList && !optionList.length"
                    class="select-modal-empty"
                    :description="$t('dashboard.notFound')"
                >
                    <template #image>
                        <NotFoundIcon />
                    </template>
                </a-empty>
            </div>
            <div v-else class="select-modal__skeleton">
                <a-space v-for="n in 5" :key="n" class="select-token-option">
                    <div>
                        <a-skeleton-avatar active class="avatar-skeleton" />
                        <a-skeleton-input active size="small" />
                    </div>
                    <a-skeleton-input active size="small" />
                </a-space>
            </div>
        </div>
    </a-modal>
</template>
<script>
import { computed, ref, onUpdated, nextTick } from 'vue';
import { useStore } from 'vuex';
import useSelectModal from '@/compositions/useSelectModal';

import SearchInput from '@/components/ui/SearchInput.vue';
import SelectOption from '@/components/ui/Select/SelectOption.vue';

import NotFoundIcon from '@/assets/icons/form-icons/not-found.svg';
import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

export default {
    name: 'SelectModal',
    components: {
        SearchInput,
        SelectOption,

        NotFoundIcon,
    },
    setup() {
        const MODAL_TITLES = {
            network: 'tokenOperations.selectNetwork',
            token: 'tokenOperations.selectChainAndToken',
        };

        const PLACEHOLDERS = {
            network: 'tokenOperations.searchNetwork',
            token: 'tokenOperations.searchToken',
        };

        const scrollComponent = ref(null);

        const store = useStore();

        const selectModal = computed(() => store.getters['app/selectModal']);
        const type = computed(() => selectModal.value.type);
        const module = computed(() => selectModal.value.module);

        const isModalOpen = computed({
            get: () => selectModal.value.isOpen,
            set: () => store.dispatch('app/toggleSelectModal', { type: type.value, module: module.value }),
        });

        const isLoadingTokenList = computed(() => store.getters['app/isLoadingTokenList']);

        const {
            // Loading
            isLoadMore,

            // Variables
            searchValue,
            options,
            chains,
            selectedSrcNetwork,
            selectedDstNetwork,

            // Methods
            handleOnSelectNetwork,
            handleOnSelect,
            handleLoadMore,
            handleOnFilterNetworks,
            handleAfterClose,
        } = useSelectModal(type);

        const modalTitle = computed(() => MODAL_TITLES[type.value] || 'tokenOperations.select');
        const inputPlaceholder = computed(() => PLACEHOLDERS[type.value] || 'dashboard.search');
        const optionList = computed(() => (isModalOpen.value ? options.value : []));

        const searchInput = ref(null);

        const network = computed(() => {
            if (selectModal.value.direction === 'SOURCE') return selectedSrcNetwork.value;
            return selectedDstNetwork.value;
        });

        onUpdated(() => {
            nextTick(() => {
                searchInput.value = document.querySelector('.select-modal-search input');
                const container = document.querySelector('.select-modal-list-container');
                if (container) container.scrollTop = '0';
                isModalOpen.value && searchInput.value?.focus();
            });
        });

        const handleScroll = () => {
            const modalContent = scrollComponent.value;

            if (modalContent.scrollHeight - modalContent.scrollTop <= modalContent.clientHeight + 10) handleLoadMore();
        };

        return {
            type,

            selectedSrcNetwork,
            chains,

            isModalOpen,
            isLoadMore,
            isLoadingTokenList,

            modalTitle,
            inputPlaceholder,

            searchValue,
            optionList,
            scrollComponent,
            network,

            handleOnSelectNetwork,
            handleScroll,
            handleLoadMore,
            handleOnSelect,
            handleAfterClose,
            handleOnFilterNetworks,
        };
    },
};
</script>
