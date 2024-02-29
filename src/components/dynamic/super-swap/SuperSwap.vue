<template>
    <a-form class="super-swap superswap-panel">
        <div class="reload-btn" :class="{ active: dstAmount && !isLoading }" @click="() => getEstimateInfo(true)">
            <SyncOutlined />
        </div>

        <a-form-item class="switch-direction-wrap">
            <a-form-item>
                <SwapField
                    :value="srcAmount"
                    :label="$t('tokenOperations.from')"
                    :token="selectedSrcToken"
                    :disabled="isTransactionSigning"
                    @setAmount="onSetAmount"
                >
                    <SelectRecord
                        :placeholder="$t('tokenOperations.selectNetwork')"
                        :current="selectedSrcNetwork"
                        @click="() => onSelectNetwork(DIRECTIONS.SOURCE)"
                        :disabled="isTransactionSigning"
                    />
                    <SelectRecord
                        :placeholder="$t('tokenOperations.selectToken')"
                        :current="selectedSrcToken"
                        @click="() => onSelectToken(true, DIRECTIONS.SOURCE)"
                        :disabled="isTransactionSigning || !selectedSrcNetwork"
                    />
                </SwapField>
            </a-form-item>
            <SwitchDirection icon="SwapIcon" :disabled="true" class="switch-direction" />

            <SwapField
                :label="$t('tokenOperations.to')"
                :value="dstAmount"
                :token="selectedDstToken"
                :isAmountLoading="isQuoteLoading"
                :percentage="differPercentage"
                disabled
                hide-max
            >
                <SelectRecord
                    :disabled="isTransactionSigning"
                    :placeholder="$t('tokenOperations.selectNetwork')"
                    :current="selectedDstNetwork"
                    @click="() => onSelectNetwork(DIRECTIONS.DESTINATION)"
                />
                <SelectRecord
                    :disabled="isTransactionSigning || !selectedDstNetwork"
                    :placeholder="$t('tokenOperations.selectToken')"
                    :current="selectedDstToken"
                    @click="() => onSelectToken(false, DIRECTIONS.DESTINATION)"
                />
            </SwapField>
        </a-form-item>

        <Checkbox
            v-if="selectedDstToken && selectedDstNetwork"
            v-model:value="isSendToAnotherAddress"
            :disabled="isTransactionSigning"
            :label="$t('tokenOperations.chooseAddress')"
        />

        <SelectAddressInput
            v-if="isSendToAnotherAddress && selectedDstNetwork && selectedDstToken"
            class="mt-8"
            :selected-network="selectedDstNetwork"
            :on-reset="isSendToAnotherAddress"
            :disabled="isTransactionSigning"
            @error-status="(status) => (isAddressError = status)"
        />

        <EstimatePreviewInfo
            v-if="isShowEstimateInfo || (selectedDstToken && srcAmount)"
            :title="$t('tokenOperations.routeInfo')"
            :is-loading="isQuoteLoading"
            :fee-in-usd="fees[FEE_TYPE.BASE] || 0"
            :main-rate="fees[FEE_TYPE.RATE] || null"
            :services="bestRouteInfo?.routes"
            :is-show-expand="otherRoutesInfo?.length"
            :error="quoteErrorMessage"
            :on-click-expand="toggleRoutesModal"
        />

        <Button
            :title="$t(opTitle)"
            :disabled="isDisableConfirmButton"
            :tip="$t(opTitle)"
            :loading="isTransactionSigning || isSwapLoading"
            class="module-layout-view-btn"
            data-qa="confirm"
            @click="handleOnConfirm"
            size="large"
        />
    </a-form>
</template>
<script>
import { computed, ref, inject, watch, h } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import BigNumber from 'bignumber.js';

// Services
import { getSwapTx, getBridgeTx } from '@/api/services';

// Adapter
import { ECOSYSTEMS } from '@/Adapter/config';

// Composition
import useNotification from '@/compositions/useNotification';
import useServices from '@/compositions/useServices';

// Transaction Management
import useTransactions from '../../../Transactions/compositions/useTransactions';

import SelectRecord from '@/components/ui/Select/SelectRecord';
import SelectAddressInput from '@/components/ui/Select/SelectAddressInput';
import EstimatePreviewInfo from '@/components/ui/EstimatePanel/EstimatePreviewInfo.vue';

