import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import { useStore } from 'vuex';

import _ from 'lodash';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';
import OperationsFactory from '@/modules/operations/OperationsFactory';
import ShortcutRecipe from '../core/ShortcutRecipes';
import ShortcutCl from '../core/Shortcut';
import DexOperation from '@/modules/operations/Dex';
import TransferOperation from '@/modules/operations/Transfer';
import { ApproveOperation } from '@/modules/operations/Approve';
import { SHORTCUT_STATUSES, STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { ShortcutType } from '../core/types/ShortcutType';
import { AddressByChainHash } from '../../../shared/models/types/Address';
import { ECOSYSTEMS } from '@/Adapter/config';
import { IShortcutOp } from '../core/ShortcutOp';
import { IAsset } from '@/shared/models/fields/module-fields';
import { IOperationParam, OperationStep } from '../core/models/Operation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBaseOperation } from '@/modules/operations/models/Operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';

const useShortcuts = (Shortcut: any) => {
    // Create a new instance of the Shortcut class

    if (!Shortcut) {
        return {
            shortcut: {},
            shortcutId: null,
            shortcutIndex: 0,
            shortcutLayout: null,
            shortcutStatus: STATUSES.PENDING,
            steps: [],
        };
    }

    const CurrentShortcut = new ShortcutCl(Shortcut);

    const { getChainByChainId } = useAdapter();
    const { getTokenById } = useTokensList();

    const store = useStore();

    // ====================================================================================================
    // Set the operations factory to the store
    // ====================================================================================================
    store.dispatch('shortcuts/setShortcutOpsFactory', {
        shortcutId: Shortcut.id,
        operations: new OperationsFactory(),
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

    // Operations Ids from the factory
    const opIds = computed(() => Array.from(operationsFactory.value.getOperationsIds().keys()));

    // Get the addresses by chain from the store
    const addressesByChain = computed(() => {
        const src = store.getters['adapters/getAddressesByEcosystem'](ECOSYSTEMS.EVM) as AddressByChainHash;
        const dst = store.getters['adapters/getAddressesByEcosystem'](ECOSYSTEMS.COSMOS) as AddressByChainHash;

        return { ...src, ...dst };
    });

    const processOperation = async (operation: IShortcutOp, { addToFactory = false }: { addToFactory: boolean }) => {
        const { id, moduleType, name, operationType, operationParams, dependencies, serviceId, params = [] } = operation || {};

        if (!addToFactory) {
            return await performFields(moduleType, params, {
                isUpdateInStore: currentOp.value?.id === id,
                id,
            });
        }

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

    const performFields = async (
        moduleType: string,
        params: IOperationParam[],
        { isUpdateInStore = false, id: targetOpId }: { isUpdateInStore: boolean; id: string },
    ) => {
        for (const paramField of params) {
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

            isUpdateInStore &&
                (await store.dispatch('moduleStates/setHideField', {
                    module: moduleType,
                    field,
                    attr: 'hide',
                    value: hide,
                }));

            isUpdateInStore &&
                store.dispatch('moduleStates/setDisabledField', {
                    module: moduleType,
                    field,
                    attr: 'disabled',
                    value: disabled,
                });
        }
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
    // ====================================================================================================
    onBeforeMount(async () => {
        await store.dispatch('shortcuts/setShortcut', {
            shortcut: CurrentShortcut.id,
            data: CurrentShortcut,
        });
    });

    // ====================================================================================================
    // * Perform the shortcut when the component is mounted
    // ====================================================================================================
    onMounted(async () => {
        console.log('mounted', CurrentShortcut.id, Shortcut);
        if (!CurrentShortcut.id) return;

        shortcutIndex.value = 0;

        await performShortcut(true);

        store.dispatch('shortcuts/setCurrentStepId', {
            stepId: steps.value[shortcutIndex.value].id,
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

        await callOnWatchOnMounted();
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
            if (!srcAmount) return;
            operationsFactory.value.resetEstimatedOutputs();

            if (currentOp.value?.id) {
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('amount', srcAmount);
            }

            await operationsFactory.value.estimateOutput();
        },
    );

    watch([currentOp, isConfigLoading], async () => await callOnWatchOnMounted());
    watch(isConfigLoading, async () => {
        if (!isConfigLoading.value) {
            await performShortcut(false);
        }
    });
    watch(operationsFactory, async () => await callOnWatchOnMounted());

    watch(shortcutIndex, async () => {
        await store.dispatch('tokenOps/resetFields');

        await store.dispatch('shortcuts/setCurrentStepId', {
            shortcutId: Shortcut.id,
            stepId: steps.value[shortcutIndex.value].id,
        });
    });

    // ====================================================================================================
    // * Reset the module states when the component is unmounted
    // ====================================================================================================
    onUnmounted(() => {
        const { moduleType } = currentOp.value || {};

        store.dispatch('moduleStates/resetModuleStates', { module: moduleType });

        // store.dispatch('shortcuts/resetShortcut');
    });

    return {
        shortcut: CurrentShortcut,
        shortcutId: CurrentShortcut.id,
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
