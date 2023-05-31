<template>
    <div class="loader" />
</template>
<script>
export default {
    name: 'Spinner',
};
</script>
<style lang="scss" scoped>
.loader,
.loader:after {
    border-radius: 50%;
    min-width: 80px;
    min-height: 80px;
}
.loader {
    margin: 60px auto;
    font-size: 10px;
    position: relative;
    text-indent: -9999em;
    border-top: 0.8em solid $colorLightGreen;
    border-right: 0.8em solid $colorLightGreen;
    border-bottom: 0.8em solid $colorLightGreen;
    border-left: 0.8em solid #385c39;
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
        border-top: 0.8em solid $colorDarkPanel;
        border-right: 0.8em solid $colorDarkPanel;
        border-bottom: 0.8em solid $colorDarkPanel;
        border-left: 0.8em solid $colorPl;
    }
}
</style>
