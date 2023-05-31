<template>
    <teleport to="body">
        <Modal :title="$t('modals.addressModal.title')" width="314px" height="460px" @close="$emit('close')">
            <div class="address-modal">
                <div class="address-modal__qr">
                    <qrcode-vue id="qr" :value="activeConnect?.accounts[0]" :size="247" level="H" :margin="5" background="#C9E0E0" />
                </div>
                <div class="address-modal__copy">
                    <div class="address">
                        {{ cutAddress(activeConnect?.accounts[0]) }}
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
import Modal from '@/components/app/Modal';
import CopySvg from '@/assets/icons/app/copy.svg';
import { ref } from 'vue';
import { cutAddress, copyToClipboard } from '@/helpers/utils';
import QrcodeVue from 'qrcode.vue';
import useConnect from '@/compositions/useConnect';

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

        const { activeConnect } = useConnect();

        const copyAddress = () => {
            copied.value = true;
            copyToClipboard(activeConnect?.value.accounts[0]);
            setTimeout(() => {
                copied.value = false;
            }, 500);
        };

        return {
            copied,
            cutAddress,
            activeConnect,
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
        background: $colorLightGreen;

        #qr {
            border-radius: 6px;
        }
    }

    &__copy {
        display: flex;
        align-items: center;
        margin-top: 16px;
        border-radius: 6px;
        width: 250px;
        height: 56px;
        background: $colorLightGreen;
        box-sizing: border-box;
        padding: 0 16px;
        transition: all 0.3s ease-in-out;

        .address {
            color: $colorBlack;
            font-size: 16px;
            font-family: 'Poppins_SemiBold';
            width: 84%;
        }

        .line {
            width: 1px;
            margin: 0 11px;
            height: 30px;
            background: #73b1b1;
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
            // fill: $colorBlack;
            cursor: pointer;

            &:hover {
                opacity: 0.7;
            }
        }
    }
}

body.dark {
    .address-modal {
        &__qr {
            background: $colorDarkPanel;
        }

        &__copy {
            background: $colorDarkPanel;

            .address {
                color: $colorBrightGreen;
            }
        }

        &__line {
            background: #494c56;
        }

        svg {
            // stroke: #73B1B1;
        }
    }
}
</style>
