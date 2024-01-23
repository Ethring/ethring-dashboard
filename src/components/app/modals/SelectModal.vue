<template>
    <a-modal v-model:open="isModalOpen" centered :footer="null" :title="$t(modalTitle)" :afterClose="handleAfterClose">
        <SearchInput
            class="search"
            @onChange="handleOnFilterNetworks"
            :placeholder="$t('tokenOperations.searchNetwork')"
            :value="searchValue"
        />

        <div class="select-modal-list">
            <SelectOption
                v-for="option in optionList"
                :key="option"
                :record="option"
                :type="type"
                :label="type === 'network' ? option?.name : option?.symbol"
                @click="handleOnSelect(option)"
            />

            <div v-if="isLoadMore" class="select-modal-load-more">
                <Button :title="$t('tokenOperations.loadMore')" @click="handleLoadMore" />
            </div>

            <a-empty v-if="isModalOpen && !optionList.length" />
        </div>
    </a-modal>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import Button from '../../ui/Button.vue';
import SearchInput from '../../ui/SearchInput.vue';
import SelectOption from '../../ui/Select/SelectOption.vue';

import useSelectModal from '../../../compositions/useSelectModal';

export default {
    name: 'SearchSelectToken',
    components: {
        Button,
        SearchInput,
        SelectOption,
    },
    setup() {
        const store = useStore();

        const selectModal = computed(() => store.getters['app/selectModal']);

        const isModalOpen = computed({
            get: () => selectModal.value.isOpen,
            set: () => store.dispatch('app/toggleSelectModal'),
        });

        const type = computed(() => selectModal.value.type);

        const { searchValue, options, isLoadMore, handleOnSelect, handleLoadMore, handleOnFilterNetworks, handleAfterClose } =
            useSelectModal(type);

        const modalTitle = computed(() => {
            if (type.value === 'network') {
                return 'tokenOperations.selectNetwork';
            }

            return 'tokenOperations.selectToken';
        });

        const optionList = computed(() => (isModalOpen.value ? options.value : []));

        return {
            type,

            isModalOpen,
            isLoadMore,

            modalTitle,
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
