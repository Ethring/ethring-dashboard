<template>
    <div
        class="select-token-option"
        data-qa="token-record"
        :data-key="record?.id || record?.address"
        :class="{ selected: record.selected }"
    >
        <div class="info-container">
            <TokenIcon width="32" height="32" :token="record" class="logo" />

            <div class="label-container">
                <div class="top">{{ label }}</div>

                <div class="bottom" v-if="displayName">
                    <div class="sub-text-container">
                        <div class="sub-text" :class="{ showHover: record.address && tokenExplorerLink }">
                            <template v-if="displayName.length > 25">
                                <a-tooltip>
                                    <template #title>{{ displayName }}</template>
                                    {{ displayName.slice(0, 6) + '...' + displayName.slice(-4) }}
                                </a-tooltip>
                            </template>
                            <template v-else>
                                {{ displayName }}
                            </template>
                        </div>

                        <a-typography-link
                            v-if="record.address && tokenExplorerLink"
                            :href="tokenExplorerLink"
                            target="_blank"
                            class="link"
                        >
                            ({{ displayAddress }})
                            <ExternalLinkIcon />
                        </a-typography-link>
                    </div>
                </div>
            </div>
        </div>

        <div class="stat-container" v-if="record?.balance && record?.balanceUsd">
            <Amount type="currency" :value="record?.balance" :symbol="record?.symbol" :decimals="3" />
            <Amount type="usd" :value="record?.balanceUsd" symbol="$" :decimals="3" />
        </div>
    </div>
</template>
<script>
import { computed, inject } from 'vue';

import Amount from '../../app/Amount.vue';
import TokenIcon from '@/components/ui/Tokens/TokenIcon';
import ExternalLinkIcon from '@/assets/icons/app/external-link.svg';

export default {
    name: 'SelectOption',
    components: {
        Amount,
        TokenIcon,
        ExternalLinkIcon,
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
    emits: ['select-token'],
    setup(props, { emit }) {
        const useAdapter = inject('useAdapter');

        const { getTokenExplorerLink } = useAdapter();

        const displayName = computed(() => {
            const { name = '', symbol = '', ecosystem = '' } = props.record || {};

            if (props.type === 'network') {
                return ecosystem || '';
            }

            return name || symbol || '';
        });

        const sendTokenInfo = (e, token) => {
            const { target = null } = e || {};

            if (!target.href) {
                return emit('select-token', token);
            }
        };

        const tokenExplorerLink = computed(() => getTokenExplorerLink(props.record?.address, props.record.chain));

        const displayAddress = computed(() => {
            if (props.record?.address?.length < 10) {
                return props.record?.address;
            }

            return props.record?.address?.slice(0, 8) + '...' + props.record?.address?.slice(-4);
        });

        return {
            displayName,
            displayAddress,

            sendTokenInfo,

            // helpers
            tokenExplorerLink,
            getTokenExplorerLink,
        };
    },
};
</script>
