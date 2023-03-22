<template>
  <div class="wrap">
    <div v-if="loading" class="spin">
      <Spinner />
    </div>
    <div class="frame">
      <iframe
        width="700px"
        src="https://apps.3ahtim54r.ru/ca-uniswap/"
        :onload="onFrameLoaded"
      />
    </div>
  </div>
</template>
<script>
import Spinner from "@/components/app/Spinner";
import { ref } from "vue";

export default {
  name: "PancakeSwap",
  components: {
    Spinner,
  },
  setup() {
    const loading = ref(true);

    const onFrameLoaded = () => {
      loading.value = false;
    };

    return {
      loading,
      onFrameLoaded,
    };
  },
};
</script>
<style lang="scss" scoped>
.wrap {
  position: relative;
  width: 100%;
  height: 100%;

  .spin {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 0;
    left: 0;
    top: 0;
  }

  .frame {
    width: 100%;
    height: 100%;
  }

  iframe {
    height: 100%;
    border-radius: 20px;
    outline: none;
    border: none;
  }
}
</style>
