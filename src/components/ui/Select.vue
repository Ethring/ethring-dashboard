<template>
  <div :class="{ active }" class="select" @click="active = !active">
    <div class="select__panel">
      <div class="info">
        <div class="network">
          <component :is="`${selectedItem?.net}Svg`" />
        </div>
        <div class="name">{{ selectedItem?.name }}</div>
      </div>
      <arrowSvg class="arrow" />
    </div>
    <div v-if="active" class="select__items" v-click-away="clickAway">
      <div
        v-for="(item, ndx) in items"
        :key="ndx"
        :class="{ active: item.name === selectedItem?.name }"
        class="select__items-item"
        @click="setActive(item)"
      >
        <div class="info">
          <div class="name">{{ item.name }}</div>
        </div>
        <div class="amount">
          {{ prettyNumber(item.balance?.mainBalance) }}
          <span>{{ item.code }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import bscSvg from "@/assets/icons/networks/bsc.svg";
import ethSvg from "@/assets/icons/networks/eth.svg";
import polygonSvg from "@/assets/icons/networks/polygon.svg";
import optimismSvg from "@/assets/icons/networks/optimism.svg";
import arbitrumSvg from "@/assets/icons/networks/arbitrum.svg";
import evmosethSvg from "@/assets/icons/networks/evmoseth.svg";
import avalancheSvg from "@/assets/icons/networks/avalanche.svg";
import arrowSvg from "@/assets/icons/dashboard/arrowdowndropdown.svg";
import { prettyNumber } from "@/helpers/prettyNumber";

import { onMounted, ref } from "vue";

export default {
  name: "Select",
  props: {
    items: {
      type: Array,
    },
  },
  components: {
    arrowSvg,
    bscSvg,
    ethSvg,
    polygonSvg,
    optimismSvg,
    arbitrumSvg,
    evmosethSvg,
    avalancheSvg,
  },
  setup(props, { emit }) {
    const active = ref(false);
    const selectedItem = ref(props.items[0]);

    const clickAway = () => {
      active.value = false;
    };

    const setActive = (item) => {
      selectedItem.value = item;
      emit("select", selectedItem.value);
    };

    onMounted(() => {
      setActive(selectedItem.value);
    });

    return { active, selectedItem, prettyNumber, clickAway, setActive };
  },
};
</script>
<style lang="scss" scoped>
.select {
  position: relative;

  &__panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: $colorGray;
    border-radius: 8px;
    height: 80px;
    padding: 17px 32px;
    box-sizing: border-box;
    border: 2px solid transparent;
    cursor: pointer;

    .info {
      display: flex;
      align-items: center;
    }

    .network {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3fdfae;
      margin-right: 10px;

      svg {
        fill: $colorBlack;
      }
    }

    .name {
      font-size: 28px;
      font-family: "Poppins_SemiBold";
      color: $colorBlack;
      user-select: none;
    }

    svg.arrow {
      cursor: pointer;
      fill: #73b1b1;
      transform: rotate(0);
      @include animateEasy;
    }
  }

  &.active {
    .select__panel {
      border: 2px solid $colorBaseGreen;
      background: $colorWhite;

      svg.arrow {
        transform: rotate(180deg);
      }
    }
  }

  &__items {
    z-index: 10;
    background: #fff;
    position: absolute;
    left: 0;
    top: 80px;
    width: 100%;
    min-height: 40px;
    border-radius: 8px;
    border: 2px solid $colorBaseGreen;
    padding: 20px 25px;
    box-sizing: border-box;
  }

  &__items-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 50px;
    border-bottom: 1px dashed #73b1b1;
    cursor: pointer;
    @include animateEasy;

    &.active {
      .info {
        .name {
          color: $colorBlack;
          font-family: "Poppins_SemiBold";
        }
      }
    }

    &:last-child {
      border-bottom: 1px solid transparent;
    }

    &:hover {
      opacity: 0.7;
    }

    .info {
      display: flex;
      align-items: center;

      .name {
        font-size: 16px;
        color: #486060;
        font-family: "Poppins_Regular";
      }
    }

    .amount {
      color: $colorBlack;
      font-family: "Poppins_SemiBold";

      span {
        color: $colorBlack;
        font-family: "Poppins_Regular";
      }
    }
  }
}

body.dark {
  .select {
    &__panel {
      background: $colorDarkBgGreen;

      svg.arrow {
        stroke: $colorLightGreen;
      }

      .info {
        .network {
          background: #22331f;
        }

        .name {
          color: $colorLightBrown;
        }
      }
    }

    &.active {
      .select__panel {
        border: 2px solid $colorLightGreen;
        background: transparent;
      }
    }

    .select__items {
      background: $colorDarkBgGreen;
      border-color: $colorLightGreen;
    }

    .select__items-item {
      border-color: #e8e9c933;

      &:last-child {
        border-color: transparent;
      }

      .info {
        .name {
          color: $colorLightBrown;
        }
      }

      .amount {
        color: $colorLightGreen;

        span {
          color: $colorWhite;
        }
      }
    }

    .select__items-item.active {
      .info {
        .name {
          color: $colorWhite;
        }
      }
    }
  }
}
</style>
