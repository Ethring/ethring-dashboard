<template>
    <a-modal v-model:open="isModalOpen" centered :footer="null" :title="$t('sidebar.settings')" class="settings-modal select-modal">
        <a-input-number v-model:value="slippage" :controls="false" addon-after="%" :min="SLIPPAGE.MIN" :max="SLIPPAGE.MAX" />
    </a-modal>
</template>
<script>
import { computed, ref, onUpdated, nextTick, watch } from 'vue';
import { useStore } from 'vuex';

import { formatInputNumber } from '@/shared/utils/input';

export default {
    name: 'SettingsModal',
    components: {},
    setup() {
        const MIN_SLIPPAGE = 0.1;
        const MAX_SLIPPAGE = 20;

        const symbolForReplace = ref(null);

        const store = useStore();

        const isModalOpen = computed({
            get: () => store.getters['app/modal']('settingsModal'),
            set: (value) => store.dispatch('app/toggleModal', 'settingsModal'),
        });

        // ======================================================================
        // * Store Computed
        // ======================================================================
        const slippage = computed({
            get: () => store.getters['tokenOps/slippage'],
            set: (value) => store.dispatch('tokenOps/setSlippage', value),
        });

        const onKeyPressHandler = (e) => {
            if (e.code === 'Period' || e.code === 'Comma') symbolForReplace.value = e.key;
        };

        // Format the slippage value and set it
        watch(slippage, (val) => {
            console.log('val', val);
            if (symbolForReplace.value) val = val?.replace(symbolForReplace.value, '.');

            slippage.value = formatInputNumber(val);
        });

        return {
            isModalOpen,
            slippage,
            SLIPPAGE: {
                MAX: MAX_SLIPPAGE,
                MIN: MIN_SLIPPAGE,
            },
        };
    },
};
</script>
