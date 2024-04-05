import { computed, onBeforeMount, onMounted, onUnmounted, onUpdated, ref, watch, watchEffect } from 'vue';
import { useStore } from 'vuex';

import _ from 'lodash';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';
import OperationsFactory from '@/modules/operations/OperationsFactory';
import ShortcutRecipe from '../core/ShortcutRecipes';
import ShortcutCl, { IShortcutData } from '../core/Shortcut';
import DexOperation from '@/modules/operations/Dex';
import TransferOperation from '@/modules/operations/Transfer';
import { ApproveOperation } from '@/modules/operations/Approve';
import { SHORTCUT_STATUSES, STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { ShortcutType } from '../core/types/ShortcutType';
import { AddressByChainHash } from '../../../shared/models/types/Address';
import { ECOSYSTEMS, NATIVE_CONTRACT } from '@/Adapter/config';
import { IShortcutOp } from '../core/ShortcutOp';
import { IAsset } from '@/shared/models/fields/module-fields';
import { IOperationParam, OperationStep } from '../core/models/Operation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBaseOperation } from '@/modules/operations/models/Operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import BigNumber from 'bignumber.js';

const useShortcuts = (Shortcut: IShortcutData) => {
    // Create a new instance of the Shortcut class

    const CurrentShortcut = new ShortcutCl(Shortcut);

    const { getChainByChainId } = useAdapter();
    const { getTokenById } = useTokensList();

    const store = useStore();

    const quoteErrorMessage = computed({
        get: () => store.getters['bridgeDexAPI/getQuoteErrorMessage'],
        set: (value) => store.dispatch('bridgeDexAPI/setQuoteErrorMessage', value),
    });

    const isShortcutLoading = computed({
        get: () => store.getters['shortcuts/getIsShortcutLoading'](Shortcut.id),
        set: (value) =>
            store.dispatch('shortcuts/setIsShortcutLoading', {
                shortcutId: Shortcut.id,
                value,
            }),
    });

    const isQuoteLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('quote'),
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'quote', value }),
    });

    const shortcutIndex = computed({
        get: () => store.getters['shortcuts/getShortcutIndex'],
        set: (value) => store.dispatch('shortcuts/setShortcutIndex', { index: value }),
    });

    const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

    // Get the current operation from the store
    const currentOp = computed<IShortcutOp>(() => store.getters['shortcuts/getCurrentOperation'](Shortcut.id));

    // Get the steps from the store
    const steps = computed<OperationStep[]>(() => store.getters['shortcuts/getShortcutSteps'](Shortcut.id) || []);

    const shortcutLayout = computed(() => store.getters['shortcuts/getCurrentLayout']);

    const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](Shortcut.id));
    const operationsFactory = computed<OperationsFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](Shortcut.id));

    const firstOperation = computed<IBaseOperation>(() => operationsFactory.value.getFirstOperation());

    // Operations Ids from the factory
    const opIds = computed(() => Array.from(operationsFactory.value.getOperationsIds().keys()));

    // Get the addresses by chain from the store
    const addressesByChain = computed(() => {
        const src = store.getters['adapters/getAddressesByEcosystem'](ECOSYSTEMS.EVM) as AddressByChainHash;
        const dst = store.getters['adapters/getAddressesByEcosystem'](ECOSYSTEMS.COSMOS) as AddressByChainHash;

        return { ...src, ...dst };
    });

    const getAllowanceByService = () => {
        const operation = operationsFactory.value.getOperationById(currentOp.value.id);
        if (!operation) return null;

        const token = operation?.getParamByField('fromToken');

        if (token === NATIVE_CONTRACT) return null;

        if (!operation) return null;

        const serviceId = operation?.getParamByField('serviceId');
        const owner = operationsFactory.value.getOperationById(currentOp.value.id)?.getAccount();

        if (!serviceId || !owner) return null;

        return store.getters['bridgeDexAPI/getServiceAllowance'](serviceId, owner, token);
    };

    const processOperation = async (operation: IShortcutOp, { addToFactory = false }: { addToFactory: boolean }) => {
        const { id, moduleType, name, operationType, operationParams, dependencies, serviceId, params = [] } = operation || {};

        if (!addToFactory) {
            return await performFields(moduleType, params, {
                isUpdateInStore: currentOp.value?.id === id,
                id,
            });
        }

        if (!operationsFactory.value) return;

        let module: any, index: number;

        switch (operationType) {
            case TRANSACTION_TYPES.DEX:
            case TRANSACTION_TYPES.BRIDGE:
                ({ module, index } = operationsFactory.value.registerOperation(moduleType, DexOperation, { id, name }));
                break;
            case TRANSACTION_TYPES.TRANSFER:
            case TRANSACTION_TYPES.STAKE:
                ({ module, index } = operationsFactory.value.registerOperation(moduleType, TransferOperation, { id, name }));
                break;
            case TRANSACTION_TYPES.APPROVE:
                ({ module, index } = operationsFactory.value.registerOperation(moduleType, ApproveOperation, { id, name }));
                break;
        }

        operationsFactory.value.setParams(module, index, {
            ...operationParams,
            ownerAddresses: addressesByChain.value,
            serviceId,
        });

        await performFields(moduleType, params, {
            isUpdateInStore: currentOp.value?.id === id,
            id,
        });
    };

    const performShortcut = async (addToFactory = false) => {
        if (!operationsFactory.value) {
            console.warn('No operations factory found');
            return;
        }

        const { operations = [] } = CurrentShortcut.recipe || {};

        for (const step of operations) {
            const { type, id: opId, operations: subOps = [], dependencies: opDeps = null, moduleType = null } = step as any;

            if (type === ShortcutType.recipe) {
                for (const op of subOps || []) {
                    const { id: subId, dependencies: subDependency = null } = op || {};

                    await processOperation(op, { addToFactory });

                    operationsFactory.value.setOperationToGroup(opId, subId);
                    subDependency && operationsFactory.value.setDependencies(subId, subDependency);
                }
            } else if (type === ShortcutType.operation) {
                await processOperation(step as IShortcutOp, { addToFactory });
                opDeps && operationsFactory.value.setDependencies(opId, opDeps);
            }
        }
    };

    const performDisabledOrHiddenFields = async (opId: string, module: string, fields: IOperationParam[]) => {
        if (!fields) return;
        if (!opId) return;
        if (!module) return;

        const isUpdateInStore = currentOp.value?.id === opId;

        if (!isUpdateInStore) return;

        for (const field of fields) {
            const { name, disabled = false, hide = false } = field || {};

            await store.dispatch('moduleStates/setDisabledField', {
                module,
                field: name,
                attr: 'disabled',
                value: disabled,
            });

            await store.dispatch('moduleStates/setHideField', {
                module,
                field: name,
                attr: 'hide',
                value: hide,
            });
        }
    };

    const checkMinAmount = async () => {
        const amount = firstOperation.value.getParamByField('amount') || 0;

        if (!amount) return true;

        const fromToken = firstOperation.value.getToken('from');

        const { price = 0 } = fromToken || {};

        if (!price) {
            return true;
        }

        const amountToUsd = BigNumber(amount)
            .multipliedBy(price || 0)
            .toString();

        const isGreaterThanMinAmount = BigNumber(amountToUsd).isGreaterThanOrEqualTo(CurrentShortcut.minUsdAmount);

        if (!isGreaterThanMinAmount) {
            quoteErrorMessage.value = `Min USD amount is: $${CurrentShortcut.minUsdAmount}, your amount is: $${amountToUsd}`;
        }

        return isGreaterThanMinAmount;
    };

    const performDefaultValues = async (
        fields: IOperationParam[],
        {
            targetOpId,
            isUpdateInStore,
        }: {
            targetOpId: string;
            isUpdateInStore: boolean;
        },
    ) => {
        for (const paramField of fields) {
            const {
                name: field,
                ecosystem = null,
                chainId = null,
                chain = null,
                disabled = false,
                id = null,
                address,
                memo,
                hide = false,
            } = paramField || {};

            switch (field) {
                case 'srcNetwork':
                case 'dstNetwork':
                    const srcDstNet = getChainByChainId(ecosystem, chainId);

                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: srcDstNet }));

                    const isSrc = field === 'srcNetwork';

                    if (!srcDstNet) return;

                    if (!targetOpId) return;

                    isSrc
                        ? operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('fromNet', srcDstNet?.net)
                        : operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('toNet', srcDstNet?.net);

                    isSrc ? operationsFactory.value?.getOperationById(targetOpId)?.setChainId(srcDstNet.chain_id || srcDstNet.net) : null;
                    isSrc ? operationsFactory.value?.getOperationById(targetOpId)?.setEcosystem(srcDstNet.ecosystem) : null;

                    isSrc ? operationsFactory.value?.getOperationById(targetOpId)?.setAccount(addressesByChain.value[srcDstNet.net]) : null;

                    break;
                case 'srcToken':
                case 'dstToken':
                    const tokenNet = getChainByChainId(ecosystem, chain);
                    const token = (await getTokenById(tokenNet, id)) as IAsset;
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: token }));

                    const target = field === 'srcToken' ? 'from' : 'to';
                    operationsFactory.value?.getOperationById(targetOpId)?.setToken(target, token);

                    break;
                case 'receiverAddress':
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: address }));
                    operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('receiverAddress', address);
                    break;
                case 'memo':
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: memo }));
                    operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('memo', memo);
                    break;
            }
        }
    };

    const performFields = async (
        moduleType: string,
        params: IOperationParam[],
        { isUpdateInStore = false, id: targetOpId }: { isUpdateInStore: boolean; id: string },
    ) => {
        await performDisabledOrHiddenFields(targetOpId, moduleType, params);
        await performDefaultValues(params, { targetOpId, isUpdateInStore });
    };

    const callOnWatchOnMounted = async () => {
        await store.dispatch('tokenOps/resetFields');

        if (!currentOp.value) return;

        await performFields(currentOp.value.moduleType, currentOp.value.params, {
            isUpdateInStore: true,
            id: currentOp.value.id,
        });
    };

    // ====================================================================================================
    // * Set the shortcut when the component is mounted
    // * Perform the shortcut when the component is mounted
    // ====================================================================================================
    onMounted(async () => {
        if (!CurrentShortcut.id) {
            console.warn('No shortcut id found');
            return;
        }

        await store.dispatch('shortcuts/setShortcut', {
            shortcut: CurrentShortcut.id,
            data: CurrentShortcut,
        });

        // ====================================================================================================
        // Set the operations factory to the store
        // ====================================================================================================
        await store.dispatch('shortcuts/setShortcutOpsFactory', {
            shortcutId: CurrentShortcut.id,
            operations: new OperationsFactory(),
        });

        shortcutIndex.value = 0;

        isShortcutLoading.value = true;

        await performShortcut(true);

        const { id: stepId = null } = steps.value[shortcutIndex.value] || {};

        if (!stepId) return;

        store.dispatch('shortcuts/setCurrentStepId', {
            stepId,
            shortcutId: Shortcut.id,
        });

        store.dispatch('shortcuts/setCurrentShortcutId', {
            shortcutId: Shortcut.id,
        });

        store.dispatch('shortcuts/setShortcutStatus', {
            shortcutId: Shortcut.id,
            status: SHORTCUT_STATUSES.PENDING,
        });

        if (currentOp.value?.id) {
            const serviceId = operationsFactory.value.getOperationById(currentOp.value.id)?.getParamByField('serviceId');

            serviceId &&
                store.dispatch('tokenOps/setServiceId', {
                    value: serviceId,
                    module: ModuleType.shortcut,
                });
        }

        isShortcutLoading.value = false;
    });

    // ====================================================================================================
    // * Update operation fields when the srcNetwork, dstNetwork, srcToken, dstToken, srcAmount, dstAmount change
    // ====================================================================================================
    store.watch(
        (state, getters) => [
            getters['tokenOps/srcNetwork'],
            getters['tokenOps/dstNetwork'],
            getters['tokenOps/srcToken'],
            getters['tokenOps/dstToken'],
            getters['tokenOps/srcAmount'],
            getters['tokenOps/dstAmount'],
        ],
        async ([srcNet, dstNet, srcToken, dstToken, srcAmount, dstAmount]) => {
            if (!srcNet || !dstNet) return;

            if (currentOp.value?.id) {
                operationsFactory.value.getOperationById(currentOp.value.id)?.setChainId(srcNet.chain_id || srcNet.net);
                operationsFactory.value.getOperationById(currentOp.value.id)?.setEcosystem(srcNet.ecosystem);
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('fromNet', srcNet.net);
                operationsFactory.value.getOperationById(currentOp.value.id)?.setAccount(addressesByChain.value[srcNet.net]);
            }

            if (currentOp.value?.id) {
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('toNet', dstNet.net);
            }

            if (!srcToken || !dstToken) return;

            if (currentOp.value?.id) {
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('fromToken', srcToken.address);
                operationsFactory.value.getOperationById(currentOp.value.id)?.setToken('from', srcToken);
            }

            if (currentOp.value?.id && dstToken?.id) {
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('toToken', dstToken.address);
                operationsFactory.value.getOperationById(currentOp.value.id)?.setToken('to', dstToken);
            }

            if (!srcAmount) return;

            if (currentOp.value?.id) {
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('amount', srcAmount);
            }

            if (!dstAmount) return;

            if (currentOp.value?.id) {
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('outputAmount', dstAmount);
            }
        },
    );

    // ====================================================================================================
    // * Watch for changes in the addressesByChain, and update the ownerAddresses field in the operations
    // ====================================================================================================
    watch(addressesByChain, () => {
        for (const id of opIds.value) {
            const operation = operationsFactory.value.getOperationById(id);
            operation.setParamByField('ownerAddresses', addressesByChain.value);
        }
    });

    // ====================================================================================================
    // * Watch for changes in the srcAmount, and make an estimate output request
    // ====================================================================================================
    store.watch(
        (state, getters) => getters['tokenOps/srcAmount'],
        async (srcAmount) => {
            if (!srcAmount) {
                return;
            }

            console.log('Amount changed', srcAmount);

            if (currentOp.value?.id) {
                operationsFactory.value.resetEstimatedOutputs();
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('amount', srcAmount);
            }

            isQuoteLoading.value = true;

            const isMinAmountAccepted = await checkMinAmount();

            if (!isMinAmountAccepted) {
                return (isQuoteLoading.value = false);
            }

            quoteErrorMessage.value = '';

            await operationsFactory.value.estimateOutput();
            isQuoteLoading.value = false;

            const flow = operationsFactory.value.getFullOperationFlow();

            console.table(flow);

            if (currentOp.value?.id) {
                const outputAmount = operationsFactory.value.getOperationById(currentOp.value.id)?.getParamByField('outputAmount');
                store.dispatch('tokenOps/setDstAmount', outputAmount);
            }
        },
    );

    watch([currentOp, isConfigLoading], async () => await callOnWatchOnMounted());

    watch(isConfigLoading, async () => {
        if (!isConfigLoading.value) {
            await performShortcut(false);
        }
    });

    watch(isQuoteLoading, async () => {
        if (isQuoteLoading.value || !currentOp.value?.id) return;

        const operation = operationsFactory.value.getOperationById(currentOp.value.id);
        const quoteRoute = operation.getQuoteRoute();

        if (!quoteRoute) return;

        store.dispatch('bridgeDexAPI/setSelectedRoute', {
            serviceType: operation.getServiceType(),
            value: quoteRoute,
        });

        store.dispatch('bridgeDexAPI/setQuoteRoutes', {
            serviceType: operation.getServiceType(),
            value: [quoteRoute],
        });

        await performDisabledOrHiddenFields(currentOp.value.id, currentOp.value.moduleType, currentOp.value.params);

        // await performFields(currentOp.value.moduleType, currentOp.value.params, {
        //     isUpdateInStore: true,
        //     id: currentOp.value.id,
        // });
    });

    store.watch(
        (state, getters) => getters['shortcuts/getCurrentStepId'],
        async (stepId) => {
            if (!stepId) return;

            if (!operationsFactory.value.getOperationById(stepId)) return;

            if (!operationsFactory.value.getOperationById(stepId).getParamByField('fromNet')) return;

            console.log(`ACCOUNT for :${stepId} =`, operationsFactory.value.getOperationById(stepId).getAccount());

            if (!operationsFactory.value.getOperationById(stepId).getAccount()) {
                console.log(
                    'ACCOUNT NOT SET',
                    stepId,
                    operationsFactory.value.getOperationById(stepId).getParamByField('fromNet'),
                    addressesByChain.value[operationsFactory.value.getOperationById(stepId).getParamByField('fromNet')],
                );
                operationsFactory.value
                    .getOperationById(stepId)
                    .setAccount(addressesByChain.value[operationsFactory.value.getOperationById(stepId).getParamByField('fromNet')]);
            }
        },
    );

    // ====================================================================================================
    // * Reset the module states when the component is unmounted
    // ====================================================================================================
    onUnmounted(() => {
        quoteErrorMessage.value = '';

        const { moduleType } = currentOp.value || {};

        store.dispatch('moduleStates/resetModuleStates', { module: moduleType });

        store.dispatch('tokenOps/setServiceId', {
            value: null,
            module: ModuleType.shortcut,
        });

        store.dispatch('shortcuts/resetAllShortcuts');
    });

    return {
        shortcut: CurrentShortcut,
        shortcutId: CurrentShortcut.id,
        isShortcutLoading,
        shortcutIndex,
        shortcutLayout,
        shortcutStatus,
        steps,
    };
};

