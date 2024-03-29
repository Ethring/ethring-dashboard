<template>
    <a-dropdown v-model:open="isOpen" :arrow="{ pointAtCenter: true }" trigger="click" class="slippage"
        placement="bottom">
        <div class="slippage__icon" data-qa="slippage-icon">
            <SettingsIcon />
        </div>

        <template #overlay>
            <a-menu class="slippage__control">
                <a-row>
                    <span class="label">{{ $t('slippage.maxSlippage') }}</span>
                    <a-tooltip placement="top" :title="$t('slippage.description')">
                        <InfoIcon />
                    </a-tooltip>
                </a-row>
                <a-row :wrap="false" :style="{ marginTop: '10px' }">
                    <a-radio-group v-model:value="activeOption" button-style="solid" class="slippage__control-options">
                        <a-row :wrap="false">
                            <a-radio-button value="auto" @click="() => slippage = 1">Auto</a-radio-button>
                            <a-radio-button value="custom" data-qa="slippage-custom">Custom</a-radio-button>
                        </a-row>
                    </a-radio-group>
                    <div class="slippage__input" data-qa="slippage-custom-input">
                        <a-input v-model:value="slippage" :disabled="activeOption === 'auto'" suffix="%" />
                    </div>
                </a-row>
                <a-row v-if="warningText" class="slippage__warning" :wrap="false" align="center">
                    <WarningIcon />
                    <span>{{ warningText }}</span>
                </a-row>
            </a-menu>
        </template>
    </a-dropdown>
</template>
<script>
import { ref, computed, watch } from 'vue';

import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

// Icons
import SettingsIcon from '@/assets/icons/sidebar/settings.svg';
import InfoIcon from '@/assets/icons/platform-icons/info.svg';
import WarningIcon from '@/assets/icons/form-icons/warning.svg';

import { formatInputNumber } from '@/shared/utils/input';

export default {
    name: 'Slippage',
    components: {
        SettingsIcon,
        InfoIcon,
        WarningIcon
    },
    setup() {
        const warningText = ref(null);
        const isOpen = ref(false);

        const store = useStore();

        const { t } = useI18n();

        const slippage = computed({
            get: () => store.getters['tokenOps/slippage'],
            set: (value) => store.dispatch('tokenOps/setSlippage', value),
        });

        const activeOption = ref(slippage.value === 1 ? 'auto' : 'custom');

        watch(() => slippage.value, (val) => {
            slippage.value = formatInputNumber(val)

            if (slippage.value >= 50) {
                slippage.value = 20;
            }

            if (slippage.value > 20) {
                warningText.value = t('slippage.limitWarning1');
            } else if (slippage.value > 2) {
                warningText.value = t('slippage.limitWarning3');
            } else if (slippage.value < 0.1) {
                warningText.value = t('slippage.limitWarning2');
            } else {
                warningText.value = null;
            }
        })

        watch(isOpen, () => {
            if (!slippage.value && isOpen.value) {
                slippage.value = 1;
            }
        })

        return {
            isOpen,
            slippage,
            activeOption,
            warningText
        }
    }
};
</script>
