<template>
    <a-card class="shortcut-item" :bordered="false">
        <template #title>
            <a-row justify="space-between" :wrap="false">
                <a-row align="middle" :wrap="false" class="shortcut-item__block">
                    <ShortcutPlaceHolder />
                    <div class="name" :title="item.name">{{ item.name }}</div>
                </a-row>

                <a-row align="middle" :wrap="false">
                    <a-col align="right">
                        <div class="title">{{ $t('shortcuts.createdBy') }}</div>
                        <span class="author" @click="openProfile">{{ item.author.name }}</span>
                    </a-col>
                    <div class="avatar">
                        <ZometLogo />
                    </div>
                </a-row>
            </a-row>
        </template>

        <a-row justify="space-between" class="shortcut-item__info">
            <a-row align="middle">
                <div class="ecosystem">
                    <span v-for="(ecosystem, i) in item.ecosystems" :key="i">
                        {{ ecosystem }}
                        <span v-if="i < item.ecosystems.length - 1">,</span></span
                    >
                </div>
                <a-divider type="vertical" style="height: 10px; background-color: #c9e0e0" />
                <div class="amount">
                    Min amount
                    <Amount v-if="item.minUsdAmount" type="usd" :value="item.minUsdAmount" symbol="$" />
                    <span v-else class="amount">Any</span>
                </div>
            </a-row>

            <a-row>
                <div class="shortcut-item__tag" v-for="tag in item.tags" :key="tag" @click="() => selectTag(tag)">{{ tag }}</div>
            </a-row>
        </a-row>

        <div class="description" :title="item.description">{{ item.description }}</div>

        <a-row justify="space-between">
            <a-row align="middle" class="favorites">
                <LikeIcon :class="{ 'favorites-icon--active': watchList.includes(item.id) }" @click="addToWatchList" />
                <div class="favorites-count"></div>
            </a-row>
            <Button title="Try" class="shortcut-item__btn" @click="openShortcut" />
        </a-row>
    </a-card>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import ShortcutPlaceHolder from '@/assets/icons/dashboard/shortcut.svg';
import ZometLogo from '@/assets/icons/sidebar/logo.svg';
import LikeIcon from '@/assets/icons/dashboard/heart.svg';
import Amount from '@/components/app/Amount.vue';

export default {
    name: 'ShortcutItem',
    components: {
        ShortcutPlaceHolder,
        ZometLogo,
        LikeIcon,
        Amount,
    },
    props: {
        item: {
            required: true,
            default: {},
        },
    },
    setup(props) {
        const store = useStore();
        const router = useRouter();

        const watchList = computed(() => store.getters['shortcutsList/watchList']);

        const addToWatchList = () => store.dispatch('shortcutsList/setWatchList', props.item.id);

        const openShortcut = () => router.push('/shortcuts/' + props.item.id);

        const openProfile = () => router.push('/shortcuts/profile/' + props.item.author.name);

        const selectTag = (tag) => store.dispatch('shortcutsList/setFilterTags', tag);

        return {
            watchList,

            addToWatchList,
            openShortcut,
            selectTag,
            openProfile,
        };
    },
};
</script>
