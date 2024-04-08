import { computed, h, onBeforeMount, onMounted, onUnmounted, onUpdated, ref, watch, watchEffect } from 'vue';
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
import { AddressByChainHash } from '../../../shared/models/types/Address';
import { ECOSYSTEMS, NATIVE_CONTRACT } from '@/Adapter/config';
import { IShortcutOp } from '../core/ShortcutOp';
import { IAsset } from '@/shared/models/fields/module-fields';
import { IOperationParam, OperationStep } from '../core/models/Operation';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import { IBaseOperation } from '@/modules/operations/models/Operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import BigNumber from 'bignumber.js';

import { useRouter } from 'vue-router';
import { StepProps, message } from 'ant-design-vue';

const useShortcuts = (Shortcut: IShortcutData) => {
    // Create a new instance of the Shortcut class

    const CurrentShortcut = new ShortcutCl(Shortcut);

    const { getChainByChainId } = useAdapter();
    const { getTokenById } = useTokensList();

    const store = useStore();
    const router = useRouter();

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
    const currentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);

    const currentOp = computed<IShortcutOp>(() => {
        if (!CurrentShortcut.id || !currentStepId.value) return null;

        return store.getters['shortcuts/getCurrentOperation'](CurrentShortcut.id);
    });

    const shortcutLayout = computed(() => store.getters['shortcuts/getCurrentLayout']);

    const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](CurrentShortcut.id));
    const operationsFactory = computed<OperationsFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](CurrentShortcut.id));

    const steps = computed<StepProps[]>(() => store.getters['shortcuts/getShortcutSteps'](CurrentShortcut.id));

    const firstOperation = computed<IBaseOperation>(() => operationsFactory.value.getFirstOperation());

    // Operations Ids from the factory
    const opIds = computed(() => operationsFactory.value && Array.from(operationsFactory.value.getOperationsIds().keys()));

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

        const { operations = [] } = CurrentShortcut || {};

        for (const shortcutOperation of operations) {
            const { id: opId, dependencies: opDeps = null } = shortcutOperation as any;

            await processOperation(shortcutOperation as IShortcutOp, { addToFactory });

            opDeps && operationsFactory.value.setDependencies(opId, opDeps);
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
            const { name: field, ecosystem = null, chainId = null, chain = null, id = null, address, memo } = paramField || {};

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
        if (!currentOp.value) return;

        await store.dispatch('tokenOps/resetFields');

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

        const [order] = operationsFactory.value.getOperationOrder() || [];

        const stepId = operationsFactory.value.getOperationIdByKey(order);

        if (!stepId) {
            isShortcutLoading.value = false;
            return router.push('/shortcuts');
        }

        store.dispatch('shortcuts/setCurrentShortcutId', {
            shortcutId: CurrentShortcut.id,
        });

        store.dispatch('shortcuts/setCurrentStepId', {
            stepId,
            shortcutId: CurrentShortcut.id,
        });

        store.dispatch('shortcuts/setShortcutStatus', {
            shortcutId: CurrentShortcut.id,
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

            try {
                await operationsFactory.value.estimateOutput();
            } catch (error) {
                const { message = 'Error in evaluating output data' } = error || {};
                quoteErrorMessage.value = message;
            } finally {
                isQuoteLoading.value = false;
            }

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

    store.watch(
        (state, getters) => getters['shortcuts/getCurrentOperation'](CurrentShortcut.id, currentStepId.value),
        async (operation) => {
            if (!operation) return;
            await callOnWatchOnMounted();
        },
    );

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
        currentStepId,
        operationsFactory,
    };
};

export default useShortcuts;
