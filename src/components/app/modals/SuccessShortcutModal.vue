<template>
    <a-modal v-model:open="isModalOpen" centered :footer="null" :title="shortcutStatus" class="modal success-shortcut">
        <a-carousel autoplay class="success-shortcut-carousel" v-if="nftsList.length > 0">
            <div v-for="nft in nftsList">
                <a-image :preview="false" :src="nft" class="shortcut-nft-image" alt="nft-image" :fallback="Placeholder">
                    <template #placeholder>
                        <div class="carousel-img-placeholder">
                            <a-spin size="large" />
                        </div>
                    </template>
                </a-image>
            </div>
        </a-carousel>
        <a-spin :spinning="isLoading" size="large">
            <a-row v-if="results.length > 0">
                <a-col :span="24">
                    <p class="title success-shortcut-title">Success!</p>

                    <p class="success-shortcut-description">Your shortcut has been executed, and here are the results:</p>

                    <a-list class="success-shortcut-list" :item-layout="'horizontal'" :dataSource="results">
                        <template #renderItem="{ item }">
                            <a-list-item>
                                <a-list-item-meta>
                                    <template #title> {{ item.type }} / {{ item.status }} </template>
                                    <template #description>
                                        <a-space>
                                            <TokenIcon :token="item.token" :width="16" :height="16" />
                                            <Amount :value="item.amount" :symbol="item.token.symbol" type="currency" />
                                        </a-space>
                                    </template>
                                    {{ item.hash }}
                                </a-list-item-meta>
                            </a-list-item>
                        </template>
                    </a-list>
                </a-col>
            </a-row>
        </a-spin>
    </a-modal>
</template>
<script lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import { Carousel } from 'ant-design-vue';

import Amount from '@/components/app/Amount.vue';

import Placeholder from '@/assets/images/placeholder/mask.png';

import { IShortcutOp } from '@/modules/shortcuts/core/ShortcutOp';
import OperationsFactory from '@/modules/operations/OperationsFactory';

import { ModuleType } from '@/shared/models/enums/modules.enum';
import { SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';

import { delay } from '@/shared/utils/helpers';
import { TRANSACTION_TYPES } from '../../../shared/models/enums/statuses.enum';

export default {
    name: 'SuccessShortcutModal',
    components: {
        Carousel,
        Amount,
    },
    setup() {
        const store = useStore();

        const isLoading = ref(false);

        const currentShortcutId = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

        const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](currentShortcutId.value));

        const currentOp = computed<IShortcutOp>(() => {
            if (!currentShortcutId.value) return;
            return store.getters['shortcuts/getCurrentOperation'](currentShortcutId.value);
        });

        const isRequestingNfts = computed({
            get: () => store.getters['shortcuts/getIsRequestingNfts'](currentShortcutId.value),
            set: (value) =>
                store.dispatch('shortcuts/setIsRequestingNfts', {
                    shortcutId: currentShortcutId.value,
                    value,
                }),
        });

        const operationsFactory = computed<OperationsFactory>(() => {
            if (!currentShortcutId.value) return;
            return store.getters['shortcuts/getShortcutOpsFactory'](currentShortcutId.value);
        });

        const isModalOpen = computed({
            get: () => store.getters['app/modal']('successShortcutModal'),
            set: () => store.dispatch('app/toggleModal', 'successShortcutModal'),
        });

        const results = ref([]);
        const nftsList = ref([]);

        watch(shortcutStatus, async () => {
            if (!operationsFactory.value) return;
            if (shortcutStatus.value !== SHORTCUT_STATUSES.SUCCESS) return;
            isLoading.value = true;
            results.value = operationsFactory.value.getOperationsResult();
            isLoading.value = false;
        });

        watch(isRequestingNfts, async (value) => {
            if (!operationsFactory.value) return (isLoading.value = false);
            if (!currentOp.value) return (isLoading.value = false);

            isLoading.value = value;
            await delay(2500);

            for (const op of operationsFactory.value.getOperationOrder()) {
                const operation = operationsFactory.value.getOperationByKey(op);

                if (![ModuleType.nft].includes(operation.getModule() as ModuleType)) continue;

                const { nfts = [] } = operation.getParams();

                console.log('Getting NFTs from operation', op, nfts);

                if (!nfts.length) continue;

                nftsList.value.push(...nfts);
            }
        });

        watch(isModalOpen, (value) => {
            if (!value) {
                results.value = [];
                nftsList.value = [];

                console.log('Resetting shortcut');

                const flow = operationsFactory.value.getFullOperationFlow();

                const withoutApprove = flow.filter((op) => op.type !== TRANSACTION_TYPES.APPROVE);

                const firstOp = withoutApprove[0];
                const lastOp = withoutApprove[withoutApprove.length - 1];

                const firstOpId = operationsFactory.value.getOperationIdByKey(firstOp.moduleIndex);
                const lastOpId = operationsFactory.value.getOperationIdByKey(lastOp.moduleIndex);

                store.dispatch('shortcuts/setCurrentStepId', firstOpId);

                store.dispatch('tokenOps/setSrcAmount', null);
                store.dispatch('tokenOps/setDstAmount', null);

                return store.dispatch('shortcuts/resetShortcut', {
                    shortcutId: currentShortcutId.value,
                    stepId: firstOpId,
                });
            }
        });

        return {
            isLoading,
            nftsList,
            results,
            isModalOpen,
            shortcutStatus,
            Placeholder,
        };
    },
};
</script>
