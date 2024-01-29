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
                <Amount :value="totalBalance || 0" :decimals="3" type="usd" symbol="$" class="assets-group-balance-amount" />
            </div>

            <div class="assets-group-rewards" v-if="showRewards">
                <span class="assets-group-rewards-title">{{ $t('tokenOperations.rewards') }}:</span>
                <div class="assets-group-rewards-block">
                    <Amount :value="reward || 0" :decimals="3" type="usd" symbol="$" class="assets-group-rewards-amount" />
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import Amount from '@/components/app/Amount';

import TokensIcon from '@/assets/icons/dashboard/wallet.svg';
import NftsIcon from '@/assets/icons/dashboard/nfts.svg';

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
        Amount,
    },

    data() {
        return {
            showImagePlaceholder: false,
        };
    },
};
</script>
