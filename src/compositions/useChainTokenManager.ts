import { isEqual, isEmpty } from 'lodash';

import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import { Store, useStore } from 'vuex';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';
import usePoolsList from '@/compositions/usePoolList';
import useInputValidation from '@/shared/form-validations';

import { TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType, LIKE_SUPER_SWAP, IS_NEED_DST_NETWORK } from '@/shared/models/enums/modules.enum';
import { IChainConfig } from '@/shared/models/types/chain-config';
import { IAsset } from '@/shared/models/fields/module-fields';
import { RemoveLiquidityPoolId } from '@/core/shortcuts/core/index';
import { useRoute } from 'vue-router';

/**
 * @composition useChainTokenManager
 * @description Composition for handling token operation fields for different modules
 * @param moduleType - The module type for the composition
 * @param tmpStore - The temporary store for the composition, if not provided, then the default store is used
 * @returns
 */
export default function useChainTokenManger(moduleType: ModuleType, { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null }) {
    const route = useRoute();

    // ****************************************************************************************************************
    // * Store
    // ****************************************************************************************************************

    const store = tmpStore || useStore();

    // ****************************************************************************************************************
    // * Refs
    // ****************************************************************************************************************

    const tokensList = ref<IAsset[]>([]);

    // ****************************************************************************************************************
    // * Computed
    // ****************************************************************************************************************

    // * Some flags
    const isSuperSwap = computed(() => LIKE_SUPER_SWAP.includes(moduleType));
    const isNeedDstNetwork = computed(() => IS_NEED_DST_NETWORK.includes(moduleType));

    // * Fields
    const selectType = computed({
        get: () => store.getters['tokenOps/selectType'],
        set: (value) => store.dispatch('tokenOps/setSelectType', value),
    });

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

    // * Current chain info
    const currentNet = computed(() => selectedSrcNetwork.value?.net);

    // * Default source network

    const defaultSrcNetwork = computed(() => {
        if (!chainList.value?.length) return null;
        const [defaultChain] = chainList.value || [];
        return defaultChain;
    });

    // * Default destination network
    const defaultDstNetwork = computed(() => {
        if (!chainList.value?.length) return null;
        const [, defaultDstChain] = chainList.value || [];
        return defaultDstChain;
    });

    // * Flags
    const isDifferentEcosystem = computed(() => {
        const { ecosystem } = currentChainInfo.value || {};
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};

        return !isEqual(ecosystem, srcEcosystem);
    });

    const isAccountChanged = computed(() => (!isSuperSwap.value ? isDifferentEcosystem.value : false));

    const isSrcTokenChanged = computed(() => {
        if (!selectedSrcToken.value) return false;
        if (!selectedSrcNetwork.value) return false;
        return selectedSrcToken.value.chain !== selectedSrcNetwork.value.net;
    });

    const isDstTokenChanged = computed(() => {
        if (!selectedDstToken.value) return false;
        if (!selectedDstNetwork.value) return false;
        return selectedDstToken.value.chain !== selectedDstNetwork.value.net;
    });

    const isDstTokenChangedForSwap = computed(() => {
        if (!selectedDstToken.value) return false;
        if (!selectedSrcNetwork.value) return false;
        return selectedDstToken.value.chain !== selectedSrcNetwork.value.net;
    });

    // ****************************************************************************************************************
    // * Compositions
    // ****************************************************************************************************************

    // * Input validation
    const {
        // * Flags
        isSameTokenSameNet,
        isSameNetwork,
        isSameToken,
        isSrcNetworkSet,
        isSrcTokenSet,
        isDstTokenSet,
        isDstNetworkSet,
    } = useInputValidation({ tmpStore: store });

    // * Adapter
    const { walletAccount, currentChainInfo, chainList, getAccountByEcosystem } = useAdapter({ tmpStore: store });

    // * Tokens list
    const { getTokensList } = useTokensList({ tmpStore: tmpStore as any });

    // ****************************************************************************************************************
    // * Loadings
    // ****************************************************************************************************************

    // * Loading states

    const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

    const isTokensLoadingForSrc = computed(() => {
        if (!walletAccount.value) return true;
        if (!currentNet.value) return true;

        if (currentChainInfo.value?.ecosystem !== selectedSrcNetwork.value?.ecosystem) {
            const account = getAccountByEcosystem(selectedSrcNetwork.value?.ecosystem);
            return store.getters['tokens/loadingByChain'](account, currentNet.value);
        }

        return store.getters['tokens/loadingByChain'](walletAccount.value, currentNet.value);
    });

    const isTokensLoadingForDst = computed(() => {
        if (!walletAccount.value) return true;
        if (!selectedDstNetwork.value?.net) return true;

        if (currentChainInfo.value?.ecosystem !== selectedDstNetwork.value?.ecosystem) {
            const account = getAccountByEcosystem(selectedDstNetwork.value?.ecosystem);
            return store.getters['tokens/loadingByChain'](account, selectedDstNetwork.value?.net);
        }

        return store.getters['tokens/loadingByChain'](walletAccount.value, selectedDstNetwork.value.net);
    });

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

        if (includeTokens && includeTokens[selectedSrcNetwork.value?.net]) return includeTokens[selectedSrcNetwork.value?.net];

        return [];
    });

    // ****************************************************************************************************************
    // * Methods
    // ****************************************************************************************************************

    // * Token
    const setTokenOnChangeForNet = async (
        srcNet: IChainConfig,
        srcToken: IAsset,
        { isSameNet, excludeTokens, isSrc }: { isSameNet?: boolean; excludeTokens?: string[]; isSrc?: boolean } = {
            isSameNet: false,
            excludeTokens: [],
            isSrc: true,
        },
    ) => {
        // ************************************************
        // 1. Get tokens list for the source network
        // 2. Is the source token is found in the tokens list, then set the source token to the found token
        // 3. If the source token is not found, then set the source token to the default token
        // ************************************************

        if (moduleType === ModuleType.shortcut && !CurrentShortcut.value) return;

        // return pool token, if shortcut is RemoveLiquidityPool
        if (CurrentShortcut.value === RemoveLiquidityPoolId && isSrc)
            return pools.value[srcNet?.net]?.length ? pools.value[srcNet?.net][0] : null;

        const getTokensParams = {
            srcNet,
            isSameNet,
            onlyWithBalance: moduleType === ModuleType.send,
            srcToken: srcToken,
            dstToken: null,
            exclude: [],
        } as any;

        excludeTokens?.length ? (getTokensParams.exclude = excludeTokens) : null;

        // * 1. Get tokens list for the source network
        tokensList.value = await getTokensList(getTokensParams);

        let filteredTokenList: any[] = [];
        if (includeTokenList.value?.length)
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

    const updateSrcTokenIfNeed = async () => {
        if (isSrcTokenChanged.value || !selectedSrcToken.value || isAccountChanged.value)
            selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
    };

    const updateDstTokenIfNeed = async (isSameNet: boolean = false, excludeTokens: string[] = []) => {
        selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, {
            isSameNet,
            excludeTokens,
            isSrc: false,
        });
    };

    const updateDstTokenForSwap = async () => {
        if ((isDstTokenChangedForSwap.value || !selectedDstToken.value || isAccountChanged.value) && !route?.path?.includes('/shortcuts/'))
            await updateDstTokenIfNeed(true, [selectedSrcToken.value?.id]);
    };

    const validateChainsByModule = (module: ModuleType) => {
        if (!isNeedDstNetwork.value) selectedDstNetwork.value = null;

        switch (module) {
            // * If the module is Swap, then the destination network is set to the source network
            case ModuleType.swap:
                selectedDstNetwork.value = null;
                break;

            // * If the module is one of this, then the destination network & token is set to null
            case ModuleType.stake:
            case ModuleType.send:
            case ModuleType.nft:
            case ModuleType.liquidityProvider:
                selectedDstNetwork.value = null;
                selectedDstToken.value = null;
                break;

            // * If the module is Bridge or SuperSwap, then the destination network is set to the network that is different from the source network
            case ModuleType.bridge:
            case ModuleType.superSwap:
                if (moduleType === ModuleType.bridge && defaultDstNetwork.value && !isDstNetworkSet.value)
                    selectedDstNetwork.value = defaultDstNetwork.value;
                else if (!isDstNetworkSet.value && defaultDstNetwork.value) selectedDstNetwork.value = defaultDstNetwork.value;
                break;
        }
    };

    const defaultChainMangerByModule = () => {
        // 1. If the source network is not set, then the source network is set to the current network
        if (!selectedSrcNetwork.value?.net && currentChainInfo.value) selectedSrcNetwork.value = currentChainInfo.value;
        // 2. if the source network is not set, then the source network is set to the default network
        else if (!selectedSrcNetwork.value?.net && chainList.value?.length) selectedSrcNetwork.value = defaultSrcNetwork.value;

        validateChainsByModule(moduleType);
    };

    const defaultTokenManagerByModule = async () => {
        switch (moduleType) {
            case ModuleType.swap:
                // 1. If the source token is changed, then set the source token
                await updateSrcTokenIfNeed();

                // 2. If the destination token is changed, then set the destination token for the source network
                await updateDstTokenForSwap();

                // 3. If the source and destination tokens are the same, then reset the destination token
                if (isSameToken.value) selectedDstToken.value = null;

                break;

            case ModuleType.stake:
            case ModuleType.send:
            case ModuleType.liquidityProvider:
                // 1. If the source token is changed, then set the source token
                await updateSrcTokenIfNeed();
                if (CurrentShortcut.value === RemoveLiquidityPoolId) await updateDstTokenIfNeed(true, [selectedSrcToken.value?.id]);
                break;

            case ModuleType.bridge:
                // 1. If the network is the same, then set the source token, and the destination token is reset
                if (isSameNetwork.value) {
                    await updateSrcTokenIfNeed();
                    await updateDstTokenIfNeed(false, [selectedSrcToken.value?.id]);
                }

                break;

            case ModuleType.superSwap:
            case ModuleType.pendleBeefy:
            case ModuleType.pendleSilo:
                // 1. If the network is the same, then set the source token, and the destination token is reset
                if (isSameToken.value && isSameNetwork.value) {
                    await updateSrcTokenIfNeed();
                    await updateDstTokenIfNeed(true, [selectedSrcToken.value?.id]);
                    selectedDstToken.value = null;
                    await updateDstTokenIfNeed(false, [selectedSrcToken.value?.id]);
                }

                break;
        }
    };

    // * Account change watcher and handler
    // * Setter for src and dst networks;
    const onChangeAccount = async (account: string | null, oldAccount: string | null) => {
        // 1. If the account is the same, then return
        if (account === oldAccount) return;

        // 2. If the ecosystem is different, and the module is not SuperSwap, then the selected network is reset to the current network
        if (isDifferentEcosystem.value && !isSuperSwap.value && currentChainInfo.value) selectedSrcNetwork.value = currentChainInfo.value;
        // 3. If the source network is not set, then the source network is set to the current network
        else if (!selectedSrcNetwork.value?.net) selectedSrcNetwork.value = currentChainInfo.value;

        // 4. If the ecosystem is different, and the module is not SuperSwap, then the destination network is reset to the default network
        if (!isSuperSwap.value && isDifferentEcosystem.value && isNeedDstNetwork.value && selectedSrcNetwork.value?.net)
            defaultDstNetwork.value && (selectedDstNetwork.value = defaultDstNetwork.value);

        // 5. Set the destination network if the module is Bridge
        if (!isSuperSwap.value && isNeedDstNetwork.value && !selectedDstNetwork.value)
            defaultDstNetwork.value && (selectedDstNetwork.value = defaultDstNetwork.value);

        // 5. Set the source and destination tokens
        await defaultTokenManagerByModule();
    };

    const onChangeSrcDstNetwork = async (
        [newSrc, newDst]: [IChainConfig, IChainConfig],
        [oldSrc, oldDst]: [IChainConfig, IChainConfig],
    ) => {
        const isNewSrcDstSame = !isEmpty(newSrc) && !isEmpty(newDst) && isEqual(newSrc.net, newDst.net);
        const isSameNetwork = [ModuleType.bridge].includes(moduleType) && isNewSrcDstSame;

        // * If module is Bridge and the source and destination networks are the same,
        // * and swap the source and destination tokens
        if (isSameNetwork) {
            [selectedSrcNetwork.value, selectedDstNetwork.value] = [oldDst, oldSrc];
            [selectedSrcToken.value, selectedDstToken.value] = [selectedDstToken.value, selectedSrcToken.value];
        }

        if (!isEmpty(newSrc) && newSrc?.net !== oldSrc?.net) {
            selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
            if ([ModuleType.swap].includes(moduleType) && !route?.path?.includes('/shortcuts/'))
                await updateDstTokenIfNeed(true, [selectedSrcToken.value?.id]);
        }

        if (!isEmpty(newDst) && newDst?.net !== oldDst?.net && !route?.path?.includes('/shortcuts/'))
            selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, { isSrc: false });

        defaultChainMangerByModule();
    };

    const onChangeSrcDstToken = async () => {
        if (isSameToken.value) return (selectedDstToken.value = null);

        if (isSameTokenSameNet.value) return (selectedDstToken.value = null);

        if (!isSrcTokenSet.value || !isDstTokenSet.value) return await defaultTokenManagerByModule();
    };

    const onChangeLoadingSrc = async (loadingState: boolean) => {
        if (loadingState) return;

        if (!loadingState && !isSrcNetworkSet.value) return;

        selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

        if (isSameToken.value) selectedDstToken.value = null;

        if ([ModuleType.swap].includes(moduleType) && isSrcTokenChanged.value && !route?.path?.includes('/shortcuts/'))
            await updateDstTokenIfNeed(true, [selectedSrcToken.value?.id]);
    };

    const onChangeLoadingDst = async (loadingState: boolean) => {
        if (loadingState) return;

        if (!selectedDstNetwork.value) return;

        if (!loadingState && !isDstNetworkSet.value) return;

        if ([ModuleType.send].includes(moduleType)) return (selectedDstToken.value = null);
        else if (!route?.path?.includes('/shortcuts/'))
            selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, { isSrc: false });
    };

    const onChangeLoadingConfig = (loadingState: boolean) => {
        if (!loadingState) return defaultChainMangerByModule();
    };

    // ****************************************************************************************************************
    // * Watchers
    // ****************************************************************************************************************

    const unWatchAcc = watch(walletAccount, async (account, oldAccount) => await onChangeAccount(account, oldAccount));

    const unWatchSrcDstNetwork = watch(
        [selectedSrcNetwork, selectedDstNetwork],
        async ([newSrc, newDst], [oldSrc, oldDst]) => await onChangeSrcDstNetwork([newSrc, newDst], [oldSrc, oldDst]),
    );

    const unWatchSrcDstToken = watch([selectedSrcToken, selectedDstToken], async () => await onChangeSrcDstToken());

    const unWatchLoadingSrc = watch(isTokensLoadingForSrc, async (loadingState) => await onChangeLoadingSrc(loadingState));

    const unWatchLoadingDst = watch(isTokensLoadingForDst, async (loadingState) => await onChangeLoadingDst(loadingState));

    const unWatchIsConfigLoading = watch(isConfigLoading, (loadingState) => onChangeLoadingConfig(loadingState));

    onMounted(async () => {
        selectType.value = TOKEN_SELECT_TYPES.FROM;

        defaultChainMangerByModule();

        await defaultTokenManagerByModule();
    });

    onBeforeUnmount(() => {
        // Clear all data

        unWatchAcc();

        unWatchIsConfigLoading();

        unWatchSrcDstNetwork();

        unWatchSrcDstToken();

        unWatchLoadingSrc();
        unWatchLoadingDst();
    });

    return {
        isSuperSwap,
        isNeedDstNetwork,

        defaultSrcNetwork,
        defaultDstNetwork,

        selectedSrcToken,
        selectedDstToken,

        tokensList,
        isTokensLoadingForSrc,
        isTokensLoadingForDst,

        defaultChainMangerByModule,
        defaultTokenManagerByModule,
        setTokenOnChangeForNet,
        validateChainsByModule,

        onChangeAccount,
        onChangeSrcDstNetwork,
        onChangeSrcDstToken,
        onChangeLoadingSrc,
        onChangeLoadingDst,
        onChangeLoadingConfig,
    };
}