import Checkbox from '@/components/ui/Checkbox';

import Button from '@/components/ui/Button';
import SwitchDirection from '@/components/ui/SwitchDirection.vue';

import SwapField from './SwapField';

import { formatNumber } from '@/shared/utils/numbers';

// import { getBestRoute } from '@/api/bridge-dex';

import { STATUSES, NATIVE_CONTRACT } from '@/shared/constants/super-swap/constants';
import { isCorrectChain } from '@/shared/utils/operations';

import { SyncOutlined } from '@ant-design/icons-vue';

import useModuleOperations from '@/compositions/useModuleOperation';

// Constants
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { FEE_TYPE } from '@/shared/models/enums/fee.enum';
import { ModuleType } from '@/modules/bridge-dex/enums/ServiceType.enum';

export default {
    name: 'SuperSwap',
    components: {
        Button,
        Checkbox,
        SwapField,
        SyncOutlined,

        SelectRecord,
        SelectAddressInput,
        SwitchDirection,
        EstimatePreviewInfo,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { t } = useI18n();

        const useAdapter = inject('useAdapter');

        const { name: module } = router.currentRoute.value;

        const { moduleInstance, isTransactionSigning, isDisableConfirmButton, handleOnConfirm } = useModuleOperations(ModuleType.superSwap);

        const { walletAccount, walletAddress, currentChainInfo, setChain } = useAdapter('super-swap');

        const { showNotification, closeNotification } = useNotification();

        // =================================================================================================================

        const isSwapLoading = ref(false);

        const routeInfo = computed(() => store.getters['bridgeDex/selectedRoute']);
        const bestRouteInfo = computed(() => routeInfo.value?.bestRoute);
        const otherRoutesInfo = computed(() => routeInfo.value?.otherRoutes);

        // const currentRouteInfo = computed(() => bestRouteInfo.value?.routes.find((elem) => elem.status === STATUSES.SIGNING));

        // const selectedService = computed(() => {
        //     if (currentRouteInfo.value?.service) {
        //         return currentRouteInfo.value?.service;
        //     }

        //     return null;
        // });

        // * Module values
        const {
            // --------------------------------

            isLoading,
            isQuoteLoading,
            isBalanceError,
            isShowEstimateInfo,
            isAllowanceLoading,
            isDirectionSwapped,
            isSwapDirectionAvailable,
            isTokensLoadingForSrc,
            isTokensLoadingForDst,

            // --------------------------------

            fees,
            quoteRoutes,
            selectedRoute,
            quoteErrorMessage,

            // --------------------------------

            selectedService,
            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,
            selectedDstNetwork,

            // --------------------------------

            isAddressError,
            isSendToAnotherAddress,
            receiverAddress,

            // --------------------------------

            onlyWithBalance,

            // --------------------------------

            srcAmount,
            dstAmount,

            // --------------------------------

            opTitle,

            // --------------------------------

            swapDirections,
            handleOnSelectToken,
            handleOnSelectNetwork,
        } = moduleInstance;

        // * Transaction Manager
        const { currentRequestID, transactionForSign, createTransactions, signAndSend, addTransactionToRequestID } = useTransactions();

        //  =================================================================================================================
        const successHash = ref('');
        const networkName = ref('');

        const networkFee = computed(() => {
            if (bestRouteInfo.value?.estimateFeeUsd) {
                return bestRouteInfo.value?.estimateFeeUsd;
            }

            return 0;
        });

        const estimateTime = computed(() => {
            if (bestRouteInfo.value?.estimateTime) {
                return bestRouteInfo.value.estimateTime;
            }

            return 0;
        });

        const differPercentage = computed(() => {
            const { price: srcPrice = 0 } = selectedSrcToken.value || {};
            const { price: dstPrice = 0 } = selectedDstToken.value || {};

            if (!srcPrice || !dstPrice || !srcAmount.value || !dstAmount.value) {
                return 0;
            }

            const fromUsdValue = BigNumber(srcPrice).multipliedBy(srcAmount.value);
            const toUsdValue = BigNumber(dstPrice).multipliedBy(dstAmount.value);

            if (!fromUsdValue || !toUsdValue) {
                return 0;
            }

            return toUsdValue.minus(fromUsdValue).dividedBy(toUsdValue).multipliedBy(100).toFixed(2) || 0;
        });

        // =================================================================================================================

        const onSelectNetwork = (direction) => handleOnSelectNetwork({ direction: DIRECTIONS[direction] });

        const onSelectToken = (withBalance = false, direction = DIRECTIONS.SOURCE) => {
            onlyWithBalance.value = withBalance;

            handleOnSelectToken({
                direction: DIRECTIONS[direction],
                type: withBalance ? TOKEN_SELECT_TYPES.FROM : TOKEN_SELECT_TYPES.TO,
            });

            withBalance && clearApproveForService();
        };

        // =================================================================================================================

        const disabledBtn = computed(
            () =>
                isLoading.value ||
                isBalanceError.value ||
                isSwapLoading.value ||
                isTransactionSigning.value ||
                !+srcAmount.value ||
                !dstAmount.value ||
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstToken.value ||
                (isSendToAnotherAddress.value && (isAddressError.value || !receiverAddress.value)),
        );

        // =================================================================================================================

        const toggleRoutesModal = () => store.dispatch('app/toggleModal', 'routesModal');

        // =================================================================================================================

        const onSetAmount = (value) => {
            srcAmount.value = value;

            if (!value) {
                dstAmount.value = 0;
                return (isQuoteLoading.value = false);
            }
        };

        // =================================================================================================================

        const isAllowForRequest = () => {
            const notAllData = !walletAddress.value || !selectedSrcNetwork.value;

            if (notAllData) {
                return false;
            }

            if (!selectedSrcToken.value) {
                quoteErrorMessage.value = t('tokenOperations.selectSrcToken');
                return false;
            }

            if (!selectedDstToken.value) {
                quoteErrorMessage.value = t('tokenOperations.selectDstToken');
                return false;
            }

            const isNotEVM = selectedSrcNetwork.value?.ecosystem !== ECOSYSTEMS.EVM;

            return isNotEVM || true;
        };

        // =================================================================================================================

        // const requestApprove = async (service) => {
        //     if (!isAllowForRequest() || !selectedSrcToken.value?.address) {
        //         return;
        //     }

        //     return await makeApproveRequest(service);
        // };

        // =================================================================================================================

        // const getRecipientAddress = () => {
        //     if (currentRouteInfo.value.service.type === 'swap') {
        //         return walletAddress.value;
        //     }

        //     return receiverAddress.value || walletAddress.value;
        // };

        // const swapRoutes = (resEstimate) => {
        //     const getRoutesId = (routes = []) => {
        //         if (!routes.length) {
        //             return '';
        //         }

        //         return routes.map(({ service }) => service.id).join(':');
        //     };

        //     const bestRouteServiceId = getRoutesId(bestRouteInfo.value?.routes);
        //     const otherBestRouteId = getRoutesId(resEstimate.bestRoute?.routes);

        //     const isDiffRoute = bestRouteServiceId !== otherBestRouteId;

        //     if (!isDiffRoute && !resEstimate.otherRoutes.length) {
        //         return resEstimate;
        //     }

        //     resEstimate.otherRoutes = resEstimate.otherRoutes.map((item) => {
        //         if (getRoutesId(item.routes) === bestRouteServiceId) {
        //             [resEstimate.bestRoute, item] = [item, resEstimate.bestRoute];
        //         }

        //         return item;
        //     });

        //     return resEstimate;
        // };

        // =================================================================================================================

        const getEstimateInfo = async (isReload = false) => {
            dstAmount.value = null;

            if (
                !srcAmount.value ||
                !selectedSrcToken.value ||
                !selectedDstToken.value ||
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value
            ) {
                return (isQuoteLoading.value = false);
            }

            // let resEstimate = await getBestRoute(
            //     srcAmount.value,
            //     walletAddress.value,
            //     selectedSrcToken.value,
            //     selectedDstToken.value,
            //     selectedSrcNetwork.value,
            //     selectedDstNetwork.value,
            //     currentChainInfo.value.native_token,
            // );

            // if (resEstimate && resEstimate.error) {
            //     console.log('resEstimate.error', resEstimate.error);
            //     estimateErrorTitle.value = resEstimate.error;
            //     return (isQuoteLoading.value = false);
            // }

            // const checkRoute = +resEstimate?.bestRoute?.fromTokenAmount === +srcAmount.value;

            // if (!checkRoute) {
            //     return (isQuoteLoading.value = false);
            // }

            //     if (isReload) {
            //         resEstimate = swapRoutes(resEstimate);
            //     }

            //     store.dispatch('bridgeDex/setSelectedRoute', resEstimate);

            //     dstAmount.value = BigNumber(resEstimate?.bestRoute?.toTokenAmount).decimalPlaces(6).toString() || null;

            //     if (selectedSrcNetwork.value.net !== currentChainInfo.value.net) {
            //         networkName.value = selectedSrcNetwork.value.name;
            //         opTitle.value = 'tokenOperations.switchNetwork';
            //     }

            //     estimateErrorTitle.value = '';

            //     return (isQuoteLoading.value = false);
        };

        // =================================================================================================================

        // const makeSwapRequest = async (params) => {
        //     showNotification({
        //         key: 'prepare-tx',
        //         type: 'info',
        //         title: `Swap ${srcAmount.value} ${selectedSrcToken.value.symbol} to ~${dstAmount.value} ${selectedDstToken.value.symbol}`,
        //         description: 'Please wait, transaction is preparing',
        //         duration: 0,
        //     });

        //     try {
        //         const response = await getSwapTx({
        //             ...params,
        //         });

        //         if (response.error) {
        //             txError.value = response?.error || response;
        //             txErrorTitle.value = 'Swap error';
        //             closeNotification('prepare-tx');

        //             return (isLoading.value = false);
        //         }

        //         clearApproveForService(currentRouteInfo.value.service);

        //         return response;
        //     } catch (error) {
        //         txError.value = error?.message || error?.error || error;
        //         closeNotification('prepare-tx');
        //     }
        // };

        // =================================================================================================================
        // const makeBridgeTx = async (params) => {
        //     showNotification({
        //         key: 'prepare-tx',
        //         type: 'info',
        //         title: `Bridge ${srcAmount.value} ${selectedSrcToken.value.symbol} to ~${dstAmount.value} ${selectedDstToken.value.symbol}`,
        //         description: 'Please wait, transaction is preparing',
        //         duration: 0,
        //     });

        //     try {
        //         const response = await getBridgeTx({
        //             ...params,
        //         });

        //         if (response.error) {
        //             txError.value = response?.error || response;
        //             txErrorTitle.value = 'Bridge transaction error';

        //             closeNotification('prepare-tx');

        //             return (isLoading.value = false);
        //         }

        //         clearApproveForService(currentRouteInfo.value.service);

        //         return response;
        //     } catch (error) {
        //         txError.value = error?.message || error?.error || error;
        //         closeNotification('prepare-tx');
        //     }
        // };

        // =================================================================================================================

        // const handleApprove = async () => {
        //     isLoading.value = true;

        //     await requestApprove(currentRouteInfo.value?.service);

        //     if (!srcTokenApprove.value) {
        //         return (isLoading.value = false);
        //     }

        //     txError.value = '';
        //     txErrorTitle.value = '';

        //     const txToSave = {
        //         index: 0,
        //         ecosystem: selectedSrcNetwork.value.ecosystem,
        //         module,
        //         status: STATUSES.IN_PROGRESS,
        //         parameters: {
        //             ...srcTokenApprove.value,
        //             from: walletAddress.value,
        //         },
        //         account: walletAccount.value,
        //         chainId: `${selectedSrcNetwork.value?.chain_id}`,
        //         metaData: {
        //             action: 'formatTransactionForSign',
        //             type: TRANSACTION_TYPES.APPROVE,
        //             successCallback: {
        //                 action: 'GET_ALLOWANCE',
        //                 requestParams: {
        //                     url: selectedService.value.url,
        //                     net: selectedSrcNetwork.value.net,
        //                     tokenAddress: selectedSrcToken.value.address,
        //                     ownerAddress: walletAddress.value,
        //                     service: selectedService.value,
        //                 },
        //             },
        //         },
        //     };

        //     await createTransactions([txToSave]);
        // };

        // const handleOperationByType = async () => {
        //     const OPERATIONS = {
        //         dex: makeSwapRequest,
        //         bridge: makeBridgeTx,
        //     };

        //     opTitle.value = 'tokenOperations.confirm';

        //     const { type } = currentRouteInfo.value?.service || {};

        //     if (!type) {
        //         return (isLoading.value = false);
        //     }

        //     if (!OPERATIONS[type]) {
        //         return;
        //     }

        //     const params = {
        //         url: currentRouteInfo.value.service.url,
        //         net: currentRouteInfo.value.net,
        //         fromTokenAddress: currentRouteInfo.value.fromToken?.address || NATIVE_CONTRACT,
        //         fromNet: currentRouteInfo.value.net,
        //         amount: currentRouteInfo.value.amount,
        //         toNet: currentRouteInfo.value.toNet,
        //         toTokenAddress: currentRouteInfo.value.toToken?.address || NATIVE_CONTRACT,
        //         ownerAddress: walletAddress.value,
        //         slippage: 1,
        //     };

        //     if (currentRouteInfo.value.service?.recipientAddress) {
        //         params.recipientAddress = getRecipientAddress();
        //         params.fallbackAddress = walletAddress.value;
        //     }

        //     const response = await OPERATIONS[type]({ ...params });

        //     const txToSave = {
        //         ecosystem: selectedSrcNetwork.value.ecosystem,
        //         module,
        //         status: STATUSES.IN_PROGRESS,
        //         parameters: response,
        //         account: walletAccount.value,
        //         chainId: `${selectedSrcNetwork.value?.chain_id}`,
        //         metaData: {
        //             action: 'formatTransactionForSign',
        //             type: type.toUpperCase(),
        //             from: `${selectedSrcNetwork.value?.chain_id}`,
        //             to: `${selectedDstNetwork.value?.chain_id}`,
        //             receiverAddress: receiverAddress.value,
        //         },
        //     };

        //     if (currentRequestID.value && currentRequestID.value !== '') {
        //         return await addTransactionToRequestID(currentRequestID.value, txToSave);
        //     }

        //     txToSave.index = 0;

        //     return await createTransactions([txToSave]);
        // };

        // const swap = async () => {
        //     const network = networkName.value === selectedDstNetwork.value.name ? selectedDstNetwork : selectedSrcNetwork;

        //     const { isChanged, btnTitle } = await isCorrectChain(network, currentChainInfo, setChain);

        //     opTitle.value = btnTitle;

        //     if (!isChanged) {
        //         isLoading.value = false;
        //         return;
        //     }

        //     opTitle.value = 'tokenOperations.confirm';

        //     isSwapLoading.value = true;
        //     txError.value = '';

        //     // APPROVE
        //     if (isNeedApprove.value) {
        //         opTitle.value = 'tokenOperations.approve';
        //         await handleApprove();
        //     } else {
        //         await handleOperationByType();
        //     }

        //     if (!transactionForSign.value) {
        //         isSwapLoading.value = false;
        //         return (isLoading.value = false);
        //     }

        //     closeNotification('prepare-tx');

        //     try {
        //         const responseSendTx = await signAndSend(transactionForSign.value);

        //         if (responseSendTx.error) {
        //             txError.value = responseSendTx.error;
        //             txErrorTitle.value = 'Swap Transaction error';
        //             return;
        //         }

        //         isSwapLoading.value = false;

        //         if (!isNeedApprove.value) {
        //             const data = {
        //                 bestRoute: bestRouteInfo.value.routes?.map((elem, i) => {
        //                     if (elem.status === STATUSES.SIGNING) {
        //                         elem.status = STATUSES.COMPLETED;
        //                     } else if (
        //                         elem.status === STATUSES.PENDING &&
        //                         bestRouteInfo.value.routes[i - 1]?.status == STATUSES.COMPLETED
        //                     ) {
        //                         elem.status = STATUSES.SIGNING;
        //                     }
        //                     return elem;
        //                 }),
        //                 otherRoutes: otherRoutesInfo.value,
        //             };

        //             store.dispatch('bridgeDex/setSelectedRoute', data);
        //         }

        //         const data = {
        //             bestRoute: bestRouteInfo.value.routes?.find((elem) => elem.status === STATUSES.SIGNING),
        //             otherRoutes: otherRoutesInfo.value,
        //         };

        //         store.dispatch('bridgeDex/setSelectedRoute', data);

        //         if (!currentRouteInfo.value) {
        //             return store.dispatch('bridgeDex/setSelectedRoute', null);
        //         }

        //         if (currentRouteInfo.value.net !== selectedSrcNetwork.value.net) {
        //             store.dispatch('tokens/setDisableLoader', true);
        //             return (networkName.value = selectedDstNetwork.value.name);
        //         }
        //     } catch (error) {
        //         txError.value = error?.message || error?.error || error;
        //         txErrorTitle.value = 'Swap Transaction error';
        //         isLoading.value = false;
        //         isSwapLoading.value = false;
        //     }
        // };

        // =================================================================================================================

        // watch([selectedSrcNetwork, selectedSrcToken, selectedDstNetwork, selectedDstToken], async () => await getEstimateInfo());

        watch(srcAmount, async () => {
            if (!selectedDstToken.value || !srcAmount.value) {
                dstAmount.value = 0;
                return (isQuoteLoading.value = false);
            }

            return await getEstimateInfo();
        });

        // watch(isTransactionSigning, () => {
        //     if (!currentRouteInfo.value && !isTransactionSigning.value) {
        //         // reset values

        //         onSetAmount(null);
        //         networkFee.value = 0;
        //         estimateErrorTitle.value = '';
        //         isSwapLoading.value = false;
        //         isLoading.value = false;
        //         return;
        //     }
        // });

        return {
            isLoading,
            isSwapLoading,

            isTokensLoadingForSrc,
            isTokensLoadingForDst,

            isTransactionSigning,

            disabledBtn,
            isSendToAnotherAddress,
            estimateTime,

            isQuoteLoading,
            isShowEstimateInfo,

            dstAmount,
            srcAmount,

            opTitle,

            bestRouteInfo,
            otherRoutesInfo,

            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,

            DIRECTIONS,
            TOKEN_SELECT_TYPES,

            successHash,
            currentChainInfo,
            networkFee,

            differPercentage,

            onSetAmount,

            swap: () => {
                console.log('swap');
            },
            isDisableConfirmButton,

            getEstimateInfo,
            toggleRoutesModal,
            formatNumber,

            onSelectNetwork,

            handleOnConfirm,
            onSelectToken,

            FEE_TYPE,
            fees,

            isQuoteLoading,
            quoteErrorMessage,
        };
    },
};
</script>
<style lang="scss">
.superswap-panel {
    .route-info {
        @include pageFlexRow;

        * {
            margin: 0;
        }

        p {
            color: var(--#{$prefix}accordion-title);
            font-size: var(--#{$prefix}small-lg-fs);
            line-height: var(--#{$prefix}default-fs);
            font-weight: 600;
        }

        .error-text {
            margin-left: 8px;
            font-weight: 500;
            color: var(--#{$prefix}warning);
            opacity: 0.8;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            max-width: 400px;
        }

        .fee {
            color: var(--#{$prefix}warning);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 600;
        }

        .symbol {
            font-weight: 300;
            color: var(--#{$prefix}base-text);
        }

        svg {
            margin: 0 4px 0 12px;
        }

        svg path {
            fill: var(--#{$prefix}base-text);
        }

        h4 {
            margin-left: 16px;
            font-weight: 400;
            color: var(--#{$prefix}base-text);

            span {
                color: var(--#{$prefix}base-text);
                font-weight: 600;
            }
        }
    }

    .routes {
        @include pageFlexRow;
        padding: 12px 0;
        width: 96%;

        border-top: 2px solid var(--#{$prefix}collapse-border-color);

        div {
            @include pageFlexRow;
        }

        img {
            width: 22px;
            height: 22px;
            margin-right: 8px;
            border-radius: 50%;
        }

        .name {
            font-size: var(--#{$prefix}small-lg-fs);
            color: var(--#{$prefix}base-text);
            font-weight: 600;
            margin: 0 10px 0 2px;
        }

        svg.arrow {
            fill: var(--#{$prefix}select-icon-color);
            transform: rotate(-90deg) scale(0.7);
            @include animateEasy;
        }

        svg.expand {
            cursor: pointer;
            fill: var(--#{$prefix}base-text);
            margin-left: 4px;
            @include animateEasy;
        }
    }

    .accordion__content {
        img {
            width: 16px;
            height: 16px;
        }
    }

    .accordion-item {
        position: relative;
        &__value {
            .route {
                @include pageFlexRow;
                margin-left: 6px;

                .name {
                    margin-left: 6px;
                }
            }
        }
        &__row {
            display: flex;
        }
    }

    &__btn {
        height: 64px;
        width: 100%;
    }
}
</style>
