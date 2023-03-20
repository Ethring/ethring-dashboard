<template>
  <teleport to="body">
    <Modal
      :title="$t('modals.addressModal.title')"
      width="314px"
      height="460px"
      @close="$emit('close')"
    >
      <div class="address-modal">
        <div class="address-modal__qr">
          <qrcode-vue
            id="qr"
            :value="metamaskConnect?.accounts[0]"
            :size="247"
            level="H"
            :margin="5"
            background="#f0f3fd"
          />
        </div>
        <div class="address-modal__copy">
          <div class="address">
            {{ cutAddress(metamaskConnect?.accounts[0]) }}
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
import Modal from "@/components/app/Modal";
import CopySvg from "@/assets/icons/app/copy.svg";
import { useStore } from "vuex";
import { computed, ref } from "vue";
import { cutAddress, copyToClipboard } from "@/helpers/utils";
import QrcodeVue from "qrcode.vue";

export default {
  name: "AddressModal",
  components: {
    Modal,
    CopySvg,
    QrcodeVue,
  },
  setup() {
    const store = useStore();
    const copied = ref(false);

    const metamaskConnect = computed(
      () => store.getters["metamask/metamaskConnector"]
    );

    const copyAddress = () => {
      copied.value = true;
      copyToClipboard(metamaskConnect?.value.accounts[0]);
      setTimeout(() => {
        copied.value = false;
      }, 500);
    };

    return {
      copied,
      cutAddress,
      metamaskConnect,
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
    border-radius: 6px;
    background: rgb(245, 246, 254);

    #qr {
      border-radius: 6px;
    }
  }

  &__copy {
    display: flex;
    align-items: center;
    margin-top: 20px;
    border-radius: 6px;
    width: 250px;
    height: 56px;
    background: rgb(245, 246, 254);
    box-sizing: border-box;
    padding: 0 12px;
    transition: all 0.3s ease-in-out;

    .address {
      color: $colorMainBlue;
      font-size: 16px;
      font-family: "Poppins_SemiBold";
      width: 84%;
    }

    .line {
      width: 1px;
      margin: 0 10px;
      height: 30px;
      background: $borderLight;
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
      stroke: #586897;
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
      background: #27272b4f;
    }

    &__copy {
      background: #27272b4f;

      .address {
        color: $themeGreen;
      }
    }
  }
}
</style>
