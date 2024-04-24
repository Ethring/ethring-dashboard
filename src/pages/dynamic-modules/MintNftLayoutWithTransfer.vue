<template>
    <a-form>
        <a-form-item>
            <SelectContractInput
                :selected-network="nftOpChain"
                label="tokenOperations.contractAddress"
                :onReset="clearAddress"
                :disabled="true"
            />
        </a-form-item>
        <a-row :gutter="8" class="nft-base-info" v-if="nftCollectionInfo">
            <a-col :span="24" v-if="nftCollectionInfo">
                <div class="title">Quick access</div>
            </a-col>
            <a-col :span="24" v-if="nftCollectionInfo.collectionAddress || nftCollectionInfo.minterAddress">
                <p class="description" v-if="nftCollectionInfo.minterAddress">
                    Minter address:
                    <DisplayAddress :address="nftCollectionInfo.minterAddress" />
                </p>
            </a-col>

            <a-col :span="24">
                <a-space class="nft-base-info-time" align="center">
                    <span class="time-type"> {{ nftCollectionInfo.type }} </span>
                    <a-space
                        class="time-info"
                        align="center"
                        :class="{ soldOut: nftCollectionInfo.isSoldOut, active: endTime || (!nftCollectionInfo.isSoldOut && !endTime) }"
                    >
                        <template v-if="nftCollectionInfo.isSoldOut"> Sold out </template>
                        <template v-else-if="endTime">
                            <ClockCircleOutlined class="time-icon" />
                            Ends in
                            <a-statistic-countdown class="time-countdown" format="DDd HHh" :value="endTime" />
                            <a-badge status="processing" color="#F69502" />
                        </template>
                        <template v-else-if="!endTime">
                            Live
                            <a-badge status="processing" color="#14ec8a" />
                        </template>
                        <template v-else>
                            <a-badge status="error" color="#f5222d" />
                        </template>
                    </a-space>
                </a-space>
            </a-col>

            <a-col :span="24">
                <a-row :gutter="[8, 8]" class="nft-stats">
                    <a-col :span="8" v-for="stats in nftCollectionInfo.stats">
                        <a-card class="nft-stats-card">
                            <p class="type">{{ stats.type }}</p>
                            <template v-if="getStatsType(stats) === 'string'">
                                <p class="amount">Unlimited</p>
                            </template>
                            <template v-else-if="getStatsType(stats) !== 'string'">
                                <Amount class="amount" :type="stats.value.type" :value="stats.value.value" :symbol="stats.value.symbol" />
                            </template>
                        </a-card>
                    </a-col>
                </a-row>
            </a-col>
        </a-row>

        <template v-if="nftCollectionInfo && nftCollectionInfo.perAddressLimit && !nftCollectionInfo.isSoldOut">
            <a-form-item>
                <CountInput :max="nftCollectionInfo.perAddressLimit" />
            </a-form-item>

            <a-form-item>
                <SwapField
                    name="srcAmount"
                    :value="srcAmount"
                    :label="$t('tokenOperations.from')"
                    :token="selectedSrcToken"
                    :disabled="true"
                    @set-amount="handleOnSetAmount"
                >
                    <SelectRecord
                        v-if="!fieldStates.srcNetwork?.hide"
                        :placeholder="$t('tokenOperations.selectNetwork')"
                        :current="selectedSrcNetwork"
                        @click="() => onSelectNetwork(DIRECTIONS.SOURCE)"
                        :disabled="fieldStates.srcNetwork.disabled"
                    />
                    <SelectRecord
                        v-if="!fieldStates.srcToken?.hide"
                        :placeholder="$t('tokenOperations.selectToken')"
                        :current="selectedSrcToken"
                        @click="() => onSelectToken(true, DIRECTIONS.SOURCE)"
                        :disabled="fieldStates.srcToken.disabled"
                    />
                </SwapField>
            </a-form-item>

            <EstimatePreviewInfo
                v-if="isShowEstimateInfo"
                :title="$t('tokenOperations.routeInfo')"
                :error="quoteErrorMessage"
                :is-loading="isQuoteLoading"
                :fee-in-usd="fees[FEE_TYPE.BASE] || 0"
                :main-rate="fees[FEE_TYPE.RATE] || null"
            />

            <UiButton
                data-qa="confirm"
                v-bind="opBtnState"
                :title="$t(opBtnState.title)"
                :tip="$t(opBtnState.tip)"
                @click="handleOnConfirm"
            />
        </template>
    </a-form>
