import { IBaseOperation, IOperationFactory, IRegisterOperation } from '@/modules/operations/models/Operations';
import { ModuleType, ModuleTypes } from '@/shared/models/enums/modules.enum';
import { STATUSES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
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

    getOperationsIds(): Map<string, string> {
        return this.operationsIds;
    }

    registerOperation(module: string, operationClass: new () => IBaseOperation, options?): IRegisterOperation {
        const { id = null, name = null } = options || {};

        if (this.operationsIds.get(id)) {
            console.warn(`Operation with id ${id} already exists`);
            return null;
        }

        const uniqueKey = `${module}_${this.operationsMap.size}`;

        const operation = new operationClass();

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

    getFirstOperation(): IBaseOperation {
        return this.operationsMap.values().next().value;
    }

    passParams(fromModule: string, fromIndex: number, toModule: string, toIndex: number): void {
        const fromKey = `${fromModule}_${fromIndex}`;
        const toKey = `${toModule}_${toIndex}`;

        const fromOperation = this.operationsMap.get(fromKey);
        const toOperation = this.operationsMap.get(toKey);

        if (fromOperation && toOperation) {
            const params = fromOperation.getParams();
            toOperation.setParamByField('amount', params.amount);
        }
    }

    getFullOperationFlow(): TxOperationFlow[] {
        const flow: TxOperationFlow[] = [];
        const operations = Array.from(this.operationsMap.keys());

        for (const operation of operations) {
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

    async estimateOutput(): Promise<void> {
        const operations = Array.from(this.operationsMap.keys());

        const table = [];

        for (const operation of operations) {
            const opId = this.operationsIndex.get(operation);
            const currentOperation = this.operationsMap.get(operation);

            console.log(`${opId}  - ESTIMATE START ############`);

            if (this.operationDependencies.has(opId)) {
                const { operationId, operationParams } = this.operationDependencies.get(opId);

                const dependOperation = this.operationsMap.get(this.operationsIds.get(operationId));

                operationParams.forEach((param) => {
                    const { dependencyParamKey, paramKey, usePercentage } = param;

                    if (!dependOperation) {
                        console.warn(`Operation ${operationId} not found`);
                        return;
                    }

                    const depValue = dependOperation.getParamByField(dependencyParamKey);

                    if (usePercentage) {
                        if (!isAmountCorrect(depValue)) {
                            console.warn(`Incorrect value for ${dependencyParamKey} in ${operationId}`);
                            return;
                        }

                        const value = BigNumber(depValue).multipliedBy(usePercentage).dividedBy(100).toFixed(6);

                        console.log(`${dependencyParamKey} from ${operationId}`);

                        console.log(`${paramKey} = ${dependencyParamKey} * ${usePercentage} / 100`);
                        console.log(`${paramKey} = ${depValue} * ${usePercentage} / 100 = ${value}`);

                        currentOperation.setParamByField(paramKey, value);
                    } else {
                        console.log('Set param', paramKey, depValue);
                        currentOperation.setParamByField(paramKey, depValue);
                    }
                });
            }

            if (this.operationsMap.get(operation).estimateOutput) {
                await this.operationsMap.get(operation).estimateOutput();
                console.log(`${opId} - DONE ############`);

                console.log('OUTPUT AMOUNT', currentOperation.getParamByField('outputAmount'));

                console.log('\n\n');
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
            console.log('RESET STATUS', operation, this.operationsStatusByKey.get(operation), STATUSES.PENDING);
            this.setOperationStatusByKey(operation, STATUSES.PENDING);
        }

        // this.resetEstimatedOutputs();
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
        return this.operationsStatusByKey.get(this.operationsIndex.get(id));
    }

    setOperationStatusById(id: string, status: STATUSES): void {
        this.operationsStatusByKey.set(this.operationsIndex.get(id), status);
    }

    setOperationStatusByKey(key: string, status: STATUSES): void {
        this.operationsStatusByKey.set(key, status);
    }

    getOperationsStatusByKey(key: string): STATUSES {
        return this.operationsStatusByKey.get(key);
    }
}
