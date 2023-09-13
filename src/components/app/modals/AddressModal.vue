<template>
    <teleport to="body">
        <Modal :title="$t('modals.addressModal.title')" width="314px" height="460px" @close="$emit('close')">
            <div class="address-modal">
                <div class="address-modal__qr">
                    <qrcode-vue id="qr" :value="walletAddress" :size="247" level="H" :margin="5" background="#C9E0E0" />
                </div>
                <div class="address-modal__copy">
                    <div class="address">
                        {{ cutAddress(walletAddress) }}
                    </div>
                    <div class="line" />
                    <div class="icon">
                        <CopySvg v-show="!copied" @click="copyAddress" />
                    </div>
                </div>
            </div>
        </Modal>
    </teleport>
</template>
<script>
import { ref } from 'vue';
import QrcodeVue from 'qrcode.vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import Modal from '@/components/app/Modal';

import CopySvg from '@/assets/icons/app/copy.svg';

import { cutAddress, copyToClipboard } from '@/helpers/utils';

export default {
    name: 'AddressModal',
    components: {
        Modal,
        CopySvg,
        QrcodeVue,
    },
    emits: ['close'],
    setup() {
        const copied = ref(false);

        const { walletAddress } = useAdapter();

        const copyAddress = () => {
            copied.value = true;
            copyToClipboard(walletAddress?.value);
            setTimeout(() => (copied.value = false), 500);
        };

        return {
            copied,
            cutAddress,
            walletAddress,

            copyAddress,
        };
    },
};
</script>
<style lang="scss" scoped>
.address-modal {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &__qr {
        width: 250px;
        height: 250px;
        margin-top: -10px;
        border-radius: 6px;
        background: var(--#{$prefix}secondary-background);

        #qr {
            border-radius: 6px;
        }
    }

    &__copy {
        display: flex;
        align-items: center;

        width: 250px;
        height: 56px;

        margin-top: 16px;
        padding: 0 16px;
        border-radius: 6px;
        background: var(--#{$prefix}secondary-background);
        box-sizing: border-box;
        transition: all 0.3s ease-in-out;

        .address {
            color: var(--#{$prefix}primary-text);
            font-size: var(--#{$prefix}default-fs);
            font-weight: 600;
            width: 84%;
        }

        .line {
            width: 1px;
            height: 30px;

            margin: 0 11px;
            background: var(--#{$prefix}icon-color);
        }

        .icon {
            display: flex;
            justify-content: center;
            align-items: center;

            width: 14px;
            height: 18px;
            position: relative;
        }

        svg {
            transition: all 0.3s ease-in-out;
            position: absolute;
            cursor: pointer;

            &:hover {
                opacity: 0.7;
            }
        }
    }
}
</style>
