import { describe, test, expect } from 'vitest';

// Checking module
import { cosmos, cosmwasm } from 'osmojs';

// Interface to check
import { MsgTransfer } from 'osmojs/dist/codegen/ibc/applications/transfer/v1/tx';
import { Height } from 'osmojs/dist/codegen/ibc/core/client/v1/client';

// Mocking MsgTransfer
class MockMsgTransfer implements MsgTransfer {
    sourcePort: string;
    sourceChannel: string;
    token: {
        denom: string;
        amount: string;
    };
    sender: string;
    receiver: string;
    timeoutHeight: Height;
    timeoutTimestamp: bigint;
    memo: string;

    constructor({
        sourcePort = 'mocked sourcePort',
        sourceChannel = 'mocked sourceChannel',
        token = {
            denom: 'mocked denom',
            amount: 'mocked amount',
        },
        sender = 'mocked sender',
        receiver = 'mocked receiver',
        timeoutHeight = {
            revisionHeight: BigInt(0),
            revisionNumber: BigInt(0),
        },
        timeoutTimestamp = BigInt(0),
        memo = 'mocked memo',
    } = {}) {
        this.sourcePort = sourcePort;
        this.sourceChannel = sourceChannel;
        this.token = token;
        this.sender = sender;
        this.receiver = receiver;
        this.timeoutHeight = timeoutHeight;
        this.timeoutTimestamp = timeoutTimestamp;
        this.memo = memo;
    }
}

