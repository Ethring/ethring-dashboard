<template>
    <a-form v-if="collectionStats">
        <a-row :gutter="8" class="nft-base-info">
            <a-col :span="24" v-if="collectionStats">
                <div class="title">Quick access</div>
            </a-col>
            <a-col :span="24" v-if="collectionAddress || minterAddress">
                <p class="description" v-if="collectionAddress">
                    Collection Address:
                    <DisplayAddress :address="collectionAddress" />
                </p>
                <p class="description" v-if="minterAddress">
                    Minter:
                    <DisplayAddress :address="minterAddress" />
                </p>
            </a-col>

            <a-col :span="24">
                <a-space class="nft-base-info-time" align="center">
                    <span class="time-type"> {{ collectionType }} </span>
                    <template v-if="endTime">
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
            </a-col>

            <a-col :span="24">
                <a-row :gutter="[8, 8]" class="nft-stats">
                    <a-col :span="8" v-for="stats in collectionStats" :key="stats">
                        <a-card class="nft-stats-card">
                            <p class="type">{{ stats.type }}</p>
                            <template v-if="stats.type === 'Quantity' && stats.value === 'Unlimited'">
                                <p class="amount">Unlimited</p>
                            </template>
                            <template v-else>
                                <Amount class="amount" v-bind="stats.value" />
                            </template>
                        </a-card>
                    </a-col>
                </a-row>
            </a-col>

            <a-col :span="24">
                <a-row :gutter="[8, 8]" class="nft-stats">
                    <a-col :span="24">
                        <a-card class="nft-stats-card">
                            <p class="type">{{ priceStats.type }}</p>
                            <Amount class="amount" v-bind="priceStats.value" />
                        </a-card>
                    </a-col>
                </a-row>
            </a-col>
        </a-row>

        <a-form-item>
            <CountInput :max="perAddressLimit" />
        </a-form-item>

        <Button data-qa="confirm" v-bind="opBtnState" :title="$t(opBtnState.title)" :tip="$t(opBtnState.tip)" @click="handleOnConfirm" />
    </a-form>
</template>
<script>
import { ref, watch, computed, onMounted } from 'vue';

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// UI components
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';

// Select components
import SelectRecord from '@/components/ui/Select/SelectRecord';

// Input components
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import CountInput from '@/components/ui/CountInput.vue';

// Icons
import InfoIcon from '@/assets/icons/platform-icons/info.svg';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import useNft from '../Adapter/compositions/useNft';
import { ECOSYSTEMS } from '@/Adapter/config';
import { useStore } from 'vuex';

import Amount from '@/components/app/Amount.vue';
import DisplayAddress from '@/components/ui/DisplayAddress.vue';

import { ClockCircleOutlined } from '@ant-design/icons-vue';
import BigNumber from 'bignumber.js';

export default {
    name: 'MintNftLayout',
    components: {
        Button,
        Checkbox,
        SelectRecord,
        SelectAddressInput,
        InfoIcon,
        Amount,
        ClockCircleOutlined,
        CountInput,
        DisplayAddress,
    },
    setup() {
        const store = useStore();

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

            // - Memo (optional, Available only for COSMOS ecosystem)
            isMemoAllowed,
            isSendWithMemo,

            // - Errors
            isAddressError,
            isBalanceError,

            // - Loading
            isLoading,
            isTokensLoadingForSrc,

            // - Title for operation (Confirm, Approve, etc.)
            opTitle,

            // - Handlers
            handleOnSelectToken,
            handleOnSelectNetwork,
            handleOnSetAmount,

            fieldStates,
        } = moduleInstance;

        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        const { getCollectionInfo } = useNft(ECOSYSTEMS.COSMOS);

        const collectionType = ref('');
        const collectionStats = ref(null);
        const perAddressLimit = ref(1);
        const priceStats = ref({});
        const minterAddress = ref(null);
        const collectionAddress = ref(null);
        const price = ref('0');
        const endTime = ref(null);

        const getCollectionInfoData = async () => {
            console.log('getCollectionInfoData', selectedSrcNetwork.value?.net, contractAddress.value);

            if (!selectedSrcNetwork.value?.net || !contractAddress.value) return;

            try {
                const response = await getCollectionInfo(selectedSrcNetwork.value?.net, contractAddress.value);
                collectionAddress.value = contractAddress.value;

                if (!response) return;

                const { time } = response || {};

                if (time.endTime) endTime.value = new Date(time.endTime).valueOf();
                if (response.collectionStats) collectionStats.value = response.collectionStats;
                if (response.priceStats) priceStats.value = response.priceStats;
                if (response.price) price.value = response.price;
                if (response.collectionType) collectionType.value = response.collectionType;
                if (response.perAddressLimit) perAddressLimit.value = response.perAddressLimit;
                if (response.minterAddress) minterAddress.value = response.minterAddress;
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

        const onSelectToken = () => handleOnSelectToken({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });
        const onSelectNetwork = () => handleOnSelectNetwork({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });

        const resetAmounts = async (amount) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) {
                return;
            }

            resetAmount.value = amount === null;

            clearAddress.value = receiverAddress.value === null;
        };

        // =================================================================================================================

        watch(srcAmount, () => resetAmounts(srcAmount.value));

        watch(resetAmount, () => {
            if (resetAmount.value) {
                handleOnSetAmount(null);
                setTimeout(() => (resetAmount.value = false));
            }
        });

        watch(isConfigLoading, async () => {
            if (isConfigLoading.value) return;

            await getCollectionInfoData();
        });

        onMounted(async () => {
            if (isConfigLoading.value) return;
            await getCollectionInfoData();
        });

        watch(contractAddress, async () => {
            if (!contractAddress.value) return;

            await getCollectionInfoData();
        });

        watch(contractCallCount, () => {
            if (contractCallCount.value === 0) {
                return handleOnSetAmount(null);
            }

            const amountByCount = BigNumber(price.value).multipliedBy(contractCallCount.value).toString();

            console.log('contractCallCount', contractCallCount.value, amountByCount);

            handleOnSetAmount(amountByCount);
        });

        return {
            // Operation title
            opTitle,
            opBtnState,

            // Main Data
            selectedSrcNetwork,
            selectedSrcToken,
            srcAmount,

            // Loadings
            isMemoAllowed,

            isDisableSelect,

            // State for button
            isDisableConfirmButton,

            // Loading
            isLoading,
            isTransactionSigning,
            isTokensLoadingForSrc,

            // Errors
            isAddressError,
            isBalanceError,

            // Reset
            clearAddress,
            resetAmount,

            // handlers
            onSelectNetwork,
            onSelectToken,

            handleOnSetAmount,

            // Handle Confirm (Transaction signing)
            handleOnConfirm,

            fieldStates,
            endTime,
            collectionStats,
            priceStats,
            collectionType,
            perAddressLimit,
            collectionAddress,
            minterAddress,
        };
    },
};
</script>
