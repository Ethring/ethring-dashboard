<template>
    <div class="social-share-item--container">
        <a-tooltip placement="bottom">
            <template #title> {{ name }} </template>

            <a
                class="social-share-item--link"
                :href="shareLink"
                target="_blank"
                rel="noopener noreferrer"
                :title="`${network} social share`"
            >
                <component :is="iconComponentName" class="social-share-item--icon" />
            </a>
        </a-tooltip>
    </div>
</template>
<script>
import { useSocialShare } from '@/compositions/useSocialShare';
import { ref, computed } from 'vue';

export default {
    name: 'SocialShareItem',
    props: {
        name: {
            type: String,
            default: '',
        },
        network: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            default: '',
        },
        title: {
            type: String,
            default: '',
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
        quote: {
            type: String,
            default: '',
        },
        hashtags: {
            type: String,
            default: '',
        },
        media: {
            type: String,
            default: '',
        },
        account: {
            type: String,
            default: '',
        },
    },
    setup: (props) => {
        const toPascalCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);

        const { getShareLink } = useSocialShare();

        const shareLink = ref(getShareLink(props.network, props));

        const iconComponentName = computed(() => {
            return toPascalCase(props.network);
        });

        return {
            shareLink,
            iconComponentName,
        };
    },
};
</script>
