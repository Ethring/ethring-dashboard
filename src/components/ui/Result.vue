<template>
    <a-result :status="status" :title="title" class="operation-result">
        <template #subTitle>
            <div class="operation-result-subtitle">
                <span class="description">{{ description }}</span>

                <template v-if="link">
                    <a-divider />
                    <a-tooltip :title="link">
                        <a :href="link" target="_blank" title="explorer link" class="result-link">
                            <a-space align="center" :size="4">
                                {{ $t('tokenOperations.viewDetails') }}
                                <ExternalLinkIcon />
                            </a-space>
                        </a>
                    </a-tooltip>
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
            <Button key="console" title="Done" type="primary" @click="() => handleOnDone(module)" data-qa="operation-done" />
        </template>
    </a-result>
</template>
<script>
import { useStore } from 'vuex';

import Button from '@/components/ui/Button.vue';
import ExternalLinkIcon from '@/assets/icons/module-icons/external-link.svg';

export default {
    name: 'Result',
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
    components: {
        Button,
        ExternalLinkIcon,
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
