<template>
    <div class="assets-group-container">
        <div class="assets-group-info">
            <div class="assets-group-icon-container" :class="{ border: icon }">
                <component :is="icon" v-if="icon" class="asset-group-icon-svg" />
                <TokenIcon
                    v-if="!icon"
                    :width="32"
                    :height="32"
                    :token="{ symbol: title.slice(0, 3), logo: logoURI }"
                    class="assets-group-icon-img"
                />
            </div>

            <div class="assets-group-title">
                {{ title }}
            </div>
        </div>

        <div class="assets-group-extra">
            <div class="assets-group-balance">
                <Amount :value="totalBalance || 0" :decimals="3" type="usd" symbol="$" class="assets-group-balance-amount" />
            </div>

            <div v-if="showRewards" class="assets-group-rewards">
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

import TokensIcon from '@/assets/icons/dashboard/token-group.svg';
import NftsIcon from '@/assets/icons/dashboard/nfts.svg';

export default {
    name: 'AssetGroupHeader',
    components: {
        TokensIcon,
        NftsIcon,
        Amount,
    },
    props: {
        title: {
            type: String,
            required: true,
            default: '',
        },
        value: {
            type: [String, Number],
            required: false,
            default: 0,
        },
        reward: {
            type: [String, Number],
            default: 0,
        },
        showRewards: {
            type: Boolean,
            default: false,
        },
        totalBalance: {
            type: [String, Number],
            default: 0,
        },
        healthRate: {
            type: [String, Number],
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
    emits: ['click'],
    data() {
        return {
            showImagePlaceholder: false,
        };
    },
};
</script>
