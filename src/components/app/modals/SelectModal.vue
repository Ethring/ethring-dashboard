<template>
    <a-modal v-model:open="isModalOpen" centered :footer="null" :title="$t(modalTitle)" :afterClose="handleAfterClose" class="select-modal">
        <div data-qa="select-record-modal">
            <a-form>
                <SearchInput
                    @onChange="handleOnFilterNetworks"
                    :placeholder="$t(inputPlaceholder)"
                    :value="searchValue"
                    class="select-modal-search"
                />
            </a-form>

            <div class="select-modal-list-container">
                <TransitionGroup tag="div" name="options" class="select-modal-list">
                    <SelectOption
                        v-for="option in optionList"
                        :key="option"
                        :record="option"
                        :type="type"
                        :label="type === 'network' ? option?.name : option?.symbol"
                        @click="(event) => handleOnSelect(event, option)"
                    />
                </TransitionGroup>

                <div v-if="isLoadMore" class="select-modal-load-more">
                    <Button :title="$t('tokenOperations.loadMore')" @click="handleLoadMore" />
                </div>

                <a-empty v-if="isModalOpen && !optionList.length" class="select-modal-empty" :description="$t('dashboard.notFound')">
                    <template #image>
                        <NotFoundIcon />
                    </template>
                </a-empty>
            </div>
        </div>
    </a-modal>
</template>
<script>
import { computed, inject, ref, onUpdated } from 'vue';
import { useStore } from 'vuex';

import Button from '../../ui/Button.vue';
import SearchInput from '../../ui/SearchInput.vue';
import SelectOption from '../../ui/Select/SelectOption.vue';

import NotFoundIcon from '@/assets/icons/form-icons/not-found.svg';
import { nextTick } from 'process';

export default {
    name: 'SelectModal',
    components: {
        Button,
        SearchInput,
        SelectOption,

        NotFoundIcon,
    },
    setup() {
        const MODAL_TITLES = {
            network: 'tokenOperations.selectNetwork',
            token: 'tokenOperations.selectToken',
        };

        const PLACEHOLDERS = {
            network: 'tokenOperations.searchNetwork',
            token: 'tokenOperations.searchToken',
        };

        const store = useStore();
        const useSelectModal = inject('useSelectModal');

        const selectModal = computed(() => store.getters['app/selectModal']);
        const type = computed(() => selectModal.value.type);
        const module = computed(() => selectModal.value.module);

        const isModalOpen = computed({
            get: () => selectModal.value.isOpen,
            set: () => store.dispatch('app/toggleSelectModal', { type: type.value, module: module.value }),
        });

        const {
            // Loading
            isLoadMore,

            // Variables
            searchValue,
            options,

            // Methods
            handleOnSelect,
            handleLoadMore,
            handleOnFilterNetworks,
            handleAfterClose,
        } = useSelectModal(type);

        const modalTitle = computed(() => MODAL_TITLES[type.value] || 'tokenOperations.select');
        const inputPlaceholder = computed(() => PLACEHOLDERS[type.value] || 'dashboard.search');
        const optionList = computed(() => (isModalOpen.value ? options.value : []));

        const searchInput = ref(null);

        onUpdated(() => {
            nextTick(() => {
                searchInput.value = document.querySelector('.select-modal-search input');
                document.querySelector('.select-modal-list-container').scrollTop = '0';
                isModalOpen.value && searchInput.value?.focus();
            });
        });

        return {
            type,

            isModalOpen,
            isLoadMore,

            modalTitle,
            inputPlaceholder,

            searchValue,
            optionList,

            handleLoadMore,
            handleOnSelect,
            handleAfterClose,
            handleOnFilterNetworks,
        };
    },
};
</script>
