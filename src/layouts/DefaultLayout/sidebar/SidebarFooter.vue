<template>
    <div class="socials-container">
        <a-space-compact :direction="isCollapsed ? 'vertical' : 'horizontal'" class="socials" align="center">
            <SocialItem v-for="social in socials" :key="social" v-bind="social" />
        </a-space-compact>

        <AppVersion class="version" :style="`margin-left: ${isCollapsed ? 'auto' : '0'} `" />
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import SocialItem from './SocialItem.vue';
import AppVersion from './AppVersion.vue';

export default {
    name: 'SidebarFooter',
    components: {
        AppVersion,
        SocialItem,
    },
    setup() {
        const store = useStore();
        return {
            isCollapsed: computed(() => store.getters['app/isCollapsed']),
        };
    },
    data: () => {
        return {
            socials: [
                {
                    name: 'telegram',
                    link: 'https://t.me/zometapp',
                    icon: 'TelegramIcon',
                },
                {
                    name: 'twitter',
                    link: 'https://twitter.com/zometapp',
                    icon: 'TwitterIcon',
                },
                {
                    name: 'discord',
                    link: '',
                    icon: 'DiscordIcon',
                    disabled: true,
                },
                {
                    name: 'git-book',
                    link: '',
                    icon: 'GitBookIcon',
                    disabled: true,
                },
            ],
        };
    },
};
</script>
<style lang="scss">
.socials {
    &-container {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        width: 80%;
        margin: 0 auto;

        .version {
            margin-top: 10px;
            margin-right: auto;
        }
    }
}
</style>
