import { h } from 'vue';
import { STATUSES } from '@/shared/models/enums/statuses.enum';
import { LoadingOutlined } from '@ant-design/icons-vue';
import { Spin } from 'ant-design-vue';

import ClearIcon from '@/assets/icons/form-icons/clear.svg';
import SuccessIcon from '@/assets/icons/form-icons/success.svg';
import WaitingIcon from '@/assets/icons/form-icons/waiting.svg';
import ProcessIcon from '@/assets/icons/form-icons/process.svg';

export enum ShortcutType {
    recipe = 'recipe',
    operation = 'operation',
}

export type ShortcutTypes = keyof typeof ShortcutType;

export enum ShortcutStatus {
    wait = 'wait',
    finish = 'finish',
    process = 'process',
    estimating = 'estimating',
    error = 'error',
}

export const StepStatusIcons = {
    [STATUSES.SUCCESS]: h(SuccessIcon),
    [STATUSES.SKIPPED]: h(SuccessIcon),
    [STATUSES.SIGNING]: h(ProcessIcon),
    [STATUSES.PENDING]: h(WaitingIcon),
    [STATUSES.FAILED]: h(ClearIcon),
    [STATUSES.IN_PROGRESS]: h(LoadingOutlined, {
        spin: true,
        class: 'loading-icon',
    }),
    [STATUSES.ESTIMATING]: h(Spin, {
        spin: true,
        class: 'estimating-icon',
    }),
};

export type ShortcutStatuses = keyof typeof ShortcutStatus;

export const ShortcutFieldOpAssociated = {
    srcNetwork: 'fromNet',
    dstNetwork: 'toNet',
    srcToken: 'fromToken',
    dstToken: 'toToken',
    receiverAddress: 'receiverAddress',
    contractAddress: 'contract',
    memo: 'memo',
} as Record<string, string>;

export const TokenDestinationByField = {
    srcToken: 'from',
    dstToken: 'to',
} as Record<string, 'from' | 'to'>;

export const FieldsValueAssociated = {
    receiverAddress: 'address',
    contractAddress: 'address',
    memo: 'memo',
} as Record<string, string>;
