<template>
    <div
        class="token-record"
        :data-key="record?.id || record?.address"
        @click="(event) => sendTokenInfo(event, record)"
        :class="{ selected: record.selected }"
    >
        <div class="network">
            <TokenIcon width="24" height="24" :token="record" class="logo" />

            <div class="info">
                <div class="top">
                    {{ record.symbol }}
                </div>

                <div class="bottom">
                    <p class="name">
                        <template v-if="displayName.length > 25">
                            <a-tooltip>
                                <template #title>{{ displayName }}</template>
                                {{ displayName.slice(0, 6) + '...' + displayName.slice(-4) }}
                            </a-tooltip>
                        </template>
                        <template v-else>
                            {{ displayName }}
                        </template>
                    </p>
                    <a-typography-link v-if="record.address && tokenExplorerLink" :href="tokenExplorerLink" target="_blank" class="link">
                        ({{ record?.address?.slice(0, 6) + '...' + record?.address?.slice(-4) }})
                        <ExternalLinkIcon />
                    </a-typography-link>
                </div>
            </div>
        </div>

        <div class="balance">
            <p class="in-currency" v-if="record?.balance">
                <NumberTooltip :value="record?.balance" decimals="3" />
                <span class="symbol"> {{ record?.symbol }}</span>
            </p>

            <p class="in-usd" v-if="record?.balanceUsd">
                <span class="symbol">$</span>
                <NumberTooltip :value="record?.balanceUsd" />
            </p>
        </div>
    </div>
</template>
<script>
import { computed } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import TokenIcon from '@/components/ui/TokenIcon';
import NumberTooltip from '@/components/ui/NumberTooltip';

import ExternalLinkIcon from '@/assets/icons/app/external-link.svg';

export default {
    name: 'TokenRecord',
    components: {
        TokenIcon,
        ExternalLinkIcon,
        NumberTooltip,
    },
    props: {
        record: {
            type: Object,
            required: true,
        },
    },
    emits: ['select-token'],
    setup(props, { emit }) {
        const { getTokenExplorerLink } = useAdapter();

        const displayName = computed(() => {
            const { name = '', symbol = '' } = props.record || {};

            return name || symbol || '';
        });

        const sendTokenInfo = (e, token) => {
            const { target = null } = e || {};

            if (!target.href) {
                return emit('select-token', token);
            }
        };

        const tokenExplorerLink = computed(() => getTokenExplorerLink(props.record?.address, props.record.chain));

        return {
            displayName,
            sendTokenInfo,

            // helpers
            tokenExplorerLink,
            getTokenExplorerLink,
        };
    },
};
</script>
<style lang="scss" scoped>
.token-record {
    display: flex;
    align-items: center;
    justify-content: space-between;

    border: 1px solid var(--#{$prefix}border-secondary-color);

    padding: 12px 16px;

    border-radius: 16px;

    &.selected {
        border: 1px solid var(--zmt-banner-logo-color);
        background-color: var(--zmt-icon-secondary-bg-color);
    }

    &:not(:last-child) {
        margin-bottom: 8px;
    }

    &:not(.selected):hover {
        border-color: var(--#{$prefix}sub-text);
        background-color: var(--#{$prefix}select-bg-color);
    }

    cursor: pointer;
    .network {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .info {
        display: flex;
        flex-direction: column;
        justify-content: center;

        .top {
            font-weight: 500;
            font-size: var(--#{$prefix}h6-fs);
            text-transform: uppercase;
            color: var(--#{$prefix}primary-text);
        }

        .top,
        .bottom {
            height: 18px;
        }

        .bottom {
            margin-top: 4px;

            display: flex;
            align-items: center;

            .name {
                font-style: normal;
                font-weight: 400;
                font-size: var(--#{$prefix}small-lg-fs);
                color: var(--#{$prefix}sub-text);
                margin-right: 8px;
            }

            .link {
                font-style: normal;
                font-weight: 400;
                font-size: var(--#{$prefix}small-lg-fs);

                color: var(--#{$prefix}sub-text);

                display: flex;
                align-items: center;

                svg {
                    width: 18px;
                    height: 18px;
                    margin-left: 4px;
                    fill: var(--#{$prefix}sub-text);

                    transition: 0.2s;
                }

                &:hover {
                    color: var(--#{$prefix}primary-text);

                    svg {
                        fill: var(--#{$prefix}primary-text);
                    }
                }

                &::before {
                    content: '\2022';
                    margin-right: 4px;

                    color: var(--#{$prefix}checkbox-text);
                }
            }
        }
    }

    .balance {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;

        .in-currency {
            font-weight: 500;
            font-size: var(--#{$prefix}default-fs);
            color: var(--#{$prefix}primary-text);
            margin-right: 2px;
        }

        .in-usd {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
            margin-left: 2px;
            color: var(--#{$prefix}mute-text);
        }

        span.symbol {
            font-size: var(--#{$prefix}small-sm-fs);
            color: var(--#{$prefix}mute-text);
            margin-left: 2px;
        }

        p:not(:last-child) {
            margin-bottom: 4px;
        }
    }

    .logo {
        width: 32px;
        height: 32px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;
        margin-right: 12px;
    }
}
</style>
