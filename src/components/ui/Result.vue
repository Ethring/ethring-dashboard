<template>
    <a-modal v-model:open="isModalOpen" title="ABS" centered :footer="null" :body-style="{ height: '374px', overflowY: 'overlay' }">
        <a-result :status="status" class="operation-result">
            <template #title>
                <span v-html="title"></span>
            </template>
            <template #subTitle>
                <div class="operation-result-subtitle">
                    <span class="value">{{ description }}</span>

                    <template v-if="link">
                        <a-divider />

                        <div class="description">{{ $t('tokenOperations.pendingTransactions') }}</div>

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
                <Button key="console" title="Done" type="primary" data-qa="operation-done" @click="() => handleOnDone(module)" />
            </template>
        </a-result>
    </a-modal>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import ExternalLinkIcon from '@/assets/icons/module-icons/external-link.svg';

export default {
    name: 'Result',
    components: {
        ExternalLinkIcon,
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

        const isModalOpen = computed({
            get: () => store.getters['app/modal']('txResultModal'),
            set: () => store.dispatch('app/toggleModal', 'txResultModal'),
        });

        const handleOnDone = (currentModule) => store.dispatch('tokenOps/resetOperationResult', currentModule);

        return {
            isModalOpen,

            handleOnDone,
        };
    },
};
</script>
