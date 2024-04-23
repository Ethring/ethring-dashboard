<template>
    <a-tooltip :title="link">
        <a :href="link" target="_blank" title="explorer link" class="result-link">
            <template v-if="text">
                {{ text }}
            </template>
            <ExternalLinkIcon class="result-link-icon" />
        </a>
    </a-tooltip>
</template>
<script>
import ExternalLinkIcon from '@/assets/icons/module-icons/external-link.svg';

export default {
    name: 'ExternalLink',
    props: {
        link: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            default: '',
        },
    },
    components: {
        ExternalLinkIcon,
    },
};
</script>