describe('osmojs', () => {
    describe('MsgTransfer', () => {
        test('Case #1: MsgTransfer implements with mocked data have "memo" field', () => {
            const msgTransfer = new MockMsgTransfer();

            expect(msgTransfer.sourcePort).toBeDefined();
            expect(typeof msgTransfer.sourcePort).toBe('string');
            expect(msgTransfer.sourcePort).toBe('mocked sourcePort');

            expect(msgTransfer.sourceChannel).toBeDefined();
            expect(typeof msgTransfer.sourceChannel).toBe('string');
            expect(msgTransfer.sourceChannel).toBe('mocked sourceChannel');

            expect(msgTransfer.token).toBeDefined();
            expect(typeof msgTransfer.token).toBe('object');

            expect(msgTransfer.token.denom).toBeDefined();
            expect(typeof msgTransfer.token.denom).toBe('string');
            expect(msgTransfer.token.denom).toBe('mocked denom');

            expect(msgTransfer.token.amount).toBeDefined();
            expect(typeof msgTransfer.token.amount).toBe('string');
            expect(msgTransfer.token.amount).toBe('mocked amount');

            expect(msgTransfer.sender).toBeDefined();
            expect(typeof msgTransfer.sender).toBe('string');
            expect(msgTransfer.sender).toBe('mocked sender');

            expect(msgTransfer.receiver).toBeDefined();
            expect(typeof msgTransfer.receiver).toBe('string');
            expect(msgTransfer.receiver).toBe('mocked receiver');

            expect(msgTransfer.timeoutHeight).toBeDefined();
            expect(typeof msgTransfer.timeoutHeight).toBe('object');
            expect(msgTransfer.timeoutHeight.revisionHeight).toBeDefined();
            expect(typeof msgTransfer.timeoutHeight.revisionHeight).toBe('bigint');
            expect(msgTransfer.timeoutHeight.revisionHeight).toBe(BigInt(0));
            expect(msgTransfer.timeoutHeight.revisionNumber).toBeDefined();
            expect(typeof msgTransfer.timeoutHeight.revisionNumber).toBe('bigint');
            expect(msgTransfer.timeoutHeight.revisionNumber).toBe(BigInt(0));

            expect(msgTransfer.memo).toBeDefined();
            expect(typeof msgTransfer.memo).toBe('string');
            expect(msgTransfer.memo).toBe('mocked memo');
        });

        test('Case #2: MsgTransfer implements with empty data have "memo" field', () => {
            const msgTransfer = new MockMsgTransfer({
                sourcePort: '',
                sourceChannel: '',
                token: {
                    denom: '',
                    amount: '',
                },
                sender: '',
                receiver: '',
                timeoutHeight: {
                    revisionHeight: BigInt(0),
                    revisionNumber: BigInt(0),
                },
                timeoutTimestamp: BigInt(0),
                memo: '',
            });

            expect(msgTransfer.sourcePort).toBeDefined();
            expect(typeof msgTransfer.sourcePort).toBe('string');
            expect(msgTransfer.sourcePort).toBe('');

            expect(msgTransfer.sourceChannel).toBeDefined();
            expect(typeof msgTransfer.sourceChannel).toBe('string');
            expect(msgTransfer.sourceChannel).toBe('');

            expect(msgTransfer.token).toBeDefined();
            expect(typeof msgTransfer.token).toBe('object');

            expect(msgTransfer.token.denom).toBeDefined();
            expect(typeof msgTransfer.token.denom).toBe('string');
            expect(msgTransfer.token.denom).toBe('');

            expect(msgTransfer.token.amount).toBeDefined();
            expect(typeof msgTransfer.token.amount).toBe('string');
            expect(msgTransfer.token.amount).toBe('');

            expect(msgTransfer.sender).toBeDefined();
            expect(typeof msgTransfer.sender).toBe('string');
            expect(msgTransfer.sender).toBe('');

            expect(msgTransfer.receiver).toBeDefined();
            expect(typeof msgTransfer.receiver).toBe('string');
            expect(msgTransfer.receiver).toBe('');

            expect(msgTransfer.timeoutHeight).toBeDefined();
            expect(typeof msgTransfer.timeoutHeight).toBe('object');
            expect(msgTransfer.timeoutHeight.revisionHeight).toBeDefined();
            expect(typeof msgTransfer.timeoutHeight.revisionHeight).toBe('bigint');
            expect(msgTransfer.timeoutHeight.revisionHeight).toBe(BigInt(0));
            expect(msgTransfer.timeoutHeight.revisionNumber).toBeDefined();
            expect(typeof msgTransfer.timeoutHeight.revisionNumber).toBe('bigint');
            expect(msgTransfer.timeoutHeight.revisionNumber).toBe(BigInt(0));

            expect(msgTransfer.memo).toBeDefined();
            expect(typeof msgTransfer.memo).toBe('string');
            expect(msgTransfer.memo).toBe('');
        });
    });

    describe('osmojs staking module', () => {
        test('Case #1: osmojs have "cosmos" module ?', () => {
            expect(cosmos).toBeDefined();
            expect(typeof cosmos).toBe('object');
        });

        test('Case #2: cosmos have "staking" module ?', () => {
            expect(cosmos.staking).toBeDefined();
            expect(typeof cosmos.staking).toBe('object');
        });

        test('Case #3: cosmos -> staking -> have "v1beta1" ?', () => {
            expect(cosmos.staking.v1beta1).toBeDefined();
            expect(typeof cosmos.staking.v1beta1).toBe('object');
        });

        test('Case #4: cosmos -> staking -> v1beta1 have "MessageComposer" ?', () => {
            expect(cosmos.staking.v1beta1.MessageComposer).toBeDefined();
            expect(typeof cosmos.staking.v1beta1.MessageComposer).toBe('object');
        });

        test('Case #5: cosmos -> staking -> v1beta1 -> MessageComposer -> have "withTypeUrl" ?', () => {
            expect(cosmos.staking.v1beta1.MessageComposer.withTypeUrl).toBeDefined();
            expect(typeof cosmos.staking.v1beta1.MessageComposer.withTypeUrl).toBe('object');
        });

        test('Case #6: cosmos -> staking -> v1beta1 -> MessageComposer -> withTypeUrl -> have method "delegate" ?', () => {
            expect(cosmos.staking.v1beta1.MessageComposer.withTypeUrl.delegate).toBeDefined();
            expect(typeof cosmos.staking.v1beta1.MessageComposer.withTypeUrl.delegate).toBe('function');
        });
    });

    describe('osmojs bank module', () => {
        test('Case #1: osmojs have "cosmos" module ?', () => {
            expect(cosmos).toBeDefined();
            expect(typeof cosmos).toBe('object');
        });

        test('Case #2: cosmos have "bank" module ?', () => {
            expect(cosmos.bank).toBeDefined();
            expect(typeof cosmos.bank).toBe('object');
        });

        test('Case #3: cosmos -> bank -> have "v1beta1" ?', () => {
            expect(cosmos.bank.v1beta1).toBeDefined();
            expect(typeof cosmos.bank.v1beta1).toBe('object');
        });

        test('Case #4: cosmos -> bank -> v1beta1 have "MessageComposer" ?', () => {
            expect(cosmos.bank.v1beta1.MessageComposer).toBeDefined();
            expect(typeof cosmos.bank.v1beta1.MessageComposer).toBe('object');
        });

        test('Case #5: cosmos -> bank -> v1beta1 -> MessageComposer -> have "withTypeUrl" ?', () => {
            expect(cosmos.bank.v1beta1.MessageComposer.withTypeUrl).toBeDefined();
            expect(typeof cosmos.bank.v1beta1.MessageComposer.withTypeUrl).toBe('object');
        });

        test('Case #6: cosmos -> bank -> v1beta1 -> MessageComposer -> withTypeUrl -> have "send" delegate ?', () => {
            expect(cosmos.bank.v1beta1.MessageComposer.withTypeUrl.send).toBeDefined();
            expect(typeof cosmos.bank.v1beta1.MessageComposer.withTypeUrl.send).toBe('function');
        });
    });

    describe('osmojs cosmwasm module', () => {
        test('Case #1: osmojs have "cosmwasm" module ?', () => {
            expect(cosmos).toBeDefined();
            expect(typeof cosmos).toBe('object');
        });

        test('Case #2: cosmwasm have "wasm" module ?', () => {
            expect(cosmwasm.wasm).toBeDefined();
            expect(typeof cosmwasm.wasm).toBe('object');
        });

        test('Case #3: cosmwasm -> wasm -> have "v1" ?', () => {
            expect(cosmwasm.wasm.v1).toBeDefined();
            expect(typeof cosmwasm.wasm.v1).toBe('object');
        });

        test('Case #4: cosmwasm -> wasm -> v1 have "MessageComposer" ?', () => {
            expect(cosmwasm.wasm.v1.MessageComposer).toBeDefined();
            expect(typeof cosmwasm.wasm.v1.MessageComposer).toBe('object');
        });

        test('Case #5: cosmwasm -> wasm -> v1 -> MessageComposer -> have "withTypeUrl" ?', () => {
            expect(cosmwasm.wasm.v1.MessageComposer.withTypeUrl).toBeDefined();
            expect(typeof cosmwasm.wasm.v1.MessageComposer.withTypeUrl).toBe('object');
        });

        test('Case #6: cosmwasm -> wasm -> v1 -> MessageComposer -> withTypeUrl -> have "executeContract" delegate ?', () => {
            expect(cosmwasm.wasm.v1.MessageComposer.withTypeUrl.executeContract).toBeDefined();
            expect(typeof cosmwasm.wasm.v1.MessageComposer.withTypeUrl.executeContract).toBe('function');
        });
    });
});
