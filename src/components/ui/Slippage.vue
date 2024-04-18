<template>
    <a-dropdown
        v-model:open="isOpen"
        :arrow="{ pointAtCenter: true }"
        :disabled="isTransactionSigning || isQuoteLoading"
        trigger="click"
        class="slippage"
        placement="bottom"
        @open-change="handleOpenChange"
    >
        <div class="slippage__icon-container" data-qa="slippage-icon">
            <a-badge :dot="isShowWarningDot" status="warning">
                <SettingsIcon class="slippage__icon" />
            </a-badge>
        </div>

        <template #overlay>
            <a-menu class="slippage__control">
                <a-row align="middle">
                    <span class="label">{{ $t('slippage.maxSlippage') }}</span>
                    <a-tooltip placement="top" :title="$t('slippage.description')">
                        <InfoIcon />
                    </a-tooltip>
                </a-row>
                <a-row :wrap="false" :style="{ marginTop: '10px' }">
                    <a-radio-group v-model:value="activeOption" button-style="solid" class="slippage__control-options">
                        <a-row :wrap="false">
                            <a-radio-button value="auto" @click="() => (slippage = 1)">Auto</a-radio-button>
                            <a-radio-button value="custom" data-qa="slippage-custom">Custom</a-radio-button>
                        </a-row>
                    </a-radio-group>
                    <div class="slippage__input" data-qa="slippage-custom-input">
                        <a-input-number
                            addon-after="%"
                            v-model:value="slippage"
                            :controls="false"
                            :disabled="isInputDisabled"
                            :min="SLIPPAGE.MIN - 1"
                            :max="SLIPPAGE.MAX + 1"
                            @change="handleOnChangeSlippage"
                        />
                    </div>
                </a-row>
                <a-row v-show="warningText" class="slippage__warning" :wrap="false" align="center">
                    <WarningIcon />
                    <span>{{ warningText }}</span>
                </a-row>
            </a-menu>
        </template>
    </a-dropdown>
</template>
<script>
import { ref, computed, onUnmounted, onMounted } from 'vue';

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
        WarningIcon,
    },
    setup() {
        // Constants
        const SLIPPAGE_TYPE = {
            AUTO: 'auto',
            CUSTOM: 'custom',
        };

        // Min & Max slippage values
        const DEFAULT_SLIPPAGE = 1;
        const MAX_SLIPPAGE = 20;
        const MIN_SLIPPAGE = 0.1;

        const store = useStore();

        const { t } = useI18n();

        // ======================================================================
        // * Store Computed
        // ======================================================================
        const slippage = computed({
            get: () => store.getters['tokenOps/slippage'],
            set: (value) => store.dispatch('tokenOps/setSlippage', value),
        });

        const isQuoteLoading = computed(() => store.getters['bridgeDexAPI/getLoaderState']('quote'));

        const isTransactionSigning = computed(() => store.getters['txManager/isTransactionSigning']);

        // ======================================================================
        // * Refs
        // ======================================================================

        // Dropdown open state
        const isOpen = ref(false);

        // Active option (Auto or Custom)
        const activeOption = ref(SLIPPAGE_TYPE.AUTO);

        // ======================================================================
        // * Computed
        // ======================================================================

        // Warning text
        const warningText = computed(() => {
            if (activeOption.value === SLIPPAGE_TYPE.AUTO) return null;

            const WARNINGS = {
                MORE_20: 'slippage.warningRange', // 20% or more
                MORE_2: 'slippage.warningMoreThan2', // 2% or more
                LESS_01: 'slippage.warningLess01', // Less than 0.1%
            };

            switch (true) {
                // If the slippage is not set, show the warning
                case !slippage.value:
                    return t(WARNINGS.MORE_20);

                // If the slippage is greater than 20, show the warning
                case slippage.value > MAX_SLIPPAGE:
                    return t(WARNINGS.MORE_20);

                // If the slippage is greater than 2, show the warning
                case slippage.value > 2:
                    return t(WARNINGS.MORE_2);

                // If the slippage is less than MIN_SLIPPAGE, show the warning
                case slippage.value < MIN_SLIPPAGE:
                    return t(WARNINGS.LESS_01);

                // If the slippage is between 0.1 and 2, remove the warning
                default:
                    return null;
            }
        });

        // Check if the input should be disabled based on the active option value (Auto or Custom)
        // ? auto => true, custom => false
        const isInputDisabled = computed(() => activeOption.value === SLIPPAGE_TYPE.AUTO);

        // Check if the warning dot should be shown based on the slippage & active option value
        const isShowWarningDot = computed(() => {
            if (activeOption.value === SLIPPAGE_TYPE.AUTO || isOpen.value) return false;

            if (warningText.value) return true;

            return false;
        });

        // ======================================================================
        // * Methods
        // ======================================================================

        // Set the default slippage value
        const defaultSlippage = () => {
            // If the slippage is greater than 20, set it to 20 and show the warning;
            if (slippage.value > 20) slippage.value = 20;
            else if (!slippage.value) slippage.value = DEFAULT_SLIPPAGE;

            checkAndSetActiveOption();
        };

        // Check and set the active option based on the slippage value
        const checkAndSetActiveOption = () =>
            (activeOption.value = `${slippage.value}` === `${DEFAULT_SLIPPAGE}` ? SLIPPAGE_TYPE.AUTO : SLIPPAGE_TYPE.CUSTOM);

        // Format the slippage value and set it
        const handleOnChangeSlippage = (value = '') => {
            slippage.value = formatInputNumber(value);
        };

        // ======================================================================
        // * Event Handlers
        // ======================================================================

        // Handle the dropdown open change
        const handleOpenChange = (open) => {
            isOpen.value = open;

            // If the dropdown is opened/closed, and the slippage is not set, set default slippage
            return defaultSlippage();
        };

        // ======================================================================
        // * Mounted
        // ======================================================================
        onMounted(() => {
            // Set the default slippage value
            return defaultSlippage();
        });

        onUnmounted(() => {
            // Reset the slippage value
            slippage.value = DEFAULT_SLIPPAGE;
        });

        return {
            isOpen,

            isTransactionSigning,
            isQuoteLoading,

            slippage,
            activeOption,
            warningText,
            isInputDisabled,
            isShowWarningDot,

            handleOpenChange,
            handleOnChangeSlippage,

            SLIPPAGE: {
                MAX: MAX_SLIPPAGE,
                MIN: MIN_SLIPPAGE,
            },
        };
    },
};
</script>
