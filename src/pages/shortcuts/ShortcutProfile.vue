<template>
    <div class="shortcut-profile">
        <a-row class="shortcut-profile-action" align="middle" justify="space-between">
            <router-link to="/shortcuts" class="link">
                <ArrowIcon />
                <span>{{ $t('shortcuts.back') }}</span>
            </router-link>

            <a-row class="social-details">
                <template v-if="author.socials && author.socials.length > 0">
                    <a v-for="social in author.socials" :key="social.type" class="item" align="middle" target="_blank" :href="social.link">
                        <div class="icon">
                            <TwitterIcon class="social" />
                        </div>
                        <div class="info">
                            <div class="label">{{ social.type }}</div>
                            <div class="value account">@{{ social.nickname }}</div>
                        </div>
                    </a>
                </template>
                <div class="item">
                    <div class="icon">
                        <CreatedIcon class="more-action" />
                    </div>
                    <div class="info">
                        <div class="label">{{ $t('shortcuts.profile.created') }}</div>
                        <div v-if="allShortcutsCount" class="value">{{ allShortcutsCount }}</div>
                        <a-skeleton-input v-else active size="small" />
                    </div>
                </div>
                <div class="item">
                    <div class="icon">
                        <LikeIcon class="like" />
                    </div>
                    <div class="info">
                        <div class="label">{{ $t('shortcuts.profile.likes') }}</div>
                        <div class="value">{{ watchList.length }}</div>
                    </div>
                </div>
            </a-row>
        </a-row>
        <div class="shortcut-profile-author">
            <a-upload
                disabled
                name="avatar"
                list-type="picture-card"
                class="avatar-uploader"
                :show-upload-list="false"
                :before-upload="beforeUpload"
                @change="handleChange"
            >
                <img v-if="imageUrl" :src="imageUrl" class="custom-avatar" />

                <div v-else-if="author.avatar" class="avatar">
                    <img :src="author.avatar" :alt="author.name" />
                </div>

                <img v-else :src="imgMask" class="avatar" />
            </a-upload>

            <div class="info">
                <div class="label">{{ $t('shortcuts.profile.author') }}</div>
                <div class="info-author">
                    <div class="author">{{ author.name }}</div>
                    <VerifiedIcon />
                </div>
            </div>
        </div>
    </div>

    <a-row v-if="shortcuts.length" :gutter="[16, 16]" class="shortcut-list">
        <a-col v-for="(item, i) in shortcuts" :key="`shortcut-${i}`" :md="24" :lg="12">
            <ShortcutItem :item="item" />
        </a-col>
    </a-row>
    <a-spin v-else size="large" class="spin__center" />
</template>

<script lang="ts">
import { computed, ref, onBeforeMount, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import ImgMask from '@/assets/images/placeholder/mask.png';

import VerifiedIcon from '@/assets/icons/form-icons/check-circle.svg';
import TwitterIcon from '@/assets/icons/socials/twitter.svg';
import ArrowIcon from '@/assets/icons/form-icons/arrow-back.svg';
import CreatedIcon from '@/assets/icons/module-icons/more-action.svg';
import LikeIcon from '@/assets/icons/dashboard/heart.svg';
import { useRoute } from 'vue-router';

import { IAuthor } from '@/core/shortcuts/data/authors';

export default {
    name: 'ShortcutProfile',
    components: {
        VerifiedIcon,
        TwitterIcon,
        ArrowIcon,
        CreatedIcon,
        LikeIcon,
    },
    setup() {
        const store = useStore();
        const activeTabKey = ref('all');
        const route = useRoute();

        // author avatar
        const imageUrl = ref('');

        const watchList = computed(() => store.getters['shortcutsList/watchList']);

        const shortcuts = computed(() => store.getters['shortcutsList/getShortcutsByAuthor']);

        const allShortcutsCount = computed(() => shortcuts.value.length);

        const author = computed<IAuthor>(() => {
            const [shortcut] = shortcuts.value || [];

            return (
                shortcut?.author || {
                    name: '',
                    avatar: '',
                    socials: [],
                }
            );
        });

        function getBase64(img, callback) {
            const reader = new FileReader();
            reader.addEventListener('load', () => callback(reader.result));
            reader.readAsDataURL(img);
        }

        const handleChange = (info) => {
            getBase64(info.file.originFileObj, (base64Url) => {
                imageUrl.value = base64Url;
            });
        };

        const beforeUpload = (file) => {
            const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
            return isJpgOrPng;
        };

        onBeforeMount(() => {
            store.dispatch('shortcutsList/loadShortcutsByAuthor', route.params.author);
        });

        onUnmounted(() => {
            store.dispatch('shortcutsList/clearAuthorsShortcuts');
        });

        return {
            shortcuts,
            author,
            watchList,
            allShortcutsCount,

            imgMask: ImgMask,

            beforeUpload,
            handleChange,
            imageUrl,
        };
    },
};
</script>
