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
    font-size: 100px;
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Poppins_Bold';
}
</style>
