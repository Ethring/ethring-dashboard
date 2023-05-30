<template>
    <div class="tokens__item-header">
        <div class="name">{{ item.name }}</div>
        <Button :title="!showBalance ? '****' : '$' + prettyNumber(totalSumUSD)" />
    </div>
</template>
<script>
import { computed } from 'vue';
import { prettyNumber } from '@/helpers/prettyNumber';
import { useStore } from 'vuex';
import Button from '@/components/ui/Button';

export default {
    name: 'TokensItemHeader',
    props: {
        item: {
            required: true,
        },
    },
    components: {
        Button,
    },
    setup(props) {
        const store = useStore();
        const showBalance = computed(() => store.getters['app/showBalance']);

        const totalSumUSD = computed(() => {
            if (!props.item?.list) {
                return 0;
            }

            return props.item.list.reduce((prev, token) => {
                return token.balanceUsd + prev;
            }, 0);
        });

        return {
            totalSumUSD,
            showBalance,
            prettyNumber,
        };
    },
};
</script>
<style lang="scss" scoped>
.tokens__item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 73px;
    margin-bottom: 5px;
    border-bottom: 1px dashed $colorLightGreen;
    cursor: pointer;

    .balance {
        font-size: 16px;
        font-family: 'Poppins_SemiBold';
        text-align: center;
        width: 88px;
        height: 40px;
        line-height: 40px;
        border-radius: 8px;
        border: 1px solid $colorBlack;
    }

    .name {
        text-transform: uppercase;
        color: $colorBlack;
        font-size: 18px;
        font-family: 'Poppins_SemiBold';
    }
}

body.dark {
    .tokens__item-header {
        border-color: #494c56;

        .balance {
            color: $colorLightGreen;
        }

        .name {
            color: $colorWhite;
        }
    }
}
</style>
