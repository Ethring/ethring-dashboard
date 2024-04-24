<template>
    <div class="shortcut-profile">
        <a-row class="shortcut-profile-action" align="middle" justify="space-between">
            <router-link to="/shortcuts" class="link">
                <ArrowIcon />
                <span>{{ $t('shortcuts.back') }}</span>
            </router-link>

            <a-row class="social-details">
                <template v-if="author.socials && author.socials.length > 0">
                    <a v-for="social in author.socials" class="item" align="middle" target="_blank" :href="social.link">
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
                        <div class="value">{{ allShortcutsCount }}</div>
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
                    <ZometLogo />
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
</template>

<script lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import ZometLogo from '@/assets/icons/sidebar/logo.svg';
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
        ZometLogo,

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

        const allShortcutsCount = computed(() => store.getters['shortcutsList/getCreatedShortcutsCount'](route.params.author));
        const shortcuts = computed(() => store.getters['shortcutsList/getShortcutsByAuthor'](route.params.author, activeTabKey.value));

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
