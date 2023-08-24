<template>
    <div class="superswap-panel">
        <div class="select-group">
            <SelectNetwork
                :items="zometNetworks"
                :current="selectedSrcNetwork || currentChainInfo"
                @select="onSelectSrcNetwork"
                label="From"
                placeholder="Select network"
            />
            <SelectNetwork
                :items="filteredSupportedChains"
                :current="selectedDstNetwork"
                @select="onSelectDstNetwork"
                label="To"
                placeholder="Select network"
            />
        </div>
        <SelectAmount
            v-if="zometNetworks"
            :selected-network="selectedSrcNetwork"
            :items="zometNetworks"
            :value="selectedSrcToken"
            :error="!!errorBalance"
            :label="$t('tokenOperations.send')"
            :on-reset="resetAmount"
            class="mt-10"
            @setAmount="onSetAmount"
            @clickToken="onSetSrcToken"
        />
        <SelectAmount
            v-if="selectedDstToken && selectedDstNetwork"
            :selected-network="selectedDstNetwork"
            :value="selectedDstToken"
            :label="$t('tokenOperations.receive')"
            :disabled-value="prettyNumberTooltip(receiveValue)"
            :disabled="true"
            :on-reset="resetAmount"
            class="mt-10"
            @clickToken="onSetDstToken"
            hide-max
        />
        <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
        <InfoPanel v-if="txError" :title="txError" class="mt-10" />
        <InfoPanel v-if="networkError" :title="$t('tokenOperations.changeNetwork')" class="mt-10" />
        <InfoPanel v-if="successHash" :hash="successHash" :title="$t('tx.txHash')" type="success" class="mt-10" />
        <Checkbox
            v-if="selectedSrcNetwork && selectedDstNetwork && selectedSrcNetwork?.chain_id !== selectedDstNetwork?.chain_id"
            id="receiveToken"
            v-model:value="receiveToken"
            :label="`Recipient's ${selectedDstNetwork?.name} address`"
            class="mt-10"
        >
        </Checkbox>
        <SelectAddress
            v-if="receiveToken"
            :selected-network="selectedDstNetwork"
            :error="!!errorAddress"
            placeholder="0x..."
            class="mt-10"
            :on-reset="successHash"
            @setAddress="onSetAddress"
        />
        <Accordion v-if="receiveValue" :title="setReceiveValue" class="mt-10">
            <div class="accordion__content">
                <AccordionItem :label="$t('tokenOperations.networkFee') + ' : '">
                    <span class="fee">{{ networkFee }}</span> <span class="symbol"> $</span>
                </AccordionItem>
                <AccordionItem :label="$t('tokenOperations.time') + ' : '">
                    <span class="fee"> {{ '< ' + Math.round(bestRoute.estimateTime / 60) + ' min' }}</span>
                </AccordionItem>
                <AccordionItem label="Routes : ">
                    <div class="route" v-for="item in bestRoute.routes" :key="item">
                        <img :src="item.service.icon" />
                        <div class="name">{{ item.service.name }}</div>
                    </div>
                    <div v-if="otherRoutes.length" class="other-routes" v-on:click.stop="setShowRoutesModal">
                        +{{ otherRoutes.length }} routes
                    </div>
                </AccordionItem>
            </div>
        </Accordion>
        <Button
            xl
            :title="
                needApprove
                    ? $t('tokenOperations.approve')
                    : needNetworkChange
                    ? $t('superSwap.changeNetwork') + ' ' + networkName
                    : $t('tokenOperations.confirm').toUpperCase()
            "
            :disabled="!!disabledBtn"
            :loading="isLoading"
            class="superswap-panel__btn mt-10"
            @click="swap"
        />
    </div>
</template>
<script>
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ethers } from 'ethers';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

import InfoPanel from '@/components/ui/InfoPanel';
import SelectAmount from '@/components/ui/SelectAmount';
import SelectAddress from '@/components/ui/SelectAddress';
import SelectNetwork from '@/components/dynamic/bridge/SelectNetwork';
import Accordion from '@/components/ui/Accordion';
import AccordionItem from '@/components/ui/AccordionItem';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';

