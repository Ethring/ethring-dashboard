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
                        {{ address }}
                    </span>
                </a-tooltip>
            </div>
        </div>

        <div class="chain-record__actions">
            <a-tooltip placement="top" class="copy" :open="isTooltipOpen" trigger="click" :title="$t('adapter.copiedAddressTooltip')">
                <CopyIcon @click="copyAddress(address)" @mouseleave="() => (isTooltipOpen = false)" />
            </a-tooltip>
            <div class="chain-record__divider"></div>
            <a-popover :overlay-inner-style="{ padding: 0 }">
                <template #content>
                    <a-qrcode error-level="H" :value="address" :bordered="false" icon="/zomet-logo.svg" />
                </template>
                <QrcodeIcon />
            </a-popover>
        </div>
    </div>
</template>
<script>
import { ref } from 'vue';
import { useClipboard } from '@vueuse/core';

import QrcodeIcon from '@/assets/icons/dashboard/qr.svg';
import CopyIcon from '@/assets/icons/dashboard/copy.svg';

export default {
    name: 'ChainRecord',
    components: {
        QrcodeIcon,
        CopyIcon,
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
    },
    setup() {
        const { copy, copied } = useClipboard();
        const isTooltipOpen = ref(false);

        const copyAddress = (address) => {
            copy(address);
            isTooltipOpen.value = true;
        };
        return {
            copy,
            copied,
            copyAddress,
            isTooltipOpen,
        };
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

        padding: 8px 16px 8px 8px;
        margin-bottom: 16px;
        height: 56px;

        &-item {
            @include pageFlexRow;
        }

        &__logo-container {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
            margin-right: 8px;

            @include pageFlexRow;
            justify-content: center;

            img {
                width: 100%;
                height: 100%;
            }
        }

        &__name {
            font-size: var(--#{$prefix}h6-fs);
            font-weight: 600;
            line-height: 18px;
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

            gap: 8px;

            & > div {
                margin: 0 !important;
            }
        }

        &__divider {
            background-color: var(--#{$prefix}adapter-more-option);
            width: 1px;
            height: 30px;
        }

        .copy {
            cursor: pointer;
            outline: none !important;
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
