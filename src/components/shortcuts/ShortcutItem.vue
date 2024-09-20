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
                <a-row align="middle" class="ecosystem">
                    <span v-for="(network, i) in networks.slice(0, 2)" :key="i">
                        <a-avatar :src="network.logo" :size="16" />
                        {{ network.name }}
                    </span>
                    <a-tooltip v-if="networks.length > 2" placement="bottom" :color="theme === 'light' ? 'white' : '#1c1f2c'">
                        <template #title>
                            <div v-for="(network, i) in networks.slice(2)" :key="i" class="ecosystem__item">
                                <a-avatar :src="network.logo" :size="16" />
                                {{ network.name }}
                            </div>
                        </template>
                        <span class="ecosystem__more"> +{{ networks.length - 2 }}</span>
                    </a-tooltip>
                </a-row>

                <a-row align="middle">
                    <div v-for="tag in item.tags" :key="tag" class="shortcut-item__tag" @click.stop="() => selectTag(tag)">
                        {{ tag.toLowerCase() }}
                    </div>
                </a-row>
            </a-row>

            <div class="description" :title="item.description">{{ item.description }}</div>

            <a-row justify="space-between">
                <div class="amount">
                    Min amount:
                    <Amount v-if="item.minUsdAmount" type="usd" :value="item.minUsdAmount" symbol="$" />
                    <span v-else class="amount">any</span>
                </div>

                <a-row v-if="item?.rewards.length" class="rewards">
                    <span class="rewards__title">Rewards: </span>
                    <span class="rewards__description">{{ item?.rewardsDescription }}</span>
                    <a-tooltip v-for="elem in item.rewards" :key="elem.tooltip">
                        <template #title>{{ elem.tooltip }} </template>
                        <div v-if="elem.tooltip === 'APR'" class="rewards__apr">APR%</div>
                        <img v-else :src="elem.image" />
                    </a-tooltip>
                </a-row>
            </a-row>
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
import { values } from 'lodash';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import ShortcutPlaceHolder from '@/assets/icons/dashboard/shortcut.svg';
import LikeIcon from '@/assets/icons/dashboard/heart.svg';
import { UserOutlined } from '@ant-design/icons-vue';

import Amount from '@/components/app/Amount.vue';

import { ECOSYSTEM_LOGOS } from '@/core/wallet-adapter/config';
import { ShortcutTypeColors } from '@/core/shortcuts/core/';
import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

export default {
    name: 'ShortcutItem',
    components: {
        ShortcutPlaceHolder,
        LikeIcon,
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
        const theme = computed(() => store.getters['app/theme'] || 'light');

        const chainsInfo = computed(() => ({
            evm: store.getters['configs/getConfigsByEcosystems'](Ecosystem.EVM),
            cosmos: store.getters['configs/getConfigsByEcosystems'](Ecosystem.COSMOS),
        }));

        const networks = computed(() => {
            const { fullEcosystems, additionalNetworks } = props.item.networksConfig;
            const list = [];
            const allNetworks = [...values(chainsInfo.value.evm), ...values(chainsInfo.value.cosmos)];

            fullEcosystems?.forEach((ecosystem) => {
                list.push(...values(chainsInfo.value[ecosystem.toLowerCase()]).filter((elem) => elem.isSupportedChain && !elem.isTestNet));
            });

            additionalNetworks?.forEach((net) => {
                const network = allNetworks.find((elem) => net === elem.net);
                if (network) list.push(network);
            });

            return list;
        });

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
            networks,
            theme,

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
