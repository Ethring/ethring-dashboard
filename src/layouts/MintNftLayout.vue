<template>
    <a-form v-if="nftCollectionInfo">
        <a-row :gutter="8" class="nft-base-info">
            <a-col :span="24" v-if="nftCollectionInfo">
                <div class="title">Quick access</div>
            </a-col>
            <a-col :span="24" v-if="nftCollectionInfo.collectionAddress || nftCollectionInfo.minterAddress">
                <p class="description" v-if="nftCollectionInfo.collectionAddress">
                    Collection Address:
                    <DisplayAddress :address="nftCollectionInfo.collectionAddress" />
                </p>
                <p class="description" v-if="nftCollectionInfo.minterAddress">
                    Minter:
                    <DisplayAddress :address="nftCollectionInfo.minterAddress" />
                </p>
            </a-col>

            <a-col :span="24">
                <a-space class="nft-base-info-time" align="center">
                    <span class="time-type"> {{ nftCollectionInfo.type }} </span>
                    <a-space
                        class="time-info"
                        align="center"
                        :class="{ soldOut: nftCollectionInfo.isSoldOut, active: endTime, ended: !endTime }"
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
                            <template v-if="stats.type === 'Quantity' && stats.value === 'Unlimited'">
                                <p class="amount">Unlimited</p>
                            </template>
                            <template v-else>
                                <Amount class="amount" v-bind="stats.value as Object" />
                            </template>
                        </a-card>
                    </a-col>
                </a-row>
            </a-col>

            <a-col :span="24">
                <a-row :gutter="[8, 8]" class="nft-stats">
                    <a-col :span="24">
                        <a-card class="nft-stats-card">
                            <p class="type">{{ nftCollectionInfo.priceStats.type }}</p>
                            <Amount class="amount" v-bind="nftCollectionInfo.priceStats.value as Object" />
                        </a-card>
                    </a-col>
                </a-row>
            </a-col>
        </a-row>

        <template v-if="!nftCollectionInfo.isSoldOut">
            <a-form-item>
                <CountInput :max="nftCollectionInfo.perAddressLimit" />
            </a-form-item>

            <Button
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

// Compositions
import useModuleOperations from '@/compositions/useModuleOperation';

// UI components
import Button from '@/components/ui/Button.vue';
import Checkbox from '@/components/ui/Checkbox.vue';

// Select components
import SelectRecord from '@/components/ui/Select/SelectRecord.vue';

// Input components
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput.vue';
import CountInput from '@/components/ui/CountInput.vue';

// Icons
import InfoIcon from '@/assets/icons/platform-icons/info.svg';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import useNft, { INftCollectionInfo } from '../Adapter/compositions/useNft';
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

            // - Errors
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

        const { getCollectionInfo } = useNft(ECOSYSTEMS.COSMOS as 'COSMOS');

        const endTime = ref(null);

        const nftCollectionInfo = ref<INftCollectionInfo>(null);

        const getCollectionInfoData = async () => {
            console.log('getCollectionInfoData', selectedSrcNetwork.value?.net, contractAddress.value);

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

        const onSelectToken = () => handleOnSelectToken({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });
        const onSelectNetwork = () => handleOnSelectNetwork({ direction: DIRECTIONS.SOURCE, type: TOKEN_SELECT_TYPES.FROM });

        const resetAmounts = async (amount) => {
            const allowDataTypes = ['string', 'number'];

            if (allowDataTypes.includes(typeof amount)) {
                return;
            }

            resetAmount.value = amount === null;
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

            if (!nftCollectionInfo.value) return;

            const { price } = nftCollectionInfo.value;

            const amountByCount = BigNumber(price).multipliedBy(contractCallCount.value).toString();

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

            handleOnSetAmount,

            // Handle Confirm (Transaction signing)
            handleOnConfirm,

            fieldStates,
            endTime,
            nftCollectionInfo,
        };
    },
};
</script>
