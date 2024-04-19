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
    });
});

describe('Osmojs', () => {
    test('Case #1. Cosmos should have staking module', () => {
        expect(cosmos.staking).toBeDefined();
    });

    test('Case #2. Staking module should have delegate message', () => {
        const { delegate } = cosmos.staking.v1beta1.MessageComposer.withTypeUrl;

        expect(delegate).toBeDefined();
    });
});