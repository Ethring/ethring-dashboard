import _ from 'lodash';
import BigNumber from 'bignumber.js';

import {
    IBaseOperation,
    IOperationFactory,
    IRegisterOperation,
    IOperationsResult,
    IOperationsResultToken,
} from '@/core/operations/models/Operations';

import { ModuleTypes } from '@/shared/models/enums/modules.enum';
import { STATUSES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES, TX_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';

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
    if (_.isNaN(Number(amount))) return false;

    if (BigNumber(amount).isLessThanOrEqualTo(0)) return false;

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

    getOperationByOrderIndex(index: number): IBaseOperation | undefined {
        if (index >= this.operationOrder.length) return undefined;
        if (index < 0) return undefined;
        if (!this.operationOrder[index]) return undefined;
        if (!this.operationsMap.has(this.operationOrder[index])) return undefined;
        if (!this.operationsMap.get(this.operationOrder[index])) return undefined;

        this.operationsMap.get(this.operationOrder[index]);
    }

    registerOperation(
        module: string,
        operationClass: new () => IBaseOperation,
        options?: { id?: string; name?: string; before?: string; after?: string; make?: string },
    ): IRegisterOperation | null {
        const { name = null, before = null, after = null, make } = options || {};
        console.log(options, '--options');

        let { id = null } = options || {};

        const uniqueKey = `${module}_${this.operationsMap.size}`;

        console.log('Register operation', uniqueKey);
        if (!id) id = uniqueKey;

        if (this.operationsIds.get(id)) {
            console.warn(`Operation with id ${id} already exists`);
            return {
                key: uniqueKey,
                module,
                index: this.operationsMap.size - 1,
            };
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

        if (make && make !== undefined) operation.setMake(make as any);

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
            const existingGroupOps = this.groupOps.get(group) || [];
            this.groupOps.set(group, [...existingGroupOps, operationKey]);
        } else {
            this.groupOps.set(group, [operationKey]);
        }
    }

    setDependencies(id: string, dependencies: IOperationDependencies): void {
        this.operationDependencies.set(id, dependencies);
    }
    getOperation(module: string, operationIndex: number): IBaseOperation | null {
        return this.operationsMap.get(`${module}_${operationIndex}`) || null;
    }

    getOperationByKey(key: string): IBaseOperation {
        if (!this.operationsMap.has(key)) return {} as IBaseOperation;
        return this.operationsMap.get(key) || ({} as IBaseOperation);
    }

    getOperationById(id: string): IBaseOperation | null {
        if (!this.operationsIds.has(id)) return null;
        if (!this.operationsIds.get(id)) return null;

        const key = this.operationsIds.get(id);

        if (!key) return null;
        if (key && !this.operationsMap.has(key)) return null;

        return this.operationsMap.get(key) || null;
    }

    setParamsByKey(moduleKey: string, params: any): void {
        const operation = this.getOperationByKey(moduleKey);

        if (!operation) {
            console.warn(`(setParamsByKey) Operation ${moduleKey} not found`);
            return;
        }

        if (operation && operation.setParams) operation.setParams(params);
    }

    setParams(module: string, operationIndex: number, params: any): void {
        const operation = this.getOperation(module, operationIndex);
        if (!operation) {
            console.warn(`Operation ${module}_${operationIndex} not found`);
            return;
        }
        operation.setParams(params);
    }

    setParamByField(module: string, operationIndex: number, field: string, value: any): void {
        const operation = this.getOperation(module, operationIndex);
        if (!operation) {
            console.warn(`Operation ${module}_${operationIndex} not found`);
            return;
        }
        operation.setParamByField(field, value);
    }

    setParamValueById(id: string, field: string, value: any): void {
        const operation = this.getOperationById(id);
        if (!operation) {
            console.warn(`Operation ${id} not found`);
            return;
        }
        operation.setParamByField(field, value);
    }

    getParams(module: string, operationIndex: number): any {
        if (!this.getOperation(module, operationIndex)) return null;
        const operation = this.getOperation(module, operationIndex);

        if (!operation) return null;
        if (operation && !operation.getParams()) return null;

        return operation.getParams();
    }

    getParamsByKey(module: string, key: string): any {
        if (!this.getOperationByKey(module)) return null;

        const params = this.getOperationByKey(module).getParams();

        return params[key] || null;
    }

    getFirstOperationByOrder(): string {
        if (!this.operationOrder.length) return '';
        return this.operationOrder[0];
    }
    getFirstOperation(): IBaseOperation {
        return this.operationsMap.values().next().value;
    }
    getLastOperation(): IBaseOperation | null {
        const lastKey = this.operationOrder[this.operationOrder.length - 1];
        return this.operationsMap.get(lastKey) || null;
    }

    getFullOperationFlow(): TxOperationFlow[] {
        const flow: TxOperationFlow[] = [];

        for (const operation of this.operationOrder) {
            if (!this.operationsMap.has(operation)) continue;
            const op = this.operationsMap.get(operation);

            if (!op) continue;
            if (!op.getOperationFlow) continue;

            const opFlow = op.getOperationFlow();

            const opInternalFlow =
                opFlow.map((f) => ({
                    ...f,
                    operationId: this.operationsIndex.get(operation),
                    moduleIndex: operation,
                    title: op.getName() || '',
                })) || [];

            if (!opInternalFlow.length) continue;

            flow.push(...opInternalFlow);
        }

        return flow.map((f, i) => ({ ...f, index: i })).sort((a, b) => a.index - b.index);
    }

    getDependenciesById(id: string): IOperationDependencies | null {
        if (!this.operationDependencies.has(id)) return null;

        const { operationId = null, operationParams = [] } = this.operationDependencies.get(id) || {};

        if (!operationId || !operationParams.length) return null;
        if (operationId && !this.operationsIds.has(operationId)) return null;

        return { operationId, operationParams };
    }

    processDependencyParams(opId: string, { isSetParam = false }: { isSetParam: boolean }): void {
        const operation = this.getOperationById(opId);
        if (!operation) return;

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
            const opId = this.operationsIndex.get(operation) || '';

            const currentOperation = this.operationsMap.get(operation);

            if (!currentOperation) continue;

            const mainStatus = this.operationsStatusByKey.get(operation);

            const restoreStatus = () => {
                const restoringStatus = mainStatus === STATUSES.ESTIMATING ? STATUSES.PENDING : mainStatus;

                return this.setOperationStatusByKey(operation, restoringStatus as STATUSES);
            };

            this.setOperationStatusByKey(operation, STATUSES.ESTIMATING);

            if (!this.operationsIds.has(opId)) {
                console.warn(`Operation ${opId} not found`);
                restoreStatus();
                continue;
            }

            this.processDependencyParams(opId, { isSetParam: true });

            const isSuccessOrFail = [STATUSES.SUCCESS, STATUSES.FAILED].includes(mainStatus as STATUSES);

            if (isSuccessOrFail || !isAmountCorrect(currentOperation.getParamByField('amount'))) {
                restoreStatus();
                continue;
            }

            try {
                if (!currentOperation.estimateOutput) {
                    console.warn(`Operation ${opId} not implemented estimateOutput`);
                    restoreStatus();
                    continue;
                }

                await currentOperation.estimateOutput();
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
        const key = this.operationsIds.get(id) || '';
        if (!key) {
            console.warn(`Operation with id ${id} not found`);
            return;
        }

        this.operationsMap.delete(key);
        this.operationsIds.delete(id);
        this.operationsIndex.delete(key);
    }

    resetOperationsStatus(): void {
        const operations = Array.from(this.operationsMap.keys());

        for (const operation of operations) this.setOperationStatusByKey(operation, STATUSES.PENDING);

        this.resetEstimatedOutputs();
    }

    resetEstimatedOutputs(): void {
        const operations = Array.from(this.operationsMap.keys());

        for (const operation of operations) {
            if (!this.operationsMap.has(operation)) continue;
            if (!this.operationsMap.get(operation)) continue;
            const op = this.operationsMap.get(operation);
            if (!op) continue;

            op.setParamByField('amount', null);
            op.setParamByField('outputAmount', null);
        }
    }

    getOperationIdByKey(key: string): string | null {
        return this.operationsIndex.get(key) || null;
    }

    getOperationsStatusById(id: string): STATUSES | undefined {
        if (!this.operationsIds.has(id)) return;

        const key = this.operationsIds.get(id) || '';

        if (!this.operationsStatusByKey.has(key)) {
            console.warn(`Operation with uniqueId: ${key} not found`);
            return;
        }

        return this.operationsStatusByKey.get(key);
    }

    setOperationStatusById(id: string, status: STATUSES): void {
        if (!this.operationsIds.get(id)) {
            console.warn(`Operation with id ${id} not found`);
            return;
        }
        const operationKey = this.operationsIds.get(id) || '';

        this.operationsStatusByKey.set(operationKey, status);
    }

    setOperationStatusByKey(key: string, status: STATUSES): void {
        if (!this.operationsMap.has(key)) {
            console.warn(`Operation with key ${key} not found`);
            return;
        }

        this.operationsStatusByKey.set(key, status);
    }

    getOperationsStatusByKey(key: string): STATUSES {
        if (!this.operationsMap.has(key)) {
            console.warn(`Operation with key ${key} not found`);
            return STATUSES.PENDING;
        }

        return this.operationsStatusByKey.get(key) || STATUSES.PENDING;
    }
    getOperationAdditionalTooltipById(id: string): any {
        const ALLOW_KEYS = ['amount', 'outputAmount'];

        const tooltips = [];

        const operation = this.getOperationById(id);

        if (!operation || !operation.getAdditionalTooltip) return null;

        if (!this.getDependenciesById(id)) return null;

        const { operationId, operationParams = [] } = this.getDependenciesById(id) || {};

        if (!operationId || !operationParams.length) return null;

        const dependOperation = this.getOperationById(operationId);
        if (!dependOperation) {
            console.warn(`Depend operation ${operationId} not found`);
            return null;
        }

        if (!operationParams.length) return null;

        for (const param of operationParams) {
            const info = {
                amountSrcInfo: undefined as any,
                percentageInfo: undefined as any,
            };

            const { dependencyParamKey, paramKey, usePercentage = 0 } = param || {};

            if (!ALLOW_KEYS.includes(dependencyParamKey) || !ALLOW_KEYS.includes(paramKey)) continue;

            if (!usePercentage) continue;

            const dependUniqueKey = this.operationsIds.get(operationId) || '';

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [m2, depOpIndex] = dependUniqueKey.split('_');

            if (!dependUniqueKey) continue;

            const { from: depFrom, to: depTo } = dependOperation.getTokens();
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

    getPercentageOfSuccessOperations(excludeOpTypes: TX_TYPES[] = [TRANSACTION_TYPES.APPROVE]): number {
        const STATUS_TO_EXCLUDE = [STATUSES.PENDING, STATUSES.ESTIMATING, STATUSES.IN_PROGRESS];
        const STATUS_TO_HALF_SUCCESS = [STATUSES.REJECTED, STATUSES.FAILED];

        const successScore = this.operationOrder.reduce((score, operation) => {
            const status = this.operationsStatusByKey.get(operation) || STATUSES.PENDING;

            const type = this.getOperationByKey(operation).transactionType;

            if (excludeOpTypes.includes(type as TX_TYPES)) return score;
            if (STATUS_TO_HALF_SUCCESS.includes(status)) return score + 0.5;
            if (STATUS_TO_EXCLUDE.includes(status)) return score;

            return score + 1;
        }, 0);

        return Number(BigNumber(successScore).dividedBy(this.operationOrder.length).multipliedBy(100).toFixed(2));
    }

    getOperationsResult() {
        const result: IOperationsResult[] = [];

        for (const op of this.operationOrder) {
            if (this.getOperationsStatusByKey(op) === STATUSES.SKIPPED) continue;

            const tokens: IOperationsResultToken = {
                from: {
                    symbol: '',
                    logo: '',
                    amount: '',
                },
                to: {
                    symbol: '',
                    logo: '',
                    amount: '',
                },
            };

            // By default, the type is the same as the operation type
            let type = this.getOperationByKey(op).transactionType as TX_TYPES;

            const from = this.getOperationByKey(op).getToken('from');
            const to = this.getOperationByKey(op).getToken('to');

            if (from)
                tokens.from = {
                    symbol: from.symbol || '',
                    logo: from.logo || '',
                    amount: this.getOperationByKey(op).getParamByField('amount'),
                };

            if (to)
                tokens.to = {
                    symbol: to.symbol || '',
                    logo: to.logo || '',
                    amount: this.getOperationByKey(op).getParamByField('outputAmount'),
                };

            // If the operation is a multiple execution, we need to change the type to mint
            switch (this.getOperationByKey(op).transactionType) {
                case TRANSACTION_TYPES.EXECUTE_MULTIPLE:
                    type = TRANSACTION_TYPES.MINT;
                    !tokens.from && (tokens.from = { symbol: 'NFT', logo: '', amount: '' });
                    tokens.from.amount = isNaN(Number(tokens.from.amount))
                        ? this.getOperationByKey(op).getParamByField('outputAmount')
                        : tokens.from.amount;

                    tokens.to = {
                        symbol: 'NFT',
                        logo: tokens.from.logo,
                        amount: this.getOperationByKey(op).getParamByField('count'),
                    };
                    break;
                case TRANSACTION_TYPES.DEX:
                    type = TRANSACTION_TYPES.SWAP;
                    break;
            }

            result.push({
                type,
                name: this.getOperationByKey(op).getName(),
                status: this.getOperationsStatusByKey(op) as keyof typeof STATUSES,
                ecosystem: this.getOperationByKey(op).getEcosystem(),
                chainId: this.getOperationByKey(op).getChainId(),
                hash: this.getOperationByKey(op).getParamByField('txHash'),
                tokens,
            });
        }

        return result;
    }

    getOperationsCount(excludeOpTypes: TX_TYPES[] = [TRANSACTION_TYPES.APPROVE]): number {
        let count = 0;
        const ops = Array.from(this.operationsMap.keys());

        for (const op of ops) {
            if (!this.operationsMap.has(op)) continue;
            const operation = this.operationsMap.get(op);

            if (!operation) continue;

            const type = operation.transactionType;

            if (excludeOpTypes.includes(type as TX_TYPES)) continue;

            count += 1;
        }

        return count;
    }
}
