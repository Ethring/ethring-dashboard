<template>
    <div class="tokens" :class="{ empty: emptyLists }">
        <template v-if="groupTokens.length > 1">
            <div
                v-for="(group, ndx) in groupTokens.filter((g) => g.list.length)"
                :key="ndx"
                :class="{ hide: groupHides[ndx] }"
                class="tokens__group"
                @click="toggleGroup(ndx)"
            >
                <TokensItemHeader v-if="group.list.length" :item="group" />
                <TokensItem v-for="(listItem, n) in group.list" :key="n" :item="listItem" in-group />
            </div>
        </template>

        <template v-if="loader">
            <div v-for="(_, ndx) in 5" :key="ndx" class="tokens__group" @click="toggleGroup(ndx)">
                <a-skeleton active avatar :paragraph="{ rows: 0 }" :style="{ paddingTop: '15px' }" />
            </div>
        </template>

        <template v-if="!loader && !groupTokens.length">
            <EmptyList title="You don't have any assets" />
        </template>
    </div>
</template>
<script>
import useTokens from '@/compositions/useTokens';
import EmptyList from '@/components/ui/EmptyList';

import { getTokenIcon } from '@/helpers/utils';
import { prettyNumber } from '@/helpers/prettyNumber';
import TokensItem from './TokensItem';
import TokensItemHeader from './TokensItemHeader';

import { useStore } from 'vuex';
import { computed, ref } from 'vue';

export default {
    name: 'Tokens',
    components: {
        TokensItemHeader,
        TokensItem,
        EmptyList,
    },
    setup() {
        const store = useStore();
        const { tokens, groupTokens } = useTokens();
        const groupHides = ref({});

        const loader = computed(() => store.getters['tokens/loader']);

        const emptyLists = computed(() => {
            return !tokens.value.length && groupTokens.value.every((g) => !g.list.length); // <=1 - parent network
        });

        const toggleGroup = (groupNdx) => {
            groupHides.value[groupNdx] = !groupHides.value[groupNdx];
        };

        return {
            groupHides,
            tokens,
            groupTokens,
            getTokenIcon,
            prettyNumber,
            loader,
            emptyLists,
            toggleGroup,
        };
    },
};
</script>
<style lang="scss" scoped>
.tokens {
    display: flex;
    flex-direction: column;

    &__group {
        border: 1px solid $colorLightGreen;
        border-radius: 16px;
        padding: 0 16px;
        margin-bottom: 7px;
        box-sizing: border-box;
        @include animateEasy;

        &.hide {
            height: 74px;
            min-height: 74px;
            overflow: hidden;
        }
    }

    &.empty {
        justify-content: center;
    }

    &__group:hover {
        box-shadow: 0px 4px 40px rgba(0, 0, 0, 0.2);
    }
}

body.dark {
    .tokens {
        &__group {
            border-color: transparent;
            background: $colorDarkPanel;
        }
    }
}
</style>
