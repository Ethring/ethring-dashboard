<template>
    <div class="not-found">404</div>
</template>
<script>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
    name: 'NotFound',
    setup() {
        const router = useRouter();

        onMounted(() => {
            router.push('/main');
        });
    },
};
</script>
<style lang="scss" scoped>
.not-found {
    width: 100%;
    height: 100vh;

    @include pageFlexRow;
    justify-content: center;

    font-weight: 700;
    font-size: 100px;
}
</style>
