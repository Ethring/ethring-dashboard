<template>
  <div class="ui-kit">
    <ThemeSwitcher class="m-5 mb-15" />
    <!-- INFO PANEL -->
    <div class="ui-kit__block">
      <InfoPanel
        title="<InfoPanel type='error' title='Error title' />"
        type="error"
        class="m-5"
      />
      <InfoPanel
        title="<InfoPanel type='success' title='Success title' />"
        type="success"
        class="m-5"
      />
      <InfoPanel
        title="<InfoPanel type='warning' title='Warning title' />"
        type="warning"
        class="m-5"
      />
      <InfoPanel
        title="<InfoPanel type='info' title='Info title' />"
        type="info"
        class="m-5"
      />
    </div>
  </div>
</template>
<script>
import ThemeSwitcher from "@/components/app/ThemeSwitcher.vue";
import InfoPanel from "@/components/ui/InfoPanel";

export default {
  name: "UIKit",
  components: {
    ThemeSwitcher,
    InfoPanel,
  },
};
</script>
<style lang="scss" scoped>
.ui-kit {
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  &__block {
    display: flex;
    flex-direction: column;
  }
}

.m-5 {
  margin: 5px;
}

.mb-15 {
  margin-bottom: 15px;
}
</style>
