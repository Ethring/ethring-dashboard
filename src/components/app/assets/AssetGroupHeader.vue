<template>
    <div class="assets-group-container">
        <div class="assets-group-info">
            <div class="assets-group-icon-container">
                <component v-if="icon" :is="icon" class="asset-group-icon-svg" />
                <a-image
                    v-else-if="logoURI && !icon && !showImagePlaceholder"
                    :preview="false"
                    class="assets-group-icon-img"
                    :src="logoURI"
                    @error="showImagePlaceholder = true"
                />
                <a-avatar v-else class="assets-group-icon-placeholder" :size="32">{{ title.slice(0, 3) }}</a-avatar>
            </div>

            <div class="assets-group-title">
                {{ title }}
            </div>
        </div>

        <div class="assets-group-extra">
            <div class="assets-group-balance">
                <span class="assets-group-balance-currency">$</span>
                <NumberTooltip v-if="showBalance" :value="totalBalance" class="assets-group-balance-amount" />
                <span v-else class="assets-group-balance-amount">****</span>
            </div>

            <div class="assets-group-rewards" v-if="showRewards">
                <span class="assets-group-rewards-title">{{ $t('tokenOperations.rewards') }}:</span>
                <div class="assets-group-rewards-block">
                    <span class="assets-group-rewards-currency">$</span>
                    <NumberTooltip v-if="showBalance" :value="reward" class="assets-group-rewards-amount" />
                    <span v-else class="assets-group-rewards-amount">****</span>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import NumberTooltip from '@/components/ui/NumberTooltip';

import TokensIcon from '@/assets/icons/dashboard/wallet.svg';
import NftsIcon from '@/assets/icons/dashboard/nfts.svg';

import { formatNumber } from '@/helpers/prettyNumber';

export default {
    name: 'AssetGroupHeader',
    props: {
        title: {
            required: true,
        },
        value: {
            required: false,
        },
        reward: {
            type: Number,
            default: 0,
        },
        showRewards: {
            type: Boolean,
            default: false,
        },
        totalBalance: {
            type: Number,
            default: 0,
        },
        healthRate: {
            type: Number,
            default: 0,
        },
        icon: {
            type: String,
            default: '',
        },
        logoURI: {
            type: String,
            default: '',
        },
    },
    components: {
        TokensIcon,
        NftsIcon,
        NumberTooltip,
    },
    setup() {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        // const getPercentageQuarter = (val) => {
        //     if (val > 75) {
        //         return 100;
        //     } else if (val > 50) {
        //         return 75;
        //     } else if (val > 25) {
        //         return 50;
        //     }
        //     return 25;
        // };

        return {
            showBalance,
            formatNumber,
            showImagePlaceholder: ref(false),

            // getPercentageQuarter,
        };
    },
};
</script>
