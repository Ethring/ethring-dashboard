import { isEqual, isEmpty } from 'lodash';

import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';
import usePoolsList from '@/compositions/usePoolList';

import { TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import useInputValidation from '@/shared/form-validations';
import logger from '@/shared/logger';
import { IChainConfig } from '@/shared/models/types/chain-config';
import { IAsset } from '@/shared/models/fields/module-fields';
import { AvailableShortcuts } from '@/core/shortcuts/data/shortcuts';

export default function useChainTokenManger(moduleType: ModuleType) {
    const store = useStore();

    const isSuperSwap = computed(() =>
        [ModuleType.superSwap, ModuleType.shortcut, ModuleType.pendleBeefy, ModuleType.pendleSilo].includes(moduleType),
    );
    const isNeedDstNetwork = computed(() => [ModuleType.bridge, ModuleType.superSwap].includes(moduleType));
    const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

    const { isSameTokenSameNet, isSameNetwork, isSameToken, isSrcNetworkSet, isSrcTokenSet, isDstTokenSet, isDstNetworkSet } =
        useInputValidation();

    // =================================================================================================================
    // * Adapter
    // * Wallet account, current chain info, chain list
    // =================================================================================================================
    const { walletAccount, currentChainInfo, chainList } = useAdapter();

    // =================================================================================================================
    // * Tokens list getter
    // =================================================================================================================

    const { getTokensList } = useTokensList();

    const tokensList = ref<IAsset[]>([]);

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

    const pools = usePoolsList();
    // =================================================================================================================

    // const isAllTokensLoading = computed(() => store.getters['tokens/loader']);
    const isTokensLoadingForSrc = computed(() =>
        store.getters['tokens/loadingByChain'](walletAccount.value, selectedSrcNetwork.value?.net),
    );

    const isTokensLoadingForDst = computed(() =>
        store.getters['tokens/loadingByChain'](walletAccount.value, selectedDstNetwork.value?.net),
    );

    // =================================================================================================================

    const CurrentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);
    const CurrentShortcut = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

    const CurrentOperation = computed(() => {
        if (!CurrentShortcut.value) return null;
        if (!CurrentStepId.value) return null;

        return store.getters['shortcuts/getCurrentOperation'](CurrentShortcut.value);
    });

    const includeTokenList = computed(() => {
        const { includeTokens = {} } = CurrentOperation.value || {};

        if (includeTokens[selectedSrcNetwork.value?.net]) return includeTokens[selectedSrcNetwork.value?.net];

        return [];
    });

    // ****************************************************************************************************************
    // * Methods
    // ****************************************************************************************************************

    // =================================================================================================================
    const setTokenOnChangeForNet = async (srcNet: IChainConfig, srcToken: IAsset, { isSameNet = false, excludeTokens = [], isSrc = true } = {}) => {
        // ************************************************
        // 1. Get tokens list for the source network
        // 2. Is the source token is found in the tokens list, then set the source token to the found token
        // 3. If the source token is not found, then set the source token to the default token
        // ************************************************

        if (moduleType === ModuleType.shortcut && !CurrentShortcut.value) return;
        if (CurrentShortcut.value === AvailableShortcuts.RemoveLiquidityPool && isSrc)
            return pools.value[srcNet?.net]?.length ? pools.value[srcNet?.net][0] : null;

        const getTokensParams = {
            srcNet,
            isSameNet,
            onlyWithBalance: selectType.value === TOKEN_SELECT_TYPES.FROM,
            srcToken: srcToken,
            dstToken: null,
            exclude: [],
        } as any;

        excludeTokens.length ? (getTokensParams.exclude = excludeTokens) : null;

        // * 1. Get tokens list for the source network
        tokensList.value = await getTokensList(getTokensParams);

        let filteredTokenList: any[] = [];
        if (includeTokenList.value.length)
            filteredTokenList = tokensList.value.filter((token) => includeTokenList.value.includes(token.id));

        if (filteredTokenList?.length) tokensList.value = filteredTokenList;

        // * If the tokens list is empty, then return null
        if (!tokensList.value?.length) return null;

        // * 2. Is the source token is found in the tokens list, then set the source token to the found token
        const { id: targetId } = srcToken || {};
        const isTokenFound = tokensList.value?.find((tkn) => tkn?.id === targetId);

        if (isTokenFound) return isTokenFound;

        // * 3. If the source token is not found, then set the source token to the default token
        const [defaultSrcToken = null] = tokensList.value;

        if (srcNet?.chain !== srcToken?.chain && defaultSrcToken) return defaultSrcToken;

        if (defaultSrcToken) return defaultSrcToken;

        return srcToken;
    };

    const chainManagerByModule = () => {
        // * If the source network is not set, then the source network is set to the current network
        if (!selectedSrcNetwork.value?.net) selectedSrcNetwork.value = currentChainInfo.value;
        else if (!selectedSrcNetwork.value?.net && chainList.value?.length) selectedSrcNetwork.value = chainList.value[0];

        switch (moduleType) {
            // * If the module is Swap, then the destination network is set to the source network
            case ModuleType.nft:
                selectedDstNetwork.value = null;
                selectedDstToken.value = null;
                break;

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
                if (!chainList.value?.length) break;

                const dstNetwork = chainList.value?.find(({ net }) => net !== selectedSrcNetwork.value?.net) || null;

                if (moduleType === ModuleType.bridge && dstNetwork) selectedDstNetwork.value = dstNetwork;
                else !isDstNetworkSet.value && (selectedDstNetwork.value = dstNetwork);

                break;
        }
    };

    const defaultTokenManagerByModule = async ({ isAccountChanged = false } = {}) => {
        const isSrcTokenChanged = selectedSrcToken.value && selectedSrcToken.value.chain !== selectedSrcNetwork.value?.net;
        // const isDstTokenChanged = selectedDstToken.value && selectedDstToken.value.chain !== selectedDstNetwork.value?.net;

        const isDstTokenChangedForSwap = selectedDstToken.value?.chain !== selectedSrcNetwork.value?.net;

        const params = {
            isSameNet: false,
            excludeTokens: [],
        } as any;

        switch (moduleType) {
            case ModuleType.swap:
                if (isSrcTokenChanged || !selectedSrcToken.value || isAccountChanged)
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

                if (isDstTokenChangedForSwap || !selectedDstToken.value || isAccountChanged) {
                    params.isSameNet = true;
                    params.excludeTokens = [selectedSrcToken.value?.id];
                    params.isSrc = false;

                    selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, params);
                }

                if (isSameToken.value) selectedDstToken.value = null;

                break;

            case ModuleType.stake:
            case ModuleType.send:
                if (isSrcTokenChanged || isAccountChanged)
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

                break;

            case ModuleType.bridge:
                if (isSameNetwork.value) {
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
                    params.excludeTokens = [selectedSrcToken.value?.id];
                    params.isSrc = false;
                    selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, params);
                }

                break;

            case ModuleType.pendleBeefy:
            case ModuleType.pendleSilo:
            case ModuleType.superSwap:
                if (isSameToken.value && isSameNetwork.value) {
                    params.isSameNet = true;
                    params.excludeTokens = [selectedDstToken.value?.id];
                    selectedDstToken.value = null;
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

                    params.excludeTokens = [selectedSrcToken.value?.id];
                    params.isSrc = false;
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

        const isDiffEcosystem = !isEqual(ecosystem, srcEcosystem);

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

        if (!selectedSrcNetwork.value?.net) selectedSrcNetwork.value = currentChainInfo.value;

        // * If the ecosystem is different, and the module is not SuperSwap,
        // * then the selected network is reset to the current network
        if (isDiffEcosystem && !isSuperSwap.value && currentChainInfo.value) selectedSrcNetwork.value = currentChainInfo.value;

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
        const isNewSrcDstSame = !isEmpty(newSrc) && !isEmpty(newDst) && isEqual(newSrc.net, newDst.net);
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

        if (!isEmpty(newSrc)) {
            selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

            if ([ModuleType.swap, ModuleType.shortcut].includes(moduleType))
                selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, {
                    isSameNet: true,
                    excludeTokens: [selectedSrcToken.value?.id],
                    isSrc: false,
                } as any);
        }

        if (!isEmpty(newDst)) selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, { isSrc: false });
    });

    const unWatchSrcDstToken = watch([selectedSrcToken, selectedDstToken], async () => {
        if (isSameToken.value) return (selectedDstToken.value = null);

        if (isSameTokenSameNet.value) return (selectedDstToken.value = null);

        if (!isSrcTokenSet.value || !isDstTokenSet.value) return await defaultTokenManagerByModule();
    });

    // ========================= Watch Tokens Loadings for SRC and DST networks =========================

    const unWatchLoadingSrc = watch(isTokensLoadingForSrc, async (loadingState, oldLoading) => {
        if (loadingState && !oldLoading) return;

        if (!loadingState && !isSrcNetworkSet.value) return;

        if (!isSrcNetworkSet.value) return;

        selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

        if ([ModuleType.swap].includes(moduleType))
            selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, {
                isSameNet: true,
                excludeTokens: [selectedSrcToken.value?.id],
                isSrc: false,
            } as any);

        if (isSameToken.value) selectedDstToken.value = null;
    });

    const unWatchLoadingDst = watch(isTokensLoadingForDst, async (loadingState) => {
        if (loadingState) return;

        if (!selectedDstNetwork.value) return;

        if (['send', 'swap'].includes(moduleType)) return;

        selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, { isSrc: false });
    });

    // =================================================================================================================

    watch(isConfigLoading, () => {
        if (!isConfigLoading.value) chainManagerByModule();
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
