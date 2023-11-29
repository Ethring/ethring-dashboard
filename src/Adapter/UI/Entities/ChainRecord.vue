<template>
    <div class="chain-record">
        <div class="chain-record-item">
            <div class="chain-record__logo-container">
                <img :alt="chain.name || 'chain-logo'" :src="chain.logo" />
            </div>
            <div class="chain-info">
                <div class="chain-record__name">
                    {{ chain.name }}
                </div>
                <a-tooltip placement="right" :title="copied ? $t('adapter.copiedAddressTooltip') : $t('adapter.copyAddressTooltip')">
                    <span class="chain-record__address" @click="copy(address)">
                        {{ cutAddress(address) }}
                    </span>
                </a-tooltip>
                <div v-if="chains.length" class="chains-list">
                    <div v-for="chain in chains" :key="chain" class="chain-record__logo-container">
                        <img :src="chain.logo" alt="chain-logo" />
                    </div>
                </div>
            </div>
        </div>

        <div class="chain-record__actions">
            <a-typography-paragraph :copyable="{ text: address, tooltip: false }" class="copy" />
            <div class="chain-record__divider">|</div>
            <a-popover :overlay-inner-style="{ padding: 0 }">
                <template #content>
                    <a-qrcode error-level="H" :value="address" :bordered="false" icon="/zomet-logo.svg" />
                </template>
                <QrcodeOutlined />
            </a-popover>
        </div>
    </div>
</template>
<script>
import { useClipboard } from '@vueuse/core';

import { cutAddress } from '@/helpers/utils';

import { QrcodeOutlined } from '@ant-design/icons-vue';

export default {
    name: 'ChainRecord',
    components: {
        QrcodeOutlined,
    },
    props: {
        chain: {
            type: Object,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        chains: {
            type: Array,
            required: true,
        },
    },
    setup() {
        const { copy, copied } = useClipboard();

        return {
            copy,
            copied,
        };
    },
    methods: {
        cutAddress,
    },
};
</script>
<style lang="scss" scoped>
.chain {
    &-record {
        @include pageFlexRow;
        justify-content: space-between;

        width: 100%;
        border: 1px solid var(--#{$prefix}adapter-ecosystem-border-color);
        border-radius: 8px;

        padding: 8px 16px;
        margin-bottom: 8px;

        &-item {
            @include pageFlexRow;
        }

        &__logo-container {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            overflow: hidden;
            margin-right: 10px;

            @include pageFlexRow;
            justify-content: center;

            img {
                width: 100%;
                height: 100%;
            }
        }

        &__name {
            font-size: var(--#{$prefix}default-fs);
            font-weight: 600;
            line-height: 20px;
            color: var(--#{$prefix}primary-text);
        }

        &__address {
            color: var(--#{$prefix}sub-text);
            font-size: var(--#{$prefix}small-sm-fs);
            font-weight: 400;

            cursor: pointer;
        }

        &__actions {
            @include pageFlexRow;

            gap: 16px;

            & > div {
                margin: 0 !important;
            }
        }

        &__divider {
            color: var(--#{$prefix}adapter-more-option);
        }
    }
}

.chains-list {
    @include pageFlexRow;
    margin-top: 4px;

    .chain-record__logo-container {
        width: 16px;
        height: 16px;
    }
}
</style>
