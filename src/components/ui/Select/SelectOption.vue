<template>
    <div
        v-if="record && !record?.id.includes(undefined)"
        class="select-token-option"
        data-qa="token-record"
        :data-key="record?.id || record?.address"
        :class="{ selected: record.selected }"
    >
        <div class="info-container">
            <TokenIcon width="20" height="20" :token="record" class="logo" />

            <div class="label-container">
                <div class="row" :class="{ showHover: record.address && tokenExplorerLink }">
                    <span class="top">{{ label }}</span>
                    <a-tooltip>
                        <template v-if="record?.verified" #title> {{ $t('tokenOperations.verifiedToken') }} </template>
                        <CheckIcon v-if="record?.verified" class="check-icon"
                    /></a-tooltip>
                </div>

                <div class="bottom">
                    <a-typography-link v-if="record.address && tokenExplorerLink" :href="tokenExplorerLink" target="_blank" class="link">
                        ({{ displayAddress }})
                        <ExternalLinkIcon class="link-icon" />
                    </a-typography-link>
                </div>
            </div>
        </div>

        <div v-if="record?.balance || record?.balanceUsd" class="stat-container">
            <Amount
                type="currency"
                :value="record?.balance"
                :symbol="record?.symbol"
                :decimals="record?.id?.includes('pools') ? record?.decimals : 3"
            />
            <Amount type="usd" :value="record?.balanceUsd" symbol="$" :decimals="3" />
        </div>
    </div>
</template>
<script>
import { computed, inject } from 'vue';

import Amount from '../../app/Amount.vue';

import TokenIcon from '@/components/ui/Tokens/TokenIcon';
import CheckIcon from '@/assets/icons/module-icons/check.svg';
import ExternalLinkIcon from '@/assets/icons/module-icons/external-link.svg';

export default {
    name: 'SelectOption',
    components: {
        Amount,
        TokenIcon,
        ExternalLinkIcon,
        CheckIcon,
    },
    props: {
        type: {
            type: String,
            default: 'token',
            required: true,
        },
        label: {
            type: String,
            default: 'label',
            required: true,
        },
        record: {
            type: Object,
            required: true,
            default: () => ({
                name: '',
                symbol: '',
                address: '',
                chain: '',
                balance: 0,
                balanceUsd: 0,
            }),
        },
    },
    setup(props) {
        const useAdapter = inject('useAdapter');
        const { getTokenExplorerLink } = useAdapter();

        const tokenExplorerLink = computed(() => getTokenExplorerLink(props.record?.address, props.record.chain));

        const displayName = computed(() => {
            const { name = '', symbol = '', ecosystem = '' } = props.record || {};

            if (props.type === 'network') return ecosystem || '';

            return name || symbol || '';
        });

        const displayAddress = computed(() => {
            if (props.record?.address?.length < 10) return props.record?.address;

            return props.record?.address?.slice(0, 8) + '...' + props.record?.address?.slice(-4);
        });

        return {
            displayName,
            displayAddress,

            // helpers
            tokenExplorerLink,
            getTokenExplorerLink,
        };
    },
};
</script>
