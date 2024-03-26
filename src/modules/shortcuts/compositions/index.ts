import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue';
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
import { TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { ShortcutType } from '../core/types/ShortcutType';
import { AddressByChainHash } from '../../../shared/models/types/Address';
import { ECOSYSTEMS } from '@/Adapter/config';
import { IShortcutOp } from '../core/ShortcutOp';
import { IAsset } from '@/shared/models/fields/module-fields';
import { IOperationParam, OperationStep } from '../core/models/Operation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBaseOperation } from '@/modules/operations/models/Operations';

const useShortcuts = (Shortcut: any) => {
    // Create a new instance of the Shortcut class
    const CurrentShortcut = new ShortcutCl(Shortcut);

    // Create a new instance of the OperationsFactory class to manage the operations
    const { getChainByChainId } = useAdapter();
    const { getTokenById } = useTokensList();

    const store = useStore();

    store.dispatch('shortcuts/setShortcutOpsFactory', {
        shortcutId: Shortcut.id,
        operations: new OperationsFactory(),
    });

    const shortcutIndex = computed({
        get: () => store.getters['shortcuts/getShortcutIndex'],
        set: (value) => store.dispatch('shortcuts/setShortcutIndex', { index: value }),
    });

    const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

    const steps = computed<OperationStep[]>(() => store.getters['shortcuts/getShortcutSteps'](Shortcut.id));

    const currentOp = computed<IShortcutOp>(() => store.getters['shortcuts/getCurrentOperation'](Shortcut.id));

    const operationsFactory = computed<OperationsFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](Shortcut.id));

    const getAddressesByEcosystem = ({ ecosystem, both = false }: { ecosystem?: string; both?: boolean }): AddressByChainHash => {
        if (both) {
            const src = store.getters['adapters/getAddressesByEcosystem'](ECOSYSTEMS.EVM) as AddressByChainHash;
            const dst = store.getters['adapters/getAddressesByEcosystem'](ECOSYSTEMS.COSMOS) as AddressByChainHash;

            return { ...src, ...dst };
        }

        if (!ecosystem) return {};

        return store.getters['adapters/getAddressesByEcosystem'](ecosystem) as AddressByChainHash;
    };

    const addressesByChain = computed(() => getAddressesByEcosystem({ both: true }));

    const updateOpFactoryField = (field: string, value: any) => {
        if (!currentOp.value?.id) return;
        if (!operationsFactory.value.getOperationById(currentOp.value.id)) return;

        operationsFactory.value.getOperationById(currentOp.value.id).setParamByField(field, value);
    };

    const updateOpFactoryChainId = (value: string) => {
        if (!currentOp.value?.id) return;
        if (!operationsFactory.value.getOperationById(currentOp.value.id)) return;
        operationsFactory.value.getOperationById(currentOp.value.id).setChainId(value);
    };

    const updateOpFactoryEcosystem = (value: string) => {
        if (!currentOp.value?.id) return;
        if (!operationsFactory.value.getOperationById(currentOp.value.id)) return;
        operationsFactory.value.getOperationById(currentOp.value.id).setEcosystem(value as Ecosystems);
    };

    const updateOpFactoryAccount = (value: string) => {
        if (!currentOp.value?.id) return;
        if (!operationsFactory.value.getOperationById(currentOp.value.id)) return;
        operationsFactory.value.getOperationById(currentOp.value.id).setAccount(value);
    };

    const updateOpFactoryToken = (target: 'from' | 'to', token: IAsset) => {
        if (!currentOp.value?.id) return;
        if (!operationsFactory.value.getOperationById(currentOp.value.id)) return;
        operationsFactory.value.getOperationById(currentOp.value.id).setToken(target, token);
    };

    const processOperation = async (operation: IShortcutOp, { addToFactory = false }: { addToFactory: boolean }) => {
        const { id, moduleType, name, operationType, operationParams, dependencies, serviceId, params = [] } = operation || {};

        if (!addToFactory) {
            return await performFields(moduleType, params, {
                isUpdateInStore: currentOp.value?.id === id,
                id,
            });
        }

        let key: string, module: any, index: number;

        switch (operationType) {
            case TRANSACTION_TYPES.DEX:
            case TRANSACTION_TYPES.BRIDGE:
                ({ key, module, index } = operationsFactory.value.registerOperation(moduleType, DexOperation, { id, name }));
                break;
            case TRANSACTION_TYPES.TRANSFER:
            case TRANSACTION_TYPES.STAKE:
                ({ key, module, index } = operationsFactory.value.registerOperation(moduleType, TransferOperation, { id, name }));
                break;
            case TRANSACTION_TYPES.APPROVE:
                ({ key, module, index } = operationsFactory.value.registerOperation(moduleType, ApproveOperation, { id, name }));
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

                    isSrc
                        ? operationsFactory.value?.getOperationById(targetOpId).setParamByField('fromNet', srcDstNet?.net)
                        : operationsFactory.value?.getOperationById(targetOpId).setParamByField('toNet', srcDstNet?.net);

                    isSrc ? operationsFactory.value?.getOperationById(targetOpId).setChainId(srcDstNet.chain_id || srcDstNet.net) : null;
                    isSrc ? operationsFactory.value?.getOperationById(targetOpId).setEcosystem(srcDstNet.ecosystem) : null;

                    isSrc ? operationsFactory.value?.getOperationById(targetOpId).setAccount(addressesByChain.value[srcDstNet.net]) : null;

                    break;
                case 'srcToken':
                case 'dstToken':
                    const tokenNet = getChainByChainId(ecosystem, chain);
                    const token = (await getTokenById(tokenNet, id)) as IAsset;
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: token }));

                    const target = field === 'srcToken' ? 'from' : 'to';
                    operationsFactory.value?.getOperationById(targetOpId).setToken(target, token);

                    break;
                case 'receiverAddress':
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: address }));
                    operationsFactory.value?.getOperationById(targetOpId).setParamByField('receiverAddress', address);
                    break;
                case 'memo':
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: memo }));
                    operationsFactory.value?.getOperationById(targetOpId).setParamByField('memo', memo);
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

        // const { params = [], skipConditions = [] } = currentOp.value || {};

        // await performSkipConditions(skipConditions);

        // return await performFields(params);

        await performFields(currentOp.value.moduleType, currentOp.value.params, {
            isUpdateInStore: true,
            id: currentOp.value.id,
        });
    };

    watch([currentOp, isConfigLoading], async () => await callOnWatchOnMounted());
    watch(isConfigLoading, async () => {
        if (!isConfigLoading.value) {
            await performShortcut(false);
        }
    });
    watch(operationsFactory, async () => await callOnWatchOnMounted());

    onBeforeMount(async () => {
        await store.dispatch('shortcuts/setShortcut', {
            shortcut: Shortcut.id,
            data: Shortcut.recipe,
        });
    });

    onMounted(async () => {
        shortcutIndex.value = 0;

        store.dispatch('shortcuts/setCurrentStepId', {
            stepId: steps.value[shortcutIndex.value].id,
            shortcutId: Shortcut.id,
        });

        store.dispatch('shortcuts/setCurrentShortcutId', {
            shortcutId: Shortcut.id,
        });

        await performShortcut(true);

        await callOnWatchOnMounted();
    });

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

            updateOpFactoryField('fromNet', srcNet.net);
            updateOpFactoryChainId(srcNet.chain_id || srcNet.net);
            updateOpFactoryEcosystem(srcNet.ecosystem);

            updateOpFactoryAccount(addressesByChain.value[srcNet.net]);

            dstNet?.net && updateOpFactoryField('toNet', dstNet.net);

            if (!srcToken || !dstToken) return;

            updateOpFactoryField('fromToken', srcToken.address);
            updateOpFactoryToken('from', srcToken);

            dstToken?.id && updateOpFactoryField('toToken', dstToken.address);
            dstToken?.id && updateOpFactoryToken('to', dstToken);

            if (!srcAmount) return;
            updateOpFactoryField('amount', srcAmount);

            if (!dstAmount) return;
            updateOpFactoryField('outputAmount', dstAmount);
        },
    );

    store.watch(
        (state, getters) => getters['tokenOps/srcAmount'],
        async (srcAmount) => {
            if (!srcAmount) return;
            operationsFactory.value.resetEstimatedOutputs();

            updateOpFactoryField('amount', srcAmount);

            await operationsFactory.value.estimateOutput();
        },
    );

    watch(shortcutIndex, async () => {
        await store.dispatch('tokenOps/resetFields');

        await store.dispatch('shortcuts/setCurrentStepId', {
            shortcutId: Shortcut.id,
            stepId: steps.value[shortcutIndex.value].id,
        });
    });

    onUnmounted(() => {
        const { moduleType } = currentOp.value || {};

        store.dispatch('moduleStates/resetModuleStates', { module: moduleType });
    });

    return {
        shortcut: CurrentShortcut,
        shortcutIndex,
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