import { toMantissa } from '@/helpers/numbers';
import { prettyNumber, prettyNumberTooltip } from '@/helpers/prettyNumber';
import { getTxUrl } from '@/helpers/utils';

import { services } from '@/config/bridgeServices';

import { findBestRoute, getTokensByService } from '@/modules/SuperSwap/baseScript';

import { STATUSES, NATIVE_CONTRACT } from '@/shared/constants/superswap/constants';

export default {
    name: 'SuperSwap',
    components: {
        InfoPanel,
        SelectAmount,
        SelectNetwork,
        SelectAddress,
        Button,
        Accordion,
        AccordionItem,
        Checkbox,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { walletAddress, currentChainInfo, connectedWallet, setChain } = useWeb3Onboard();
        const { groupTokens, allTokensFromNetwork, getTokenList } = useTokens();

        const isLoading = ref(false);
        const needApprove = ref(false);
        const balanceUpdated = ref(false);
        const receiveToken = ref(false);
        const approveTx = ref(null);
        const bestRoute = ref({});
        const otherRoutes = ref([]);
        const currentRoute = ref({});
        const txError = ref('');
        const networkError = ref(false);
        const successHash = ref('');
        const networkName = ref('');
        const resetAmount = ref(false);
        const networkFee = ref(0);
        const estimateRate = ref(0);
        const needNetworkChange = ref(false);
        const callEstimate = ref(false);
        const setReceiveValue = ref('');
        const updateFromToken = ref(false);
        const zometNetworks = computed(() => store.getters['networks/zometNetworksList']);

        const selectedSrcNetwork = computed(() => store.getters['bridge/selectedSrcNetwork']);
        const selectedDstNetwork = computed(() => store.getters['bridge/selectedDstNetwork']);
        const supportedChains = computed(() => store.getters['bridge/supportedChains']);

        const selectedSrcToken = computed(() => store.getters['tokens/fromToken']);
        const selectedDstToken = computed(() => store.getters['tokens/toToken']);

        const bestRouteInfo = computed(() => store.getters['swap/bestRoute']);
        const showRoutesModal = computed(() => store.getters['swap/showRoutes']);

        const amount = ref('');
        const receiveValue = ref('');
        const address = ref('');
        const allowance = ref(null);

        const errorAddress = ref('');
        const errorBalance = ref('');

        onMounted(async () => {
            store.dispatch('bridge/getSupportedChains');
        });

        watch(showRoutesModal, () => {
            if (!showRoutesModal.value) {
                bestRoute.value = bestRouteInfo.value.bestRoute;
                otherRoutes.value = bestRouteInfo.value.otherRoutes;
                currentRoute.value = bestRoute.value.routes.find((elem) => elem.status === STATUSES.SIGNING);
                receiveValue.value = bestRouteInfo.value.bestRoute?.toTokenAmount;
                networkFee.value = prettyNumberTooltip(bestRouteInfo.value.bestRoute?.estimateFeeUsd, 4);
                estimateRate.value = prettyNumberTooltip(
                    bestRouteInfo.value.bestRoute.toTokenAmount / bestRouteInfo.value.bestRoute.fromTokenAmount,
                    6
                );
                needApprove.value = currentRoute.value?.needApprove;
                if (needApprove.value) {
                    getApproveTx();
                }
            }
        });

        const disabledBtn = computed(() => {
            return (
                isLoading.value ||
                errorBalance.value ||
                !+amount.value ||
                !receiveValue.value ||
                !selectedSrcNetwork.value ||
                !selectedDstNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstToken.value ||
                txError.value ||
                networkError.value
            );
        });

        const clearApprove = () => {
            needApprove.value = false;
            approveTx.value = null;
            receiveValue.value = '';
            allowance.value = null;
        };

        const tokensList = async (network, field) => {
            if (!network) {
                return [];
            }
            let listWithBalances = [];
            let selectedNetwork = {};
            if (network.list?.length) {
                listWithBalances = getTokenList(network);
            } else {
                selectedNetwork = groupTokens.value.find((elem) => elem?.chain_id === (network?.chain_id || network?.chainId));
                if (!selectedNetwork && field === 'from') {
                    return [];
                }
                listWithBalances = getTokenList(selectedNetwork);
            }

            const list = [
                ...listWithBalances,
                ...allTokensFromNetwork(network.net).filter((token) => {
                    return token.net !== network.net && !listWithBalances?.find((t) => t.net === token.net);
                }),
            ];
            return list;
        };

        const filteredSupportedChains = computed(() => {
            if (!supportedChains.value && !supportedChains.value.length) {
                return [];
            }
            if (selectedSrcNetwork.value) {
                if (!supportedChains.value?.find((elem) => selectedSrcNetwork.value.net === elem.net)) {
                    return [
                        {
                            ...selectedSrcNetwork.value,
                            logoURI: zometNetworks.value?.find((elem) => selectedSrcNetwork.value?.net === elem?.net)?.logo,
                        },
                    ];
                }
            }

            const list = groupTokens?.value.filter((item) => {
                const supportedChain = supportedChains.value?.find((network) => network.net === item.net);
                if (supportedChain) {
                    item.logoURI = supportedChain.logoURI;
                    return true;
                }
                return false;
            });

            if (selectedDstNetwork.value) {
                return list.filter((chain) => chain.net !== selectedDstNetwork.value.net);
            }
            return list;
        });

        const onSelectSrcNetwork = async (network) => {
            if (network?.net === currentChainInfo.value?.net) {
                networkError.value = false;
            }

            clearApprove();

            const tokens = await tokensList(network, 'from');
            const srcNetwork = groupTokens.value?.find((elem) => elem.net === network.net);

            if (!selectedSrcToken.value || updateFromToken.value) {
                if (!tokens[0]?.balanceUsd) {
                    const usdcToken = tokens.find((elem) => elem.code === 'USDC');
                    store.dispatch('tokens/setFromToken', usdcToken || tokens[0]);
                } else {
                    store.dispatch('tokens/setFromToken', tokens[0]);
                }
                updateFromToken.value = false;
            }

            store.dispatch('bridge/setSelectedSrcNetwork', srcNetwork || network);

            if (selectedSrcNetwork.value !== network) {
                txError.value = '';
                if (network.chainId || network.chain_id) {
                    await setChain({
                        chainId: network.chainId || network.chain_id,
                    });
                }
                updateFromToken.value = true;
                await getTokensByService(network.chainId || network.chain_id || currentChainInfo.value.chainId);
            }
        };

        const onSelectDstNetwork = async (network) => {
            callEstimate.value = true;

            if (selectedDstNetwork.value?.net === network?.net && selectedDstToken.value) {
                return store.dispatch('tokens/setToToken', selectedDstToken.value);
            }

            store.dispatch('bridge/setSelectedDstNetwork', network);

            const tokens = await tokensList(network, 'to');
            const foundToken = tokens.find((elem) => elem.code === selectedDstToken?.value?.code);
            if (!selectedDstToken.value || !foundToken) {
                const tokenTo = tokens.find((elem) => elem.code !== selectedSrcToken.value.code);
                if (tokenTo) {
                    store.dispatch('tokens/setToToken', tokenTo);
                } else {
                    store.dispatch('tokens/setToToken', tokens[0]);
                }
            } else {
                store.dispatch('tokens/setToToken', foundToken);
            }

            clearApprove();
            onSetAmount(amount.value);
        };

        const onSetSrcToken = () => {
            store.dispatch('tokens/setSelectType', 'from');
            router.push('/superSwap/select-token');

            balanceUpdated.value = false;

            clearApprove();
        };

        const onSetDstToken = async () => {
            store.dispatch('tokens/setSelectType', 'to');
            router.push('/superSwap/select-token');

            balanceUpdated.value = false;

            clearApprove();
            onSetAmount(amount.value);
        };

        const setShowRoutesModal = () => {
            store.dispatch('swap/setShowRoutes', true);
        };

        const onSetAddress = (addr) => {
            const reg = new RegExp(selectedDstNetwork.value.validating);
            address.value = addr;

            if (address.value.length && !reg.test(addr)) {
                errorAddress.value = 'Invalid address';
                return;
            }
            errorAddress.value = '';
        };

        const onSetAmount = async (value) => {
            if (isNaN(+value)) {
                errorBalance.value = 'Incorrect amount';
                return;
            }

            if (!+value) {
                return;
            }
            if (amount.value !== value || callEstimate.value) {
                receiveValue.value = '';
                amount.value = value;
                await getEstimateInfo();
                callEstimate.value = false;
            }

            if (+value > selectedSrcToken.value.balance.amount || +value > selectedSrcToken.value.balance.mainBalance) {
                errorBalance.value = 'Insufficient balance';
            } else {
                errorBalance.value = '';
            }
        };

        const checkAllowance = async (amount) => {
            if (allowance.value >= toMantissa(amount, currentRoute.value.fromToken?.decimals)) {
                needApprove.value = false;
            } else {
                if (!approveTx.value && currentRoute.value.fromToken?.address) {
                    needApprove.value = true;
                    await getApproveTx();
                }
            }
        };

        const getAllowance = async () => {
            approveTx.value = null;
            needApprove.value = false;
            if (currentRoute.value.fromToken?.address && currentRoute.value?.service) {
                const resAllowance = await store.dispatch(currentRoute.value.service.type + '/getAllowance', {
                    url: currentRoute.value.service.url,
                    net: currentRoute.value.net,
                    tokenAddress: currentRoute.value.fromToken?.address,
                    ownerAddress: walletAddress.value,
                });
                if (resAllowance.error) {
                    return;
                }

                allowance.value = resAllowance.allowance || resAllowance;
            }
        };

        const getApproveTx = async () => {
            if (currentRoute.value.fromToken?.address && currentRoute.value?.service) {
                const resApproveTx = await store.dispatch(currentRoute.value.service.type + '/getApproveTx', {
                    url: currentRoute.value.service.url,
                    net: currentRoute.value.net,
                    tokenAddress: currentRoute.value.fromToken?.address,
                    ownerAddress: walletAddress.value,
                });

                if (resApproveTx.error) {
                    return;
                }
                approveTx.value = resApproveTx;
            }
        };

        const getEstimateInfo = async () => {
            if (
                !selectedSrcNetwork.value ||
                !selectedSrcToken.value ||
                !selectedDstNetwork.value ||
                !selectedDstToken.value ||
                !+amount.value
            ) {
                return;
            }
            if (selectedSrcNetwork.value.net !== currentChainInfo.value.net) {
                networkError.value = true;
            }
            isLoading.value = true;
            const resEstimate = await findBestRoute(amount.value, walletAddress.value);

            if (resEstimate?.error) {
                txError.value = resEstimate.error;
                isLoading.value = false;
                return;
            }
            store.dispatch('swap/setBestRoute', resEstimate);
            currentRoute.value = resEstimate.bestRoute.routes.find((elem) => elem.status === STATUSES.SIGNING);
            if (currentRoute.value.needApprove) {
                needApprove.value = true;
                getApproveTx();
            }

            bestRoute.value = resEstimate.bestRoute;
            otherRoutes.value = resEstimate.otherRoutes || [];
            txError.value = '';
            receiveValue.value = resEstimate.bestRoute?.toTokenAmount;
            networkFee.value = prettyNumberTooltip(resEstimate.bestRoute?.estimateFeeUsd, 4);
            estimateRate.value = prettyNumberTooltip(resEstimate.bestRoute.toTokenAmount / resEstimate.bestRoute.fromTokenAmount, 6);
            setReceiveValue.value = `Rate: <span class='symbol'>1</span> ${selectedSrcToken?.value.code || ''} = <span class='symbol'>${
                estimateRate.value
            }</span> ${selectedDstToken?.value.code || ''}`;
            isLoading.value = false;
        };

        const getProvider = () => {
            const { provider } = connectedWallet.value || {};
            if (provider) {
                const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
                return ethersProvider;
            }
        };

        const sendTransaction = async (transaction) => {
            const ethersProvider = getProvider();
            const tx = {
                data: transaction.data,
                from: transaction.from,
                to: transaction.to,
                chainId: `0x${transaction?.chainId?.toString(16)}`,
                value: transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0',
            };
            try {
                if (ethersProvider) {
                    const signer = ethersProvider.getSigner();
                    const txn = await signer.sendTransaction(tx);

                    const receipt = await txn.wait();

                    return receipt;
                }
            } catch (e) {
                return { error: e.message };
            }
        };

        const getRecipientAddress = () => {
            if (currentRoute.value.service.type === 'swap') {
                return walletAddress.value;
            }
            return address.value || walletAddress.value;
        };

        const swap = async () => {
            if (needNetworkChange.value) {
                await setChain({
                    chainId: selectedDstNetwork.value.chain_id,
                });
                needNetworkChange.value = false;

                setTimeout(async () => {
                    if (currentRoute.value.net === currentChainInfo.value.net) {
                        await swap();
                    }
                }, 2000);
                return;
            }
            isLoading.value = true;
            txError.value = '';
            // APPROVE
            if (approveTx.value) {
                const resTx = await sendTransaction({ ...approveTx.value, from: walletAddress.value });
                if (resTx.error) {
                    txError.value = resTx.error;
                    isLoading.value = false;
                    setTimeout(() => {
                        txError.value = '';
                    }, 2000);
                    return;
                }

                approveTx.value = null;
                successHash.value = getTxUrl(currentRoute.value.net, resTx.transactionHash);
                resetAmount.value = false;
                setTimeout(async () => {
                    await getAllowance();
                    await checkAllowance(amount.value);
                    isLoading.value = false;
                    successHash.value = '';
                }, 5000);
                return;
            }
            let serviceApi = null;
            if (currentRoute.value.service?.type === 'bridge') {
                serviceApi = currentRoute.value.service.type + '/getBridgeTx';
            } else {
                serviceApi = currentRoute.value.service.type + '/getSwapTx';
            }
            const params = {
                url: currentRoute.value.service.url,
                net: currentRoute.value.net,
                fromTokenAddress: currentRoute.value.fromToken?.address || NATIVE_CONTRACT,
                fromNet: currentRoute.value.net,
                amount: prettyNumber(currentRoute.value.amount, 6),
                toNet: currentRoute.value.toNet,
                toTokenAddress: currentRoute.value.toToken?.address || NATIVE_CONTRACT,
                ownerAddress: walletAddress.value,
                slippage: 1,
            };
            if (currentRoute.value.service?.recipientAddress) {
                params.recipientAddress = getRecipientAddress();
                params.fallbackAddress = walletAddress.value;
            }
            if (currentRoute.value.service?.isStableSwap) {
                delete params.slippage;
            }
            const resSwap = await store.dispatch(serviceApi, params);

            if (resSwap.error) {
                txError.value = resSwap.error;
                isLoading.value = false;
                setTimeout(() => {
                    txError.value = '';
                }, 2000);
                return;
            }

            const resTx = await sendTransaction(resSwap);
            if (resTx.error) {
                txError.value = resTx.error;
                isLoading.value = false;
                setTimeout(() => {
                    txError.value = '';
                }, 2000);
                return;
            }

            successHash.value = getTxUrl(currentRoute.value.net, resTx.transactionHash);
            isLoading.value = false;

            bestRoute.value.routes = bestRoute.value.routes?.map((elem, i) => {
                if (elem.status === STATUSES.SIGNING) {
                    elem.status = STATUSES.COMPLETED;
                }
                if (elem.status === STATUSES.PENDING && bestRoute.value.routes[i - 1]?.status == STATUSES.COMPLETED) {
                    elem.status = STATUSES.SIGNING;
                }
                return elem;
            });
            currentRoute.value = bestRoute.value.routes?.find((elem) => elem.status === STATUSES.SIGNING);
            if (currentRoute.value) {
                resetAmount.value = false;
                if (currentRoute.value.net === selectedSrcNetwork.value.net) {
                    needNetworkChange.value = false;
                    if (currentRoute.value.needApprove) {
                        needApprove.value = true;
                        await getApproveTx();
                    }
                    await swap();
                } else {
                    store.dispatch('tokens/setDisableLoader', true);
                    networkName.value = selectedDstNetwork.value.name;
                    needNetworkChange.value = true;
                }
            } else {
                receiveValue.value = null;
                resetAmount.value = true;
                amount.value = '';
                errorBalance.value = '';
                store.dispatch('swap/setBestRoute', null);
            }

            setTimeout(() => {
                successHash.value = '';
            }, 5000);

            setTimeout(() => {
                store.dispatch('tokens/updateTokenBalances', {
                    net: selectedSrcNetwork.value.net,
                    address: walletAddress.value,
                    info: selectedSrcNetwork.value,
                    update(wallet) {
                        balanceUpdated.value = true;
                        store.dispatch('bridge/setSelectedSrcNetwork', wallet);
                    },
                });
                balanceUpdated.value = false;
                store.dispatch('tokens/updateTokenBalances', {
                    net: selectedDstNetwork.value.net,
                    address: walletAddress.value,
                    info: selectedDstNetwork.value,
                    update(wallet) {
                        balanceUpdated.value = true;
                        store.dispatch('bridge/setSelectedDstNetwork', wallet);
                    },
                });
            }, 3000);
        };

        watch(balanceUpdated, () => {
            if (balanceUpdated.value) {
                setTimeout(() => {
                    tokensList(selectedSrcNetwork.value).then((tokens) => {
                        let tokenFrom = tokens.find((elem) => elem.code === selectedSrcToken.value.code);
                        if (tokenFrom) {
                            store.dispatch('tokens/setFromToken', tokenFrom);
                        }
                    });
                    tokensList(selectedDstNetwork.value).then((tokens) => {
                        let tokenTo = tokens.find((elem) => elem.code === selectedDstToken.value.code);
                        if (tokenTo) {
                            store.dispatch('tokens/setToToken', tokenTo);
                        }
                    });
                }, 2000);
            }
        });

        onBeforeUnmount(() => {
            if (router.options.history.state.current !== '/superSwap/select-token') {
                store.dispatch('tokens/setFromToken', null);
                store.dispatch('tokens/setToToken', null);
                store.dispatch('bridge/setSelectedDstNetwork', null);
            }
        });

        return {
            amount,
            isLoading,
            disabledBtn,
            needApprove,
            resetAmount,
            receiveToken,
            receiveValue,
            estimateRate,
            zometNetworks,
            groupTokens,
            services,
            bestRoute,
            otherRoutes,
            errorAddress,
            errorBalance,
            filteredSupportedChains,
            selectedSrcNetwork,
            selectedDstNetwork,
            selectedSrcToken,
            selectedDstToken,
            txError,
            successHash,
            prettyNumber,
            walletAddress,
            currentChainInfo,
            networkFee,
            needNetworkChange,
            networkName,
            networkError,

            onSelectSrcNetwork,
            onSelectDstNetwork,
            onSetAddress,
            onSetSrcToken,
            onSetDstToken,
            onSetAmount,
            swap,
            setShowRoutesModal,
            prettyNumberTooltip,
            setReceiveValue,
        };
    },
};
</script>
<style lang="scss">
.superswap-panel {
    width: 660px;

    .mt-10 {
        margin-top: 10px;
    }

    .select-group {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .select {
            width: 48%;

            .name {
                font-size: 18px;
                line-height: 16px;
            }
        }
    }

    .accordion__content {
        img {
            width: 16px;
            height: 16px;
        }
        .symbol {
            margin-left: 5px;
        }
    }

    .accordion__title {
        .symbol {
            font-family: 'Poppins_SemiBold';
        }
    }

    .accordion-item {
        position: relative;
        &__value {
            .route {
                display: flex;
                align-items: center;
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
    .other-routes {
        background-color: #97ffd0;
        border-radius: 15px;
        padding: 4px 10px;
        color: #00839f;
        font-weight: 600;
        position: absolute;
        right: 0;
        bottom: 8px;
        cursor: pointer;
    }

    &__btn {
        height: 64px;
        width: 100%;
    }
}
</style>
