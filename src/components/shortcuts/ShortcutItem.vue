<template>
    <a-card class="shortcut-item" :bordered="false">
        <template #title>
            <a-row justify="space-between" :wrap="false">
                <a-row align="middle" :wrap="false" class="shortcut-item__block">
                    <ShortcutPlaceHolder />
                    <div class="shortcut-item__name" :title="item.name">{{ item.name }}</div>
                </a-row>
                <a-row align="middle" :wrap="false">
                    <a-col align="right">
                        <div class="shortcut-item__title">{{ $t('shortcuts.createdBy') }}</div>
                        <span class="shortcut-item__author">{{ item.author.name }}</span>
                    </a-col>
                    <div class="shortcut-item__avatar">
                        <ZometLogo />
                    </div>
                </a-row>
            </a-row>
        </template>

        <a-row justify="space-between" class="shortcut-item__info">
            <a-row align="middle">
                <div>
                    <span v-for="(ecosystem, i) in item.ecosystems" :key="i">{{ ecosystem }}<span
                            v-if="i < item.ecosystems.length - 1">,</span></span>
                </div>
                <a-divider type="vertical" style="height: 10px; background-color: #c9e0e0" />
                <div>
                    Min amount:
                    <span v-if="item.minAmount" class="amount">{{ item.minAmount.value }} <span>{{
        item.minAmount.currency
    }}</span></span>
                    <span v-else class="amount">Any</span>
                </div>
            </a-row>
            <a-row>
                <div class="shortcut-item__tag" v-for="tag in item.tags" :key="tag" @click="() => selectTag(tag)">{{ tag
                    }}
                </div>
            </a-row>
        </a-row>

        <div class="shortcut-item__description" :title="item.description">{{ item.description }}</div>

        <a-row justify="space-between">
            <a-row align="middle" class="shortcut-item__like">
                <LikeIcon :class="{ 'shortcut-item__like-icon--active': watchList.includes(item.id) }"
                    @click="addToWatchList" />

                <div class="shortcut-item__like-count">15</div>
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

export default {
    name: 'ShortcutItem',
    components: {
        ShortcutPlaceHolder,
        ZometLogo,
        LikeIcon,
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

        const watchList = computed(() => store.getters['shortcuts/watchList']);

        const addToWatchList = () => {
            store.dispatch('shortcuts/setWatchlist', props.item.id);
        };

        const openShortcut = () => {
            store.dispatch('shortcuts/setSelectedShortcut', props.item);
            router.push('/shortcuts/' + props.item.id);
        };

        const selectTag = (tag) => {
            store.dispatch('shortcuts/setFilterTags', tag);
        }

        return {
            watchList,

            addToWatchList,
            openShortcut,
            selectTag
        };
    },
};
</script>
