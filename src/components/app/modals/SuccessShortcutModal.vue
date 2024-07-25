<template>
    <a-modal v-model:open="isModalOpen" centered :footer="null" :title="shortcutStatus" class="modal success-shortcut">
        <template v-if="isRequestingNfts">
            <div class="carousel-img-loader">
                <div class="shortcut-nft-image placeholder">
                    <a-spin size="large" tip="Requesting NFT images" />
                </div>
            </div>
        </template>

        <template v-else>
            <a-carousel v-if="nftsList.length > 0" autoplay class="success-shortcut-carousel">
                <div v-for="nft in nftsList" :key="nft">
                    <a-image :preview="false" :src="nft" class="shortcut-nft-image" alt="nft-image" :fallback="Placeholder">
                        <template #placeholder>
                            <div class="carousel-img-placeholder">
                                <a-spin size="large" />
                            </div>
                        </template>
                    </a-image>
                </div>
            </a-carousel>
        </template>

        <a-spin :spinning="isLoading" size="large">
            <a-row v-if="results.length > 0">
                <a-col :span="24">
                    <p class="success-shortcut-descriptions">Your shortcut has been executed, and here are the results:</p>

                    <a-divider v-if="results.length > 0" />

                    <a-list size="small" class="success-shortcut-list" :item-layout="'horizontal'" :data-source="results">
                        <template #renderItem="{ item }">
                            <a-list-item>
                                <template #extra>
                                    <div class="success-shortcut-hash-link">
                                        <ExternalLink v-if="item.explorerLink" :link="item.explorerLink" />
                                    </div>
                                </template>

                                <a-list-item-meta>
                                    <template #avatar>
                                        <div class="status-icon-container">
                                            <component :is="item.status" class="status-icon" />
                                        </div>
                                    </template>

                                    <template #title> {{ item.name }} </template>

                                    <template #description>
                                        <div class="success-shortcut-tokens-group">
                                            <template v-if="item.tokens.from.symbol">
                                                <div class="success-shortcut-tokens-group-item">
                                                    <TokenIcon :token="item.tokens.from" :width="16" :height="16" />
                                                    <Amount
                                                        :value="item.tokens.from.amount"
                                                        :symbol="item.tokens.from.symbol"
                                                        type="currency"
                                                    />
                                                </div>
                                            </template>
                                            <template v-if="item.tokens.to.symbol">
                                                <div class="success-shortcut-tokens-group-item">
                                                    <span class="divider">~</span>
                                                    <TokenIcon :token="item.tokens.to" :width="16" :height="16" />
                                                    <Amount
                                                        :value="item.tokens.to.amount"
                                                        :symbol="item.tokens.to.symbol"
                                                        type="currency"
                                                    />
                                                </div>
                                            </template>
                                        </div>
                                    </template>
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
import { defineComponent, computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import { Carousel } from 'ant-design-vue';

import Amount from '@/components/app/Amount.vue';
import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

import SUCCESS from '@/assets/icons/form-icons/check-circle.svg';
import FAILED from '@/assets/icons/form-icons/clear.svg';

import ExternalLink from '@/components/ui/ExternalLink.vue';

import Placeholder from '@/assets/images/placeholder/mask.png';

import { IShortcutOp } from '@/core/shortcuts/core/ShortcutOp';
import OperationsFactory from '@/core/operations/OperationsFactory';

import { IOperationsResult } from '@/core/operations/models/Operations';

import { ModuleType } from '@/shared/models/enums/modules.enum';
import { SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

export default defineComponent({
    name: 'SuccessShortcutModal',
    components: {
        Carousel,
        Amount,
        TokenIcon,
        ExternalLink,

        SUCCESS,
        FAILED,
    },
    setup() {
        const store = useStore();

        const isLoading = ref(false);

        const currentShortcutId = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

        const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](currentShortcutId.value));

        const { getTxExplorerLink, getChainByChainId } = useAdapter();

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

        const nftsList = ref<any>([]);

        const results = ref<any>([]);

        watch(shortcutStatus, async () => {
            if (!operationsFactory.value) return;
            if (shortcutStatus.value !== SHORTCUT_STATUSES.SUCCESS) return;

            isLoading.value = true;

            const opResults = operationsFactory.value.getOperationsResult();

            for (const operation of opResults) {
                const { hash, chainId, ecosystem } = operation as IOperationsResult;

                if (!hash || !chainId || !ecosystem) continue;

                const chainInfo = getChainByChainId(ecosystem, chainId);

                if (!chainInfo) continue;
                const explorerLink = getTxExplorerLink(hash, chainInfo as any);

                operation.explorerLink = explorerLink;
            }

            results.value = opResults as IOperationsResult[];

            isLoading.value = false;
        });

        watch(isRequestingNfts, async (value) => {
            if (!operationsFactory.value) return (isRequestingNfts.value = false);
            if (!currentOp.value) return (isRequestingNfts.value = false);

            for (const op of operationsFactory.value.getOperationOrder()) {
                const operation = operationsFactory.value.getOperationByKey(op);

                if (![ModuleType.nft].includes(operation.getModule() as ModuleType)) continue;

                const { nfts = [] } = operation.getParams();

                if (!nfts.length) continue;

                nftsList.value.push(...nfts);
            }
        });

        watch(isModalOpen, (value) => {
            if (!value || !isModalOpen.value) {
                results.value = [];
                nftsList.value = [];

                const flow = operationsFactory.value.getFullOperationFlow();

                const firstOp = flow.find((op) => op.moduleIndex.slice(-1) === '0');

                const firstOpId = operationsFactory.value.getOperationIdByKey(firstOp?.moduleIndex || flow[0].moduleIndex);

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
            isRequestingNfts,
            nftsList,
            results,
            isModalOpen,
            shortcutStatus,
            Placeholder,
        };
    },
});
</script>

<style lang="scss" scoped>
.ant-list-item {
    padding: 8px 16px 8px 0 !important;
}
</style>
@/shared/models/enums/tx-types
