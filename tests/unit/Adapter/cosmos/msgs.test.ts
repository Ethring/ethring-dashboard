import { describe, test, expect } from 'vitest';

import { cosmos } from 'osmojs';

import { MsgTransfer } from 'osmojs/dist/codegen/ibc/applications/transfer/v1/tx';

describe('MsgTransfer', () => {
    test('Case #1. Check for the presence of memo field ', () => {
        const msg: MsgTransfer = {
            sourcePort: 'transfer',
            sourceChannel: 'sourceChannel',
            token: {
                denom: '',
                amount: ''
            },
            sender: 'senderAddress',
            receiver: 'receiverAddress',
            timeoutHeight: {
                revisionHeight: BigInt(0),
                revisionNumber: BigInt(0),
            },
            timeoutTimestamp: BigInt(0),
            memo: 'Test memo'
        };

        expect(msg.memo).toBeDefined();
        expect(typeof msg.memo).toBe('string');
    });
});

describe('Osmojs', () => {
    test('Case #1. Cosmos should have staking module and delegate message', () => {
        const { delegate } = cosmos.staking.v1beta1.MessageComposer.withTypeUrl;

        expect(cosmos).toBeDefined();
        expect(typeof cosmos).toBe('object');

        expect(cosmos.staking).toBeDefined();
        expect(typeof cosmos.staking).toBe('object');

        expect(cosmos.staking.v1beta1).toBeDefined();
        expect(typeof cosmos.staking.v1beta1).toBe('object');

        expect(cosmos.staking.v1beta1).toBeDefined();
        expect(typeof cosmos.staking.v1beta1).toBe('object');

        expect(cosmos.staking.v1beta1.MessageComposer).toBeDefined();
        expect(typeof cosmos.staking.v1beta1.MessageComposer).toBe('object');

        expect(cosmos.staking.v1beta1.MessageComposer.withTypeUrl).toBeDefined();
        expect(typeof cosmos.staking.v1beta1.MessageComposer.withTypeUrl).toBe('object');

        expect(cosmos.staking.v1beta1.MessageComposer.withTypeUrl.delegate).toBeDefined();
        expect(typeof cosmos.staking.v1beta1.MessageComposer.withTypeUrl.delegate).toBe('function');

        expect(delegate).toBeDefined();
    });
});