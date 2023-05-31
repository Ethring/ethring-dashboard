import { cutAddress, getTxUrl } from '@/helpers/utils';

describe('helpers/utils', () => {
    describe('cutAddress', () => {
        const address = '0x0000000000000000000000000000000000000001';
        const emptyAddress = '';
        const invalidAddress = 12345;
        const shortIostAddress = 'citfgkaidd12';

        it('should return empty address when empty address', () => {
            const extended = cutAddress(emptyAddress);

            expect(extended).toEqual('');
        });

        it('should return empty address when invalid type address', () => {
            const extended = cutAddress(invalidAddress);

            expect(extended).toEqual('');
        });

        it('should return address when address so short', () => {
            const extended = cutAddress(shortIostAddress);

            expect(extended).toEqual(shortIostAddress);
        });

        it('should return address short format', () => {
            const extended = cutAddress(address);

            expect(extended).toEqual('0x00000000***000001');
        });
    });

    describe('getTxUrl', () => {
        const hash = '0xfffffffffffffffffffffffffffffff';
        const emptyHash = '';
        const invalidTypeHash = 100000;

        it('should return empty string when invalid net for hash', () => {
            const extended = getTxUrl('btc', hash);

            expect(extended).toEqual('');
        });

        it('should return empty string when empty hash', () => {
            const extended = getTxUrl('bsc', emptyHash);

            expect(extended).toEqual('');
        });

        it('should return empty string when invalid type hash', () => {
            const extended = getTxUrl('bsc', invalidTypeHash);

            expect(extended).toEqual('');
        });

        it('should return BSC tx link', () => {
            const extended = getTxUrl('bsc', hash);

            expect(extended).toEqual(`https://bscscan.com/tx/${hash}`);
        });

        it('should return ETH tx link', () => {
            const extended = getTxUrl('eth', hash);

            expect(extended).toEqual(`https://etherscan.io/tx/${hash}`);
        });

        it('should return POLYGON tx link', () => {
            const extended = getTxUrl('polygon', hash);

            expect(extended).toEqual(`https://polygonscan.com/tx/${hash}`);
        });

        it('should return OPTIMISM tx link', () => {
            const extended = getTxUrl('optimism', hash);

            expect(extended).toEqual(`https://optimistic.etherscan.io/tx/${hash}`);
        });

        it('should return ARBITRUM tx link', () => {
            const extended = getTxUrl('arbitrum', hash);

            expect(extended).toEqual(`https://arbiscan.io/tx/${hash}`);
        });

        it('should return AVALANCHE tx link', () => {
            const extended = getTxUrl('avalanche', hash);

            expect(extended).toEqual(`https://snowtrace.io/tx/${hash}`);
        });

        it('should return EVMOSETH tx link', () => {
            const extended = getTxUrl('evmoseth', hash);

            expect(extended).toEqual(`https://www.mintscan.io/evmos/txs/${hash}`);
        });
    });
});
