<template>
  <div :class="{ active }" class="select-address" @click="active = !active">
    <div class="select-address__panel">
      <div class="recipient">Recipient</div>
      <div class="info-wrap">
        <div class="info">
          <div class="network">
            <!-- <component v-if="network" :is="`${network}Svg`" /> -->
          </div>
          <div class="name">Address</div>
        </div>
        <arrowSvg class="arrow" />
      </div>
      <div class="address">0x000...</div>
    </div>
    <div v-if="false" class="select-address__items">
      <div
        v-for="(item, ndx) in []"
        :key="ndx"
        class="select-address__items-item"
      >
        <div class="info">
          <div class="name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import arrowSvg from "@/assets/icons/dashboard/arrowdownstroke.svg";

import { ref } from "vue";

export default {
  name: "SelectAddress",
  props: {},
  components: {
    arrowSvg,
  },
  setup() {
    const active = ref(false);

    return { active };
  },
};
</script>
<style lang="scss" scoped>
.select-address {
  position: relative;

  &__panel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #f5f6ff;
    border-radius: 8px;
    height: 160px;
    padding: 10px 25px;
    box-sizing: border-box;
    border: 2px solid transparent;
    cursor: pointer;

    .recipient {
      color: #586897;
      font-family: "Poppins_SemiBold";
    }

    .address {
      color: #586897;
      font-family: "Poppins_Regular";
    }

    .info-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

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
      background: $borderLight;
      margin-right: 10px;

      svg {
        fill: $colorWhite;
      }
    }

    .name {
      font-size: 28px;
      font-family: "Poppins_SemiBold";
      color: #9ca6c6;
      user-select: none;
    }

    svg.arrow {
      cursor: pointer;
      stroke: #9ca6c6;
      transform: rotate(180deg);
      @include animateEasy;
    }
  }

  &.active {
    .select-address__panel {
      border: 2px solid $colorMainBlue;
      background: transparent;

      svg.arrow {
        transform: rotate(0deg);
      }
    }
  }

  &__items {
    z-index: 10;
    background: #fff;
    position: absolute;
    left: 0;
    top: 170px;
    width: 100%;
    min-height: 40px;
    border-radius: 8px;
    border: 1px solid $colorMainBlue;
    padding: 20px 25px;
    box-sizing: border-box;
  }

  &__items-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 50px;
    border-bottom: 1px solid #ccd5f0;
    cursor: pointer;
    @include animateEasy;

    &.active {
      .info {
        .address {
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

      .address {
        font-size: 16px;
        color: $colorLightBlue;
        font-family: "Poppins_Regular";
      }
    }
  }
}

body.dark {
  .select-address {
    &__panel {
      background: $colorDarkBgGreen;

      .recipient,
      .address {
        color: $colorLightGreen;
      }

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
      .select-address__panel {
        border: 2px solid $colorLightGreen;
        background: transparent;
      }
    }

    .select-address__items {
      background: $colorDarkBgGreen;
      border-color: $colorLightGreen;
    }

    .select-address__items-item {
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

    .select-address__items-item.active {
      .info {
        .address {
          color: $colorWhite;
        }
      }
    }
  }
}
</style>