</template>
<script lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';
import useNft, { INftCollectionInfo } from '@/core/wallet-adapter/compositions/useNft';

// UI components
import UiButton from '@/components/ui/Button.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';
import Amount from '@/components/app/Amount.vue';
import DisplayAddress from '@/components/ui/DisplayAddress.vue';

// Select components
import SelectRecord from '@/components/ui/Select/SelectRecord.vue';
import SwapField from '@/components/ui/SuperSwap/SwapField.vue';

// Input components
import SelectContractInput from '@/components/ui/Select/SelectContractInput.vue';
import CountInput from '@/components/ui/CountInput.vue';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

import { FEE_TYPE } from '@/shared/models/enums/fee.enum';

// Icons
import InfoIcon from '@/assets/icons/platform-icons/info.svg';
import { ClockCircleOutlined } from '@ant-design/icons-vue';

// Types
import OperationsFactory from '@/core/operations/OperationsFactory';
import { IShortcutOp } from '@/core/shortcuts/core/ShortcutOp';

export default {
    name: 'MintNftLayoutWithTransfer',
    components: {
        UiButton,
        Checkbox,
        SwapField,
        SelectRecord,
        SelectContractInput,
        InfoIcon,
        Amount,
        ClockCircleOutlined,
        CountInput,
        DisplayAddress,
        EstimatePreviewInfo,
    },
    setup() {
        const store = useStore();

        const shortcutModalState = computed(() => store.getters['app/modal']('successShortcutModal'));

        const currentShortcutId = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

        const operationsFactory = computed<OperationsFactory>(() =>
            store.getters['shortcuts/getShortcutOpsFactory'](currentShortcutId.value),
        );

        const NFTOp = computed<IShortcutOp>(() => {
            if (!currentShortcutId.value) return null;

            const NFTOp = store.getters['shortcuts/getOperationByModuleType'](currentShortcutId.value, ModuleType.nft);

            if (!NFTOp) return console.warn('No NFT operation found');

            return NFTOp;
        });

        const nftOpChain = computed(() => {
            if (!NFTOp.value) return null;

            if (!operationsFactory.value) return null;

            const op = operationsFactory.value.getOperationById(NFTOp.value.id);

            if (!op) return null;

            const chainInfo = store.getters['configs/getChainConfigByChainOrNet'](op.getChainId(), op.getEcosystem());

            if (!chainInfo) return null;

            return chainInfo;
        });

        // * Init module operations, and get all necessary data, (methods, states, etc.) for the module
        // * Also, its necessary to sign the transaction (Transaction manger)
        const { handleOnConfirm, moduleInstance, isDisableConfirmButton, isDisableSelect, isTransactionSigning } = useModuleOperations(
            ModuleType.nft,
        );

        const {
            // - Main Data
            selectedSrcToken,
            selectedSrcNetwork,

            contractAddress,
            contractCallCount,
            srcAmount,

            onlyWithBalance,

            // - Errors
            isBalanceError,

            // - Loading
            isLoading,
            isShowEstimateInfo,
            isQuoteLoading,
            isTokensLoadingForSrc,
            fees,

            isNeedInputFocus,

            quoteErrorMessage,

            // - Title for operation (Confirm, Approve, etc.)
            opTitle,

            // - Handlers
            handleOnSelectToken,
            handleOnSelectNetwork,
            handleOnSetAmount,

            fieldStates,
        } = moduleInstance;

        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        const { getCollectionInfo } = useNft('COSMOS');

        const endTime = ref<number>(0);

        const nftCollectionInfo = ref<INftCollectionInfo | null>(null);

        const getStatsType = (stats: { type: string; value: string | any }) => {
            if (stats.type === 'Quantity' && typeof stats.value === 'string' && stats.value === 'Unlimited') return 'string';
            if (typeof stats.value !== 'string') return 'object';
        };

        const getCollectionInfoData = async () => {
            if (!selectedSrcNetwork.value?.net || !contractAddress.value) return;

            try {
                const response = await getCollectionInfo(selectedSrcNetwork.value?.net, contractAddress.value);

                if (!response) return;

                const { time } = response || {};

                nftCollectionInfo.value = response;

                if (time.endTime) endTime.value = new Date(time.endTime).valueOf();
            } catch (error) {
                console.error('getCollectionInfoData', error);
            }
        };

        // =================================================================================================================

        const clearAddress = ref(false);
        const resetAmount = ref(false);

        // =================================================================================================================

        const opBtnState = computed(() => {
            return {
                class: 'module-layout-view-btn',
                type: isTransactionSigning.value || isLoading.value ? 'primary' : 'success',
                title: opTitle.value,
                tip: opTitle.value,
                loading: isTransactionSigning.value || isLoading.value,
                disabled: isDisableConfirmButton.value,
                size: 'large',
            };
        });

        // =================================================================================================================

        const onSelectNetwork = (direction: keyof typeof DIRECTIONS) =>
            handleOnSelectNetwork({ direction: DIRECTIONS[direction], type: null });

        const onSelectToken = (withBalance = false, direction: keyof typeof DIRECTIONS) => {
            onlyWithBalance.value = withBalance;

            handleOnSelectToken({
                direction: DIRECTIONS[direction],
                type: withBalance ? TOKEN_SELECT_TYPES.FROM : TOKEN_SELECT_TYPES.TO,
            });
        };

        const resetAmounts = async (amount: string | number) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) {
                return;
            }

            resetAmount.value = amount === null;
        };

        const calculateCallCount = () => {
            if (!nftCollectionInfo.value) return;

            const { priceInfo } = nftCollectionInfo.value || {};

            const { currency, usd } = priceInfo || {};

            if (!usd?.amount || !currency?.amount) {
                console.warn('No price info', usd, currency);
                return;
            }

            const { amount: nftUsdPrice } = usd || {};

            if (isNaN(Number(nftUsdPrice))) {
                console.warn('Invalid usd price for NFT', nftUsdPrice);
                return;
            }

            const { symbol } = currency || {};

            const { price: srcPrice, symbol: srcSymbol, decimals: srcDecimals } = selectedSrcToken.value || {};

            // * Calculate amount by count and src price
            const amountByCount = BigNumber(nftUsdPrice).dividedBy(srcPrice).multipliedBy(contractCallCount.value).toFixed(srcDecimals);

            if (srcSymbol !== symbol) console.warn('Different tokens', srcSymbol, symbol);

            handleOnSetAmount(amountByCount);
        };

        // =================================================================================================================

        onMounted(async () => {
            if (isConfigLoading.value) return;
            await getCollectionInfoData();
        });

        // =================================================================================================================

        store.watch(
            (state, getters) => [getters['tokenOps/contractCallCount'], getters['tokenOps/srcToken']],
            ([count, token]) => calculateCallCount(),
        );

        watch(shortcutModalState, async () => {
            if (shortcutModalState.value) return;
            if (!currentShortcutId.value) return console.warn('No current shortcut id');

            await getCollectionInfoData();
        });

        watch(nftCollectionInfo, () => {
            if (!nftCollectionInfo.value) return;
            isNeedInputFocus.value = false;
        });

        watch(srcAmount, () => resetAmounts(srcAmount.value));

        watch(resetAmount, () => {
            if (resetAmount.value) {
                handleOnSetAmount('');
                setTimeout(() => (resetAmount.value = false));
            }
        });

        watch([isConfigLoading, contractAddress], async ([configLoading, contract]) => {
            if (configLoading || !contract) return;
            await getCollectionInfoData();
        });

        return {
            // Operation title
            opTitle,
            opBtnState,

            // Main Data
            selectedSrcNetwork,
            selectedSrcToken,
            srcAmount,
            contractAddress,
            contractCallCount,

            isDisableSelect,

            // State for button
            isDisableConfirmButton,

            // Loading
            isLoading,
            isTransactionSigning,
            isTokensLoadingForSrc,

            // Errors
            isBalanceError,

            // Reset
            clearAddress,
            resetAmount,

            // handlers
            onSelectNetwork,
            onSelectToken,
            isShowEstimateInfo,
            handleOnSetAmount,

            // Handle Confirm (Transaction signing)
            handleOnConfirm,

            fieldStates,
            endTime,
            nftCollectionInfo,
            isQuoteLoading,
            fees,
            quoteErrorMessage,
            FEE_TYPE,
            DIRECTIONS,
            getStatsType,
            nftOpChain,
        };
    },
};
</script>
