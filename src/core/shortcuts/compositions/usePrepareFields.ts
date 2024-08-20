import { computed, ComputedRef, onMounted, onUnmounted, watch } from 'vue';
import { useStore, Store } from 'vuex';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';

import { Ecosystems } from '@/shared/models/enums/ecosystems.enum';
import { IChainConfig } from '@/shared/models/types/chain-config';

// Operations
import OperationsFactory from '@/core/operations/OperationsFactory';

// Shortcuts
import { IShortcutOp } from '@/core/shortcuts/core/ShortcutOp';
import { IOperationParam } from '@/core/shortcuts/core/models/Operation';

import { IAsset } from '@/shared/models/fields/module-fields';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { AddressByChainHash } from '@/shared/models/types/Address';
import { ShortcutFieldOpAssociated, FieldsValueAssociated, TokenDestinationByField } from '@/core/shortcuts/core/types/ShortcutType';

const usePrepareFields = (
    currentShortcutID: string,
    addressesByChain: ComputedRef<AddressByChainHash>,
    { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null },
) => {
    // ****************************************************************************************************
    // * Main store and router
    // ****************************************************************************************************

    const store = tmpStore || useStore();

    // ****************************************************************************************************
    // * Wallet adapter and tokens list
    // ****************************************************************************************************

    const { getChainByChainId } = useAdapter({ tmpStore: store });
    const { getTokenById } = useTokensList({ tmpStore: store });

    // ****************************************************************************************************
    // * Computed properties for the shortcuts
    // ****************************************************************************************************

    // * Quote loading state from the store
    const isQuoteLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('quote'),
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'quote', value }),
    });

    // * Transaction signing state from the store
    const isTransactionSigning = computed({
        get: () => store.getters['txManager/isTransactionSigning'],
        set: (value) => store.dispatch('txManager/setTransactionSigning', value),
    });

    // * Shortcut index from the store
    const shortcutIndex = computed({
        get: () => store.getters['shortcuts/getShortcutIndex'],
        set: (value) => store.dispatch('shortcuts/setShortcutIndex', { index: value }),
    });

    const currentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);
    const currentShortcut = computed(() => store.getters['shortcuts/getShortcut'](currentShortcutID));

    const currentOp = computed<IShortcutOp>(() => {
        if (!currentShortcutID || !currentStepId.value) return null;
        return store.getters['shortcuts/getCurrentOperation'](currentShortcutID);
    });

    const operationsFactory = computed<OperationsFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](currentShortcut.value.id));

    const validateShortcutIndexAndStepId = (index: number): boolean => {
        if (!operationsFactory.value) return false;
        const order = operationsFactory.value?.getOperationOrder();
        if (!order.length) return false;

        if (!currentOp.value) return false;

        const operationId = currentOp.value?.id;
        const operation = operationsFactory.value.getOperationById(operationId);
        if (!operation) return false;

        const uniqueId = operation.getUniqueId();

        const operationIndex = order.findIndex((op) => op === uniqueId);

        if (operationIndex === -1) return false;

        return operationIndex === index;
    };

    // ****************************************************************************************************
    // * Perform the shortcut's Fields
    // ****************************************************************************************************

    const prepareDisabledField = async (operationId: string, module: string, field: string, value: boolean) => {
        if (!operationId || !field) return false;

        await store.dispatch('moduleStates/setDisabledField', {
            module: module || ModuleType.shortcut,
            field,
            attr: 'disabled',
            value,
        });

        return true;
    };

    const prepareHiddenField = async (operationId: string, module: string, field: string, value: boolean) => {
        if (!operationId || !field) return false;

        await store.dispatch('moduleStates/setHideField', {
            module: module || ModuleType.shortcut,
            field,
            attr: 'hide',
            value,
        });

        return true;
    };

    // ****************************************************************************************************
    // * Perform the default values
    // ****************************************************************************************************

    const prepareValueByField = async (
        operationId: string,
        field: string,
        params: any,
        { isUpdateInStore = false }: { isUpdateInStore: boolean },
    ) => {
        if (!operationId) return false;
        if (!field || !params) return false;
        if (!operationsFactory.value) return false;

        const operationById = operationsFactory.value.getOperationById(operationId);
        const operationByKey = operationsFactory.value.getOperationByKey(operationId);
        const operation = operationById || operationByKey;

        if (!operation || JSON.stringify(operation) === '{}') return false;

        const isToken = ['srcToken', 'dstToken'].includes(field);

        const { ecosystem = null, chainId = null, chain = null, id = null, amount = null, value = null } = params || {};

        const getNetwork = (ecosystem: Ecosystems, chainId: string) => getChainByChainId(ecosystem as Ecosystems, chainId) as IChainConfig;

        const getTokens = async (ecosystem: Ecosystems, chainId: string, id: string) => {
            const chain = getNetwork(ecosystem, chainId);
            return (await getTokenById(chain as any, id as any)) as IAsset;
        };

        // * If the field and value is exist, set the field value in the store and operation
        if (field && value) {
            isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value }));
            isToken ? operation.setToken(TokenDestinationByField[field], value) : null;
            ShortcutFieldOpAssociated[field] ? operation.setParamByField(ShortcutFieldOpAssociated[field], value) : null;
            return true;
        }

        let valueToSet = null;
        let fieldToSet = null;

        switch (field) {
            case 'srcNetwork':
                const srcNetwork = getNetwork(ecosystem, chainId as string);

                if (!srcNetwork) {
                    console.error(`SRC Network not found: ${chainId}`);
                    return false;
                }

                const srcChainId: string | number = srcNetwork.chain_id || srcNetwork.net;

                operation.setParamByField(ShortcutFieldOpAssociated[field], srcNetwork?.net);
                operation.setChainId(srcChainId as string);
                operation.setEcosystem(srcNetwork.ecosystem as any);

                operation.setAccount(addressesByChain.value[srcNetwork.net]);

                fieldToSet = 'srcNetwork';
                valueToSet = srcNetwork;

                break;

            case 'dstNetwork':
                const dstNetwork = getChainByChainId(ecosystem as Ecosystems, chainId as string);
                if (!dstNetwork) {
                    console.error(`DST Network not found: ${chainId}`);
                    return false;
                }

                operation.setParamByField(ShortcutFieldOpAssociated[field], dstNetwork?.net);

                fieldToSet = 'dstNetwork';
                valueToSet = dstNetwork;

                break;

            case 'srcToken':
            case 'dstToken':
                if (!id) {
                    console.error(`Token ID not found: ${id}`);
                    return false;
                }

                const token = await getTokens(ecosystem, chain as string, id as string);

                if (!token) {
                    console.error(`Token not found: ${id}`);
                    return false;
                }

                const tokenParams = token;

                if (amount) tokenParams.amount = amount;

                // * If the token is not set, set it
                operation.setToken(TokenDestinationByField[field], tokenParams);

                fieldToSet = field;
                valueToSet = tokenParams;

                break;
            default:
                const setParamKey = ShortcutFieldOpAssociated[field];
                const setValue = params[FieldsValueAssociated[field]];
                fieldToSet = field;
                valueToSet = setValue;
                operation.setParamByField(setParamKey, setValue);
                break;
        }

        if (isUpdateInStore && fieldToSet && valueToSet)
            await store.dispatch(`tokenOps/setFieldValue`, { field: fieldToSet, value: valueToSet });

        return true;
    };

    // ****************************************************************************************************
    // * Perform the fields
    // ****************************************************************************************************

    const performFields = async (
        moduleType: string,
        params: IOperationParam[],
        { isUpdateInStore, id: targetOpId, from }: { isUpdateInStore: boolean; id: string; from: string },
    ) => {
        if (isTransactionSigning.value) return false;
        if (!params || !params.length) return false;

        for (const paramField of params) {
            const { name, ...rest } = paramField;
            const { disabled, hide } = rest;

            await prepareValueByField(targetOpId, name, rest, { isUpdateInStore });

            if (typeof disabled !== 'undefined' && currentStepId.value === targetOpId)
                await prepareDisabledField(targetOpId, moduleType, name, disabled);

            if (typeof hide !== 'undefined' && currentStepId.value === targetOpId)
                await prepareHiddenField(targetOpId, moduleType, name, hide);
        }

        return true;
    };

    const performDisabledOrHiddenFields = async (opId: string, module: string, fields: IOperationParam[]) => {
        const isUpdateInStore = currentOp.value?.id === opId;
        if (!isUpdateInStore) return false;

        if (!fields.length) return false;
        if (!opId) return false;
        if (!module) return false;

        const promises = fields.map((field) => {
            const { name, disabled = false, hide = false } = field || {};
            prepareDisabledField(opId, module, name, disabled);
            prepareHiddenField(opId, module, name, hide);
        });

        await Promise.all(promises);

        return true;
    };

    // ====================================================================================================
    // * Call the on watch on mounted
    // ====================================================================================================
    const callPerformOnWatchOnMounted = async () => {
        if (!currentOp.value) return false;
        if (!currentOp.value?.id) return false;

        await store.dispatch('tokenOps/resetFields');

        const { id, moduleType, params = [] } = currentOp.value || {};

        await performFields(moduleType, params, {
            isUpdateInStore: true,
            id,
            from: 'callPerformOnWatchOnMounted',
        });

        return true;
    };

    return {
        callPerformOnWatchOnMounted,

        performFields,
        prepareValueByField,

        performDisabledOrHiddenFields,
        prepareDisabledField,
        prepareHiddenField,
    };
};

export default usePrepareFields;
