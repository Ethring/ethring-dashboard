<template>
  <div class="ui-kit">
    <ThemeSwitcher class="m-5 mb-15" />
    <!-- INFO PANEL -->
    <div class="title">INFOPANELS</div>
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
    <!-- BUTTONS -->
    <div class="ui-kit__block row">
      <div>
        <div class="title">BUTTONS PRIMARY</div>
        <Button title="Primary" class="m-5" />
        <Button title="Primary, disabled" disabled class="m-5" />
        <Button title="Primary, xl" xl class="m-5" />
        <Button title="Primary, xl, disabled " xl disabled class="m-5" />
      </div>
      <div class="ml-15">
        <div class="title">BUTTONS SECONDARY</div>
        <Button title="Secondary" secondary class="m-5" />
        <Button title="Secondary, disabled" secondary disabled class="m-5" />
        <Button title="Secondary, xl" secondary xl class="m-5" />
        <Button
          title="Secondary, xl, disabled "
          secondary
          xl
          disabled
          class="m-5"
        />
      </div>
    </div>
  </div>
</template>
<script>
import ThemeSwitcher from "@/components/app/ThemeSwitcher.vue";
import InfoPanel from "@/components/ui/InfoPanel";
import Button from "@/components/ui/Button";

export default {
  name: "UIKit",
  components: {
    ThemeSwitcher,
    InfoPanel,
    Button,
  },
};
</script>
<style lang="scss" scoped>
.ui-kit {
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .title {
    font-size: 24px;
    margin: 20px 0;
    font-family: "Poppins_SemiBold";
    color: $colorBlack;
  }

  &__block {
    display: flex;
    flex-direction: column;

    &.row {
      flex-direction: row;
    }
  }
}

.m-5 {
  margin: 5px;
}

.ml-15 {
  margin-left: 15px;
}

.mb-15 {
  margin-bottom: 15px;
}

body.dark {
  .ui-kit {
    .title {
      color: $colorPl;
    }
  }
}
</style>