export default useShortcuts;

// const performSkipConditions = async (skipConditions = []) => {
//     for (const condition of skipConditions) {
//         const { name: field, value } = condition || {};
//         const fieldValue = store.getters['tokenOps/getFieldValue'](field);
//         const current = JSON.parse(JSON.stringify(currentOp.value));

//         switch (field) {
//             case 'srcNetwork':
//             case 'dstNetwork':
//                 const isSkipNet = fieldValue && fieldValue.net === value;

//                 isSkipNet &&
//                     store.dispatch('shortcuts/setShortcutStepStatus', {
//                         shortcutId: Shortcut.id,
//                         stepId: steps.value[shortcutIndex.value].id,
//                         status: 'skipped',
//                     });

//                 shortcutIndex.value = isSkipNet ? shortcutIndex.value + 1 : shortcutIndex.value;

//                 if (isSkipNet) {
//                     operationsFactory.value.removeOperationById(current.id);
//                 }

//             case 'srcToken':
//             case 'dstToken':
//                 const isSkipToken = fieldValue && fieldValue.id === value;
//                 isSkipToken &&
//                     store.dispatch('shortcuts/setShortcutStepStatus', {
//                         shortcutId: Shortcut.id,
//                         stepId: steps.value[shortcutIndex.value].id,
//                         status: 'skipped',
//                     });

//                 shortcutIndex.value = isSkipToken ? shortcutIndex.value + 1 : shortcutIndex.value;

//                 if (isSkipToken) {
//                     operationsFactory.value.removeOperationById(current.id);
//                 }
//         }
//     }
// };
