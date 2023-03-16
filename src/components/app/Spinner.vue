<template>
  <div class="loader" />
</template>
<script>
export default {
  name: "Spinner",
};
</script>
<style lang="scss" scoped>
.loader,
.loader:after {
  border-radius: 50%;
  width: 80px;
  height: 80px;
}
.loader {
  margin: 60px auto;
  font-size: 10px;
  position: relative;
  text-indent: -9999em;
  border-top: 0.8em solid #f5f6ff;
  border-right: 0.8em solid #f5f6ff;
  border-bottom: 0.8em solid #f5f6ff;
  border-left: 0.8em solid #9ca6c6;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-animation: load8 1.1s infinite linear;
  animation: load8 1.1s infinite linear;
}
@-webkit-keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

body.dark {
  .loader {
    border-top: 0.8em solid #385c39;
    border-right: 0.8em solid #385c39;
    border-bottom: 0.8em solid #385c39;
    border-left: 0.8em solid #22331f;
  }
}
</style>
