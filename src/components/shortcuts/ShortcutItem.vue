<template>
    <a-card
        class="shortcut-item"
        :data-qa="item.id"
        :class="{
            disabled: !item?.isActive,
        }"
        @click="openShortcut"
    >
        <template #title>
            <a-row align="middle" :wrap="false" class="shortcut-item__header" :style="{ backgroundColor: ShortcutTypeColors[item.type] }">
                <div v-if="item.logoURI" class="icon">
                    <img :src="item.logoURI" :alt="item.name" />
                </div>
                <ShortcutPlaceHolder v-else />
                <div class="name" :title="item.name">{{ item.name }}</div>
            </a-row>
        </template>

        <div class="shortcut-item__body">
            <a-row justify="space-between" class="shortcut-item__info">
                <a-row align="middle">
                    <div class="ecosystem">
                        <a-tooltip v-if="item.ecosystems.length > 1" placement="bottom">
                            <template #title>
                                <span v-for="(ecosystem, i) in item.ecosystems" :key="i">
                                    {{ ecosystem }}
                                    <span v-if="i < item.ecosystems.length - 1">, </span></span
                                >
                            </template>
                            <span>
                                <MultiIcon class="ecosystem-logo" />
                                Multi
                            </span>
                        </a-tooltip>
                        <span v-else
                            ><img class="ecosystem-logo" :src="getEcosystemLogo(item.ecosystems[0])" />{{ item.ecosystems[0] }}</span
                        >
                    </div>
                </a-row>

                <a-row align="middle">
                    <div v-for="tag in item.tags" :key="tag" class="shortcut-item__tag" @click.stop="() => selectTag(tag)">
                        {{ tag.toLowerCase() }}
                    </div>
                </a-row>
            </a-row>

            <div class="description" :title="item.description">{{ item.description }}</div>

            <a-row v-if="item?.benefits" class="benefits">
                <span>Benefits:</span>{{ item?.benefits?.description }}
                <a-row class="benefits__icons">
                    <a-tooltip v-for="elem in item?.benefits?.items" :key="elem.tooltip">
                        <template #title>{{ elem.tooltip }} </template>
                        <img :src="elem.image" />
                    </a-tooltip>
                </a-row>
            </a-row>

            <div class="amount">
                Min amount:
                <Amount v-if="item.minUsdAmount" type="usd" :value="item.minUsdAmount" symbol="$" />
                <span v-else class="amount">any</span>
            </div>
        </div>
    </a-card>
    <a-row justify="space-between" class="shortcut-item__footer">
        <a-row align="middle" :wrap="false">
            <div class="avatar">
                <img
                    v-if="!isShowPlaceholder"
                    :src="item.author.avatar"
                    :alt="item.author.name"
                    loading="lazy"
                    @error="handleOnErrorImg"
                    @load="handleOnLoadImg"
                />

                <a-avatar v-else :size="30">
                    <template #icon><UserOutlined /></template>
                </a-avatar>
            </div>
            <a-col>
                <div class="title">{{ $t('shortcuts.createdBy') }}</div>
                <span class="author" @click="openProfile">{{ item.author.name }}</span>
            </a-col>
        </a-row>
        <a-row align="middle" class="favorites">
            <LikeIcon :class="{ 'favorites-icon--active': watchList.includes(item.id) }" @click="addToWatchList" />
            <div class="favorites-count"></div>
        </a-row>
    </a-row>
</template>

<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import ShortcutPlaceHolder from '@/assets/icons/dashboard/shortcut.svg';
import LikeIcon from '@/assets/icons/dashboard/heart.svg';
import MultiIcon from '@/assets/icons/module-icons/multi.svg';
import { UserOutlined } from '@ant-design/icons-vue';

import Amount from '@/components/app/Amount.vue';

import { ECOSYSTEM_LOGOS } from '@/core/wallet-adapter/config';
import { ShortcutTypeColors } from '@/core/shortcuts/core/';

export default {
    name: 'ShortcutItem',
    components: {
        ShortcutPlaceHolder,
        LikeIcon,
        MultiIcon,
        UserOutlined,
        Amount,
    },
    props: {
        item: {
            type: Object,
            required: true,
            default: () => ({}),
        },
    },
    setup(props) {
        const store = useStore();
        const router = useRouter();
        const isShowPlaceholder = ref(!props.item.author.avatar || false);

        const watchList = computed(() => store.getters['shortcutsList/watchList']);

        const addToWatchList = () => store.dispatch('shortcutsList/setWatchList', props.item.id);

        const openShortcut = () => {
            if (!props.item?.isActive) return;

            store.dispatch('shortcutsList/setSelectedShortcut', props.item);
            router.push('/shortcuts/' + props.item.id);
        };

        const openProfile = () => router.push('/shortcuts/profile/' + props.item.author.id);

        const selectTag = (tag) => store.dispatch('shortcutsList/setFilterTags', tag);

        const getEcosystemLogo = (ecosystem) => {
            return ECOSYSTEM_LOGOS[ecosystem];
        };

        const handleOnErrorImg = () => {
            isShowPlaceholder.value = true;
        };

        const handleOnLoadImg = () => {
            isShowPlaceholder.value = false;
        };

        return {
            watchList,
            ShortcutTypeColors,
            isShowPlaceholder,

            addToWatchList,
            openShortcut,
            selectTag,
            openProfile,
            getEcosystemLogo,
            handleOnLoadImg,
            handleOnErrorImg,
        };
    },
};
</script>
