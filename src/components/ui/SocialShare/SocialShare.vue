<template>
    <a-modal
        :open="isOpen"
        centered
        :footer="null"
        :title="$t('shortcuts.shareTitle')"
        class="modal social-share-modal"
        @cancel="closeModal"
    >
        <a-row :gutter="[8, 8]" justify="center" class="social-share-list">
            <a-col v-for="social in networksData" :key="social.network" :span="8" class="social-share-item">
                <SocialShareItem v-if="validateSocialNetwork(social.network)" v-bind="social" />
            </a-col>
        </a-row>
    </a-modal>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

// * Compositions
import { useSocialShare } from '@/compositions/useSocialShare';

// * Data
import { SocialNetworks } from '@/compositions/useSocialShare/data';

// * Components
import SocialShareItem from './SocialShareItem.vue';

export default {
    name: 'SocialShare',
    components: {
        SocialShareItem,
    },
    setup: () => {
        const store = useStore();

        const NETWORKS = [
            {
                network: SocialNetworks.x,
                name: 'x.com',
            },
            {
                network: SocialNetworks.hey,
                name: 'hey.xyz',
            },
            {
                network: SocialNetworks.warpcast,
                name: 'warpcast.com',
            },
        ];

        // * Default text and hashtags for sharing
        const TEXT_TEMPLATE = 'I performed my operations using the Shortcuts on zomet.app 🚀';
        const HASH_TAGS_TEMPLATE = 'zomet,zometapp,zometappshortcuts';

        const { getDefaultParams, getSocialAccount, validateSocialNetwork } = useSocialShare();

        // * Filter out invalid social networks
        const networks = computed(() => NETWORKS.filter(({ network }) => validateSocialNetwork(network)));

        // * Prepare data for social networks
        const networksData = computed(() => {
            return networks.value.map(({ network, name }) => {
                const params = getDefaultParams(network);
                params.name = name;
                params.network = network;
                params.title = TEXT_TEMPLATE;
                params.hashtags = HASH_TAGS_TEMPLATE;
                params.url = window.location.href;
                params.account = getSocialAccount(network);
                return params;
            });
        });

        // * Modal state
        const isOpen = computed({
            get: () => store.getters['app/modal']('socialShare'),
            set: () => store.dispatch('app/toggleModal', 'socialShare'),
        });

        // * Close modal
        const closeModal = () => store.dispatch('app/toggleModal', 'socialShare');

        return {
            isOpen,

            networksData,

            closeModal,
            validateSocialNetwork,
        };
    },
};
</script>
<style lang=""></style>
