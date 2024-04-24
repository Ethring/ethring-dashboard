<template>
    <a-result :status="status" :title="title" class="operation-result">
        <template #subTitle>
            <div class="operation-result-subtitle">
                <span class="description">{{ description }}</span>

                <template v-if="link">
                    <a-divider />
                    <ExternalLink :link="link" :text="$t('tokenOperations.viewDetails')" />
                </template>
            </div>
        </template>
        <template v-if="error">
            <div class="desc">
                <p>{{ $t('tokenOperations.youHaveFollowingErrors') }}:</p>
                <a-typography-text code>{{ error }}</a-typography-text>
            </div>
        </template>

        <template #extra>
            <UiButton key="console" title="Done" type="primary" data-qa="operation-done" @click="() => handleOnDone(module)" />
        </template>
    </a-result>
</template>
<script>
import { useStore } from 'vuex';

import UiButton from '@/components/ui/Button.vue';
import ExternalLink from '@/components/ui/ExternalLink.vue';

export default {
    name: 'Result',
    components: {
        UiButton,
        ExternalLink,
    },
    props: {
        status: {
            type: String,
            default: 'success',
        },
        module: {
            required: true,
            type: String,
            default: '',
        },
        title: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        link: {
            type: String,
            default: '',
        },
        error: {
            type: String,
            default: null,
        },
    },
    setup() {
        const store = useStore();

        const handleOnDone = (currentModule) => store.dispatch('tokenOps/resetOperationResult', currentModule);

        return {
            handleOnDone,
        };
    },
};
</script>
