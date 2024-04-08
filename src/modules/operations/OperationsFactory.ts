import Amount from '@/components/app/Amount.vue';
import { IBaseOperation, IOperationFactory, IRegisterOperation } from '@/modules/operations/models/Operations';
import { ModuleType, ModuleTypes } from '@/shared/models/enums/modules.enum';
import { STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import { Col, Row, Space, Tag } from 'ant-design-vue';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { h } from 'vue';
// import { BaseOperation } from '@/modules/operations/BaseOperation';
// import DexOperation from '@/modules/operations/Dex';
// import TransferOperation from './Transfer';

interface IDependencyParams {
    dependencyParamKey: string;
    paramKey: string;
    usePercentage?: number;
}

interface IOperationDependencies {
    operationId: string;
    operationParams: IDependencyParams[];
}

const isAmountCorrect = (amount: string): boolean => {
    if (_.isNaN(Number(amount))) {
        return false;
    }

    if (BigNumber(amount).isLessThanOrEqualTo(0)) {
        return false;
    }

    return true;
};

export default class OperationFactory implements IOperationFactory {
    private operationsMap: Map<string, IBaseOperation> = new Map<string, IBaseOperation>();
    private operationsIds: Map<string, string> = new Map<string, string>();
    private operationsIndex: Map<string, string> = new Map<string, string>();
    private groupOps: Map<string, string[]> = new Map<string, string[]>();
    private operationDependencies: Map<string, IOperationDependencies> = new Map<string, IOperationDependencies>();
    private operationsStatusByKey: Map<string, STATUSES> = new Map<string, STATUSES>();
    private operationOrder: string[] = [];

    getOperationsIds(): Map<string, string> {
        return this.operationsIds;
    }

    getOperationOrder(): string[] {
        return this.operationOrder;
    }

    getOperationByOrderIndex(index: number): IBaseOperation {
        return this.operationsMap.get(this.operationOrder[index]);
    }

    registerOperation(
        module: string,
        operationClass: new () => IBaseOperation,
        options?: { id?: string; name?: string; before?: string; after?: string },
    ): IRegisterOperation {
        const { name = null, before = null, after = null } = options || {};

        let { id = null } = options || {};

        const uniqueKey = `${module}_${this.operationsMap.size}`;

        if (!id) {
            console.warn('OperationId not provided');
            id = uniqueKey;
        }

        if (this.operationsIds.get(id)) {
            console.warn(`Operation with id ${id} already exists`);
            return null;
        }

        if (!before && !after) {
            this.operationOrder.push(uniqueKey);
        } else if (before) {
            const beforeIndex = this.operationOrder.indexOf(before);

            if (beforeIndex === -1) {
                console.warn(`Operation ${before} not found`);
                return null;
            }

            this.operationOrder.splice(beforeIndex, 0, `${module}_${this.operationsMap.size}`);
        } else if (after) {
            const afterIndex = this.operationOrder.indexOf(after);

            if (afterIndex === -1) {
                console.warn(`Operation ${after} not found`);
                return null;
            }

            this.operationOrder.splice(afterIndex + 1, 0, `${module}_${this.operationsMap.size}`);
        }

        const operation = new operationClass();

        operation.setUniqueId(uniqueKey);

        operation.setModule(module as ModuleTypes);

        name && operation.setName(name);

        this.operationsMap.set(uniqueKey, operation);

        this.setOperationStatusByKey(uniqueKey, STATUSES.PENDING);

        if (id) {
            this.operationsIds.set(id, uniqueKey);
            this.operationsIndex.set(uniqueKey, id);
        }

        return {
            key: uniqueKey,
            module,
            index: this.operationsMap.size - 1,
        };
    }

    setOperationToGroup(group: string, operationKey: string): void {
        if (this.groupOps.has(group)) {
            this.groupOps.set(group, [...this.groupOps.get(group), operationKey]);
        } else {
            this.groupOps.set(group, [operationKey]);
        }
    }

    setDependencies(id: string, dependencies: IOperationDependencies): void {
        this.operationDependencies.set(id, dependencies);
    }

    getOperation(module: string, operationIndex: number): IBaseOperation {
        return this.operationsMap.get(`${module}_${operationIndex}`);
    }

    getOperationByKey(key: string): IBaseOperation {
        return this.operationsMap.get(key);
    }

    getOperationById(id: string): IBaseOperation {
        return this.operationsMap.get(this.operationsIds.get(id));
    }

    setParams(module: string, operationIndex: number, params: any): void {
        const operation = this.getOperation(module, operationIndex);
        operation.setParams(params);
    }

    setParamByField(module: string, operationIndex: number, field: string, value: any): void {
        const operation = this.getOperation(module, operationIndex);
        operation.setParamByField(field, value);
    }

    setParamValueById(id: string, field: string, value: any): void {
        const operation = this.getOperationById(id);
        operation.setParamByField(field, value);
    }

    getParams(module: string, operationIndex: number): any {
        if (!this.getOperation(module, operationIndex)) {
            return null;
        }

        return this.getOperation(module, operationIndex).getParams();
    }

    getParamsByKey(module: string, key: string): any {
        if (!this.getOperationByKey(module)) {
            return null;
        }

        const params = this.getOperationByKey(module).getParams();

        return params[key] || null;
    }

    getFirstOperationByOrder(): string {
        if (!this.operationOrder.length) return null;
        return this.operationOrder[0];
    }

    getFirstOperation(): IBaseOperation {
        return this.operationsMap.values().next().value;
    }

    getLastOperation(): IBaseOperation {
        return Array.from(this.operationsMap.values()).pop();
    }

    getFullOperationFlow(): TxOperationFlow[] {
        const flow: TxOperationFlow[] = [];

        for (const operation of this.operationOrder) {
            const opFlow = this.operationsMap.get(operation).getOperationFlow();

            flow.push(
                ...opFlow.map((f, i) => ({
                    ...f,
                    operationId: this.operationsIndex.get(operation),
                    moduleIndex: operation,
                    title: this.operationsMap.get(operation).getName() || null,
                })),
            );
        }

        return flow.map((f, i) => ({ ...f, index: i })).sort((a, b) => a.index - b.index);
    }

    getDependenciesById(id: string): IOperationDependencies {
        if (!this.operationDependencies.has(id)) return null;

        const { operationId = null, operationParams = [] } = this.operationDependencies.get(id) || {};

        if (!operationId || !operationParams.length) return null;
        if (operationId && !this.operationsIds.has(operationId)) return null;

        return { operationId, operationParams };
    }

    processDependencyParams(opId: string, { isSetParam = false }: { isSetParam: boolean }): void {
        const operation = this.getOperationById(opId);
        const { operationId = null, operationParams = [] } = this.getDependenciesById(opId) || {};

        if (!operationId || !operationParams.length) return;

        const dependOperation = this.getOperationById(operationId);

        if (!dependOperation) {
            console.warn(`Operation ${operationId} not found`);
            return;
        }

        for (const param of operationParams) {
            const { dependencyParamKey, paramKey, usePercentage = 0 } = param || {};

            const depValue = dependOperation.getParamByField(dependencyParamKey);

            if (!isAmountCorrect(depValue)) return;

            if (usePercentage) {
                const value = this.calculatePercentage(depValue, usePercentage);

                isSetParam && operation.setParamByField(paramKey, value);
            } else {
                isSetParam && operation.setParamByField(paramKey, depValue);
            }
        }
    }

    async estimateOutput(): Promise<void> {
        const operations = Array.from(this.operationsMap.keys());

        const table = [];

        for (const operation of operations) {
            const opId = this.operationsIndex.get(operation);
            const currentOperation = this.operationsMap.get(operation);

            const mainStatus = this.operationsStatusByKey.get(operation);

            const restoreStatus = () => {
                return this.setOperationStatusByKey(operation, mainStatus === STATUSES.ESTIMATING ? STATUSES.PENDING : mainStatus);
            };

            this.setOperationStatusByKey(operation, STATUSES.ESTIMATING);

            if (!this.operationsIds.has(opId)) {
                console.warn(`Operation ${opId} not found`);
                restoreStatus();
                continue;
            }

            this.processDependencyParams(opId, { isSetParam: true });

            const isSuccessOrFail = [STATUSES.SUCCESS, STATUSES.FAILED].includes(mainStatus);

            if (isSuccessOrFail || !isAmountCorrect(currentOperation.getParamByField('amount'))) {
                restoreStatus();
                continue;
            }

            try {
                await this.operationsMap.get(operation).estimateOutput();
                restoreStatus();
            } catch (error) {
                console.warn(`${opId} - ESTIMATE ERROR ############`);
                console.error(error);
                restoreStatus();
                throw error;
            }

            table.push({
                operation: opId,
                amount: currentOperation.getParamByField('amount'),
                outputAmount: currentOperation.getParamByField('outputAmount'),
            });
        }

        console.log('ESTIMATE OUTPUT');
        console.table(table);
    }

    removeOperationById(id: string): void {
        const key = this.operationsIds.get(id);
        this.operationsMap.delete(key);
        this.operationsIds.delete(id);
        this.operationsIndex.delete(key);
    }

    resetOperationsStatus(): void {
        const operations = Array.from(this.operationsMap.keys());

        for (const operation of operations) {
            this.setOperationStatusByKey(operation, STATUSES.PENDING);
        }

        this.resetEstimatedOutputs();
    }

    resetEstimatedOutputs(): void {
        const operations = Array.from(this.operationsMap.keys());

        for (const operation of operations) {
            this.operationsMap.get(operation).setParamByField('amount', null);
            this.operationsMap.get(operation).setParamByField('outputAmount', null);
        }
    }

    getOperationIdByKey(key: string): string {
        return this.operationsIndex.get(key);
    }

    getOperationsStatusById(id: string): STATUSES {
        return this.operationsStatusByKey.get(this.operationsIds.get(id));
    }

    setOperationStatusById(id: string, status: STATUSES): void {
        if (!this.operationsIds.get(id)) {
            console.warn(`Operation with id ${id} not found`);
            return;
        }

        this.operationsStatusByKey.set(this.operationsIds.get(id), status);
    }

    setOperationStatusByKey(key: string, status: STATUSES): void {
        if (!this.operationsMap.has(key)) {
            console.warn(`Operation with key ${key} not found`);
            return;
        }

        this.operationsStatusByKey.set(key, status);
    }

    getOperationsStatusByKey(key: string): STATUSES {
        return this.operationsStatusByKey.get(key);
    }

    getOperationAdditionalTooltipById(id: string): any {
        const ALLOW_KEYS = ['amount', 'outputAmount'];

        const tooltips = [];

        const operation = this.getOperationById(id);

        if (!operation || !operation.getAdditionalTooltip) return null;

        if (!this.getDependenciesById(id)) return null;

        const { operationId, operationParams } = this.getDependenciesById(id);

        const dependOperation = this.getOperationById(operationId);

        if (!operationParams.length) return null;

        for (const param of operationParams) {
            const info = {
                amountSrcInfo: null,
                percentageInfo: null,
            };

            const { dependencyParamKey, paramKey, usePercentage = 0 } = param || {};

            if (!dependOperation) {
                console.warn(`Operation ${operationId} not found`);
                continue;
            }

            if (!ALLOW_KEYS.includes(dependencyParamKey) || !ALLOW_KEYS.includes(paramKey)) continue;

            if (!usePercentage) continue;

            const dependUniqueKey = this.operationsIds.get(operationId);
            const [m2, depOpIndex] = dependUniqueKey.split('_');

            const { from: depFrom, to: depTo } = dependOperation.getTokens() || {};
            const { from: opFrom, to: opTo } = operation.getTokens() || {};

            const isDepSrc = _.isEqual(dependencyParamKey, 'amount');
            const isOpSrc = _.isEqual(paramKey, 'amount');

            const depToken = isDepSrc ? depFrom : depTo;
            const opToken = isOpSrc ? opFrom : opTo;

            const depValue = dependOperation.getParamByField(dependencyParamKey);
            const value = this.calculatePercentage(depValue, usePercentage);

            info.percentageInfo = {
                percentage: {
                    amount: usePercentage,
                    symbol: '%',
                },
                from: {
                    amount: depValue,
                    symbol: depToken?.symbol,
                },
                to: {
                    amount: value,
                    symbol: opToken?.symbol,
                },
            };

            info.amountSrcInfo = {
                to: {
                    amount: value || '0',
                    symbol: opToken?.symbol,
                },
                from: {
                    amount: depValue || '0',
                    symbol: depToken?.symbol,
                },
                stepIndex: +depOpIndex + 1,
            };

            tooltips.push(info);
        }

        return tooltips;
    }

    private calculatePercentage(amount: string, percentage: number): string {
        if (!isAmountCorrect(amount)) return '0';
        return BigNumber(amount).multipliedBy(percentage).dividedBy(100).toFixed(6);
    }

    getPercentageOfSuccessOperations(): string {
        const STATUS_TO_EXCLUDE = [STATUSES.PENDING, STATUSES.ESTIMATING];
        const STATUS_TO_HALF_SUCCESS = [STATUSES.IN_PROGRESS, STATUSES.SIGNING, STATUSES.REJECTED, STATUSES.FAILED];

        const operations = Array.from(this.operationsMap.keys());

        const successScore = operations.reduce((score, operation) => {
            const status = this.operationsStatusByKey.get(operation);
            if (STATUS_TO_EXCLUDE.includes(status)) {
                return 0;
            } else if (STATUS_TO_HALF_SUCCESS.includes(status)) {
                return score + 0.5;
            } else {
                return score + 1;
            }
        }, 0);

        return BigNumber(successScore).dividedBy(operations.length).multipliedBy(100).toFixed(2);
    }

    getOperationsCount(): number {
        return this.operationsMap.size;
    }
}
