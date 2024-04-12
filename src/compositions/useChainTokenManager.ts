import _, { delay } from 'lodash';

import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';

import { TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import useInputValidation from '@/shared/form-validations';
import logger from '@/shared/logger';

export default function useChainTokenManger(moduleType: ModuleType) {
    const store = useStore();

    const isSuperSwap = computed(() => [ModuleType.superSwap, ModuleType.shortcut].includes(moduleType));
    const isNeedDstNetwork = computed(() => [ModuleType.bridge, ModuleType.superSwap].includes(moduleType));
    const isSameNet = computed(() => [ModuleType.bridge, ModuleType.superSwap].includes(moduleType));
    const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

    const {
        isSameTokenSameNet,
        isSameNetwork,
        isSameToken,
        isSrcNetworkSet,
        isSrcTokenChainCorrect,
        isDstTokenChainCorrect,
        isDstTokenChainCorrectSwap,
        isSrcTokenSet,
        isDstTokenSet,
        isDstNetworkSet,
    } = useInputValidation();

    // =================================================================================================================
    // * Adapter
    // * Wallet account, current chain info, chain list
    // =================================================================================================================
    const { walletAccount, currentChainInfo, chainList, getChainListByEcosystem } = useAdapter();

    // =================================================================================================================
    // * Tokens list getter
    // =================================================================================================================

    const { getTokensList } = useTokensList();

    const tokensList = ref([]);

    const selectType = computed({
        get: () => store.getters['tokenOps/selectType'],
        set: (value) => store.dispatch('tokenOps/setSelectType', value),
    });

    // =================================================================================================================
    // * Fields
    // =================================================================================================================

    const selectedSrcNetwork = computed({
        get: () => store.getters['tokenOps/srcNetwork'],
        set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
    });

    const selectedDstNetwork = computed({
        get: () => store.getters['tokenOps/dstNetwork'],
        set: (value) => store.dispatch('tokenOps/setDstNetwork', value),
    });

    const selectedSrcToken = computed({
        get: () => store.getters['tokenOps/srcToken'],
        set: (value) => store.dispatch('tokenOps/setSrcToken', value),
    });

    const selectedDstToken = computed({
        get: () => store.getters['tokenOps/dstToken'],
        set: (value) => store.dispatch('tokenOps/setDstToken', value),
    });

    // =================================================================================================================

    // const isAllTokensLoading = computed(() => store.getters['tokens/loader']);
    const isTokensLoadingForSrc = computed(() =>
        store.getters['tokens/loadingByChain'](walletAccount.value, selectedSrcNetwork.value?.net),
    );

    const isTokensLoadingForDst = computed(() =>
        store.getters['tokens/loadingByChain'](walletAccount.value, selectedDstNetwork.value?.net),
    );

    // =================================================================================================================
    const setTokenOnChangeForNet = async (srcNet, srcToken, { isSameNet = false, excludeTokens = [] } = {}) => {
        const getTokensParams = {
            srcNet,
            isSameNet,
            onlyWithBalance: selectType.value === TOKEN_SELECT_TYPES.FROM,
            srcToken: srcToken,
            dstToken: null,
            exclude: [],
        };

        excludeTokens.length ? (getTokensParams.exclude = excludeTokens) : null;

        tokensList.value = await getTokensList(getTokensParams);

        const [defaultSrcToken = null] = tokensList.value;

        if (!srcToken?.id && defaultSrcToken) {
            return defaultSrcToken;
        }

        const { id: targetId } = srcToken || {};

        const searchTokens = [targetId];

        const updatedList = tokensList.value?.filter((tkn) => searchTokens.includes(tkn?.id)) || [];

        if (!updatedList.length) {
            return defaultSrcToken;
        }

        const [tkn = null] = updatedList;

        if (!tkn) {
            return defaultSrcToken;
        }

        return tkn;
    };

    const chainManagerByModule = () => {
        // * If the source network is not set, then the source network is set to the current network
        if (!selectedSrcNetwork.value?.net) {
            selectedSrcNetwork.value = currentChainInfo.value;
        } else if (!selectedSrcNetwork.value?.net && chainList.value?.length) {
            selectedSrcNetwork.value = chainList.value[0];
        }

        switch (moduleType) {
            // * If the module is Swap, then the destination network is set to the source network
            case ModuleType.swap:
                selectedDstNetwork.value = null;
                break;

            // * If the module is Send, then the destination network is reset to null
            case ModuleType.stake:
            case ModuleType.send:
                // selectedDstNetwork.value = null;
                break;

            // * If the module is Bridge or SuperSwap, then the destination network is set to the network that is different from the source network
            case ModuleType.bridge:
            case ModuleType.superSwap:
                // * If the chain list is empty, then the destination network is not set
                if (!chainList.value?.length) {
                    break;
                }

                const [dst] = chainList.value?.filter(({ net }) => net !== selectedSrcNetwork.value?.net) || [];

                if (moduleType === ModuleType.bridge) {
                    selectedDstNetwork.value = dst;
                } else {
                    !isDstNetworkSet.value && (selectedDstNetwork.value = dst);
                }

                break;
        }
    };

    const defaultTokenManagerByModule = async ({ isAccountChanged = false } = {}) => {
        const isSrcTokenChanged = selectedSrcToken.value && selectedSrcToken.value.chain !== selectedSrcNetwork.value?.net;
        const isDstTokenChanged = selectedDstToken.value && selectedDstToken.value.chain !== selectedDstNetwork.value?.net;

        const isDstTokenChangedForSwap = selectedDstToken.value?.chain !== selectedSrcNetwork.value?.net;

        const params = {
            isSameNet: false,
            excludeTokens: [],
        };

        switch (moduleType) {
            case ModuleType.swap:
                if (isSrcTokenChanged || !selectedSrcToken.value || isAccountChanged) {
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
                }

                if (isDstTokenChangedForSwap || !selectedDstToken.value || isAccountChanged) {
                    params.isSameNet = true;
                    params.excludeTokens = [selectedSrcToken.value?.id];

                    selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, params);
                }

                if (isSameToken.value) {
                    selectedDstToken.value = null;
                }

                break;

            case ModuleType.stake:
            case ModuleType.send:
                if (isSrcTokenChanged || isAccountChanged) {
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
                }

                break;

            case ModuleType.bridge:
                if (isSameNetwork.value) {
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
                    params.excludeTokens = [selectedSrcToken.value?.id];
                    selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, params);
                }

                break;
            case ModuleType.superSwap:
                if (isSameToken.value && isSameNetwork.value) {
                    params.isSameNet = true;
                    params.excludeTokens = [selectedDstToken.value?.id];
                    selectedDstToken.value = null;
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

                    params.excludeTokens = [selectedSrcToken.value?.id];
                    selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, params);
                }

                // if (isSrcTokenChanged || isAccountChanged) {
                //     selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
                // }

                // if (isDstTokenChanged || isAccountChanged) {
                //     params.token = selectedSrcToken.value;
                //     selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, params);
                // }

                break;
        }
    };

    // =================================================================================================================
    // * Account change watcher and handler
    // * Setter for src and dst networks;
    // =================================================================================================================

    const onChangeAccount = async () => {
        const { ecosystem } = currentChainInfo.value || {};
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};

        const isDiffEcosystem = !_.isEqual(ecosystem, srcEcosystem);

        if (process.env.NODE_ENV === 'debug') {
            console.debug('----------- ON CHANGE ACCOUNT -----------');

            console.table({
                isDiffEcosystem,
                walletAccount: walletAccount.value,
                isSuperSwap: isSuperSwap.value,
                currentChainInfo: currentChainInfo.value?.net,
                selectedSrcNetwork: selectedSrcNetwork.value?.net,
                selectedDstNetwork: selectedDstNetwork.value?.net,
                selectedSrcToken: selectedSrcToken.value?.id,
                selectedDstToken: selectedDstToken.value?.id,
            });
        }

        if (!selectedSrcNetwork.value?.net) {
            selectedSrcNetwork.value = currentChainInfo.value;
        }

        // * If the ecosystem is different, and the module is not SuperSwap,
        // * then the selected network is reset to the current network
        if (isDiffEcosystem && !isSuperSwap.value) {
            selectedSrcNetwork.value = currentChainInfo.value;
        }

        // * If the ecosystem is different, and the module is Bridge or SuperSwap
        if (!isSuperSwap.value && isDiffEcosystem && isNeedDstNetwork.value && chainList.value?.length && selectedSrcNetwork.value?.net) {
            const [dst] = chainList.value?.filter(({ net }) => net !== selectedSrcNetwork.value?.net) || [];
            dst && (selectedDstNetwork.value = dst);
        }

        const isAccountChanged = !isSuperSwap.value ? isDiffEcosystem : false;

        await defaultTokenManagerByModule({ isAccountChanged });
    };

    // =================================================================================================================
    // * Watchers
    // =================================================================================================================

    const unWatchAcc = watch(walletAccount, async () => await onChangeAccount());

    const unWatchSrcDstNetwork = watch([selectedSrcNetwork, selectedDstNetwork], async ([newSrc, newDst], [oldSrc, oldDst]) => {
        const isNewSrcDstSame = !_.isEmpty(newSrc) && !_.isEmpty(newDst) && _.isEqual(newSrc.net, newDst.net);
        const isSameNetwork = [ModuleType.bridge].includes(moduleType) && isNewSrcDstSame;

        if (process.env.NODE_ENV === 'debug') {
            logger.debug('----------- ON CHANGE NETWORK -----------');

            console.table({
                isSameNetwork,
                currentChainInfo: currentChainInfo.value?.net,
                selectedSrcNetwork: selectedSrcNetwork.value?.net,
                selectedDstNetwork: selectedDstNetwork.value?.net,
                selectedSrcToken: selectedSrcToken.value?.id,
                selectedDstToken: selectedDstToken.value?.id,
                newSrc: newSrc?.net,
                newDst: newDst?.net,
                oldSrc: oldSrc?.net,
                oldDst: oldDst?.net,
            });
        }

        // * If module is Bridge and the source and destination networks are the same,
        // * and swap the source and destination tokens
        if (isSameNetwork) {
            [selectedSrcNetwork.value, selectedDstNetwork.value] = [oldDst, oldSrc];
            [selectedSrcToken.value, selectedDstToken.value] = [selectedDstToken.value, selectedSrcToken.value];
        }

        if (!_.isEmpty(newSrc)) {
            selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

            if ([ModuleType.swap].includes(moduleType)) {
                selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, {
                    isSameNet: true,
                    excludeTokens: [selectedSrcToken.value?.id],
                });
            }
        }

        if (!_.isEmpty(newDst)) {
            selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value);
        }
    });

    const unWatchSrcDstToken = watch([selectedSrcToken, selectedDstToken], async () => {
        if (isSameToken.value) {
            return (selectedDstToken.value = null);
        }

        if (isSameTokenSameNet.value) {
            return (selectedDstToken.value = null);
        }

        if (!isSrcTokenSet.value || !isDstTokenSet.value) {
            return await defaultTokenManagerByModule();
        }
    });

    // ========================= Watch Tokens Loadings for SRC and DST networks =========================

    const unWatchLoadingSrc = watch(isTokensLoadingForSrc, async (loadingState, oldLoading) => {
        if (loadingState && !oldLoading) {
            return;
        }

        if (!loadingState && !isSrcNetworkSet.value) {
            return;
        }

        if (!isSrcNetworkSet.value) {
            return;
        }

        selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

        // if ([ModuleType.send].includes(moduleType)) {
        //     return (selectedDstToken.value = null);
        // }

        if ([ModuleType.swap].includes(moduleType)) {
            selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, {
                isSameNet: true,
                excludeTokens: [selectedSrcToken.value?.id],
            });
        }

        if (isSameToken.value) {
            selectedDstToken.value = null;
        }
    });

    const unWatchLoadingDst = watch(isTokensLoadingForDst, async (loadingState) => {
        if (loadingState) {
            return;
        }

        if (!selectedDstNetwork.value) {
            return;
        }

        if (['send', 'swap'].includes(moduleType)) {
            return;
        }

        selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value);
    });

    // =================================================================================================================

    watch(isConfigLoading, () => {
        if (!isConfigLoading.value) {
            chainManagerByModule();
        }
    });

    onMounted(async () => {
        selectType.value = TOKEN_SELECT_TYPES.FROM;

        chainManagerByModule();

        await defaultTokenManagerByModule();
    });

    onBeforeUnmount(() => {
        // Clear all data

        unWatchAcc();

        unWatchSrcDstNetwork();

        unWatchSrcDstToken();

        unWatchLoadingSrc();
        unWatchLoadingDst();
    });
}
