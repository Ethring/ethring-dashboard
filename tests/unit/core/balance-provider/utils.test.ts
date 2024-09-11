import { describe, test, expect } from 'vitest';
import { checkIfBalanceIsUpdated } from '../../../../src/core/balance-provider/utils';
import { TIME_TO_BLOCK } from '../../../../src/core/balance-provider/models/enums';
import BalancesDB from '../../../../src/services/indexed-db/balances';
import { delay } from '../../../../src/shared/utils/helpers';

const ACCOUNT = '0xd5ed26d93129A8b51ac54b40477327F6511824b6';

const BALANCE = [
    {
        name: 'ETH Native Token',
        symbol: 'ETH',
        address: null,
        decimals: 18,
        logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Ethereum.png',
        price: '2322.49',
        priceChange: '0',
        balanceUsd: '5.86558',
        balance: '0.002528859444857183',
        chain: 'arbitrum',
        chainLogo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg?1680097630',
        id: 'arbitrum:tokens__native:ETH',
        verified: true,
        account: '0xd5ed26d93129A8b51ac54b40477327F6511824b6',
        accountAddress: '0xd5ed26d93129A8b51ac54b40477327F6511824b6',
        dataType: 'tokens',
        uniqueId: '0xd5ed26d93129A8b51ac54b40477327F6511824b6__0xd5ed26d93129A8b51ac54b40477327F6511824b6__arbitrum:tokens__native:ETH',
        provider: 'GoldRush',
    },
    {
        name: 'Tether USD',
        symbol: 'USDT',
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        decimals: 6,
        logo: 'https://logos.covalenthq.com/tokens/42161/0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.png',
        price: '0.9992728',
        priceChange: '0.0010013',
        balanceUsd: '19.835783',
        balance: '19.850218',
        chain: 'arbitrum',
        chainLogo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg?1680097630',
        id: 'arbitrum:tokens__0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9:USDT',
        account: '0xd5ed26d93129A8b51ac54b40477327F6511824b6',
        accountAddress: '0xd5ed26d93129A8b51ac54b40477327F6511824b6',
        dataType: 'tokens',
        uniqueId:
            '0xd5ed26d93129A8b51ac54b40477327F6511824b6__0xd5ed26d93129A8b51ac54b40477327F6511824b6__arbitrum:tokens__0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9:USDT',
        provider: 'GoldRush',
    },
    {
        name: 'Uniswap',
        symbol: 'UNI',
        address: '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0',
        decimals: 18,
        logo: 'https://logos.covalenthq.com/tokens/42161/0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0.png',
        price: '6.7436743',
        priceChange: '-0.0311723',
        balanceUsd: '0.7588249',
        balance: '0.112523951493903864',
        chain: 'arbitrum',
        chainLogo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg?1680097630',
        id: 'arbitrum:tokens__0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0:UNI',
        account: '0xd5ed26d93129A8b51ac54b40477327F6511824b6',
        accountAddress: '0xd5ed26d93129A8b51ac54b40477327F6511824b6',
        dataType: 'tokens',
        uniqueId:
            '0xd5ed26d93129A8b51ac54b40477327F6511824b6__0xd5ed26d93129A8b51ac54b40477327F6511824b6__arbitrum:tokens__0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0:UNI',
        provider: 'GoldRush',
    },
    {
        name: 'Arbitrum',
        symbol: 'ARB',
        address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
        decimals: 18,
        logo: 'https://logos.covalenthq.com/tokens/42161/0x912ce59144191c1204e64559fe8253a0e49e6548.png',
        price: '0.5115461',
        priceChange: '0.0228943',
        balanceUsd: '2.4310198',
        balance: '4.752298738482604514',
        chain: 'arbitrum',
        chainLogo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg?1680097630',
        id: 'arbitrum:tokens__0x912ce59144191c1204e64559fe8253a0e49e6548:ARB',
        account: '0xd5ed26d93129A8b51ac54b40477327F6511824b6',
        accountAddress: '0xd5ed26d93129A8b51ac54b40477327F6511824b6',
        dataType: 'tokens',
        uniqueId:
            '0xd5ed26d93129A8b51ac54b40477327F6511824b6__0xd5ed26d93129A8b51ac54b40477327F6511824b6__arbitrum:tokens__0x912ce59144191c1204e64559fe8253a0e49e6548:ARB',
        provider: 'GoldRush',
    },
];

describe('balance-provider', () => {
    test('checkIfBalanceIsUpdated: must return false, if balance not exists', async () => {
        const chain = 'bsc';
        const provider = 'GoldRush';
        const result = await checkIfBalanceIsUpdated(ACCOUNT, chain, provider);
        expect(result).toBe(false);
    });

    test(`checkIfBalanceIsUpdated: must return true, if balance was updated less than ${TIME_TO_BLOCK / 1000} seconds ago`, async () => {
        await BalancesDB.saveBalancesByTypes(BALANCE, {
            dataType: 'tokens',
            account: ACCOUNT,
            address: ACCOUNT,
            chain: 'arbitrum',
            provider: 'GoldRush',
        });

        const chain = 'arbitrum';

        const provider = 'GoldRush';

        const result = await checkIfBalanceIsUpdated(ACCOUNT, chain, provider);

        expect(result).toBe(true);
    });

    test(`checkIfBalanceIsUpdated: must return false, if balance was updated more than ${TIME_TO_BLOCK / 1000} seconds ago`, async () => {
        await BalancesDB.saveBalancesByTypes(BALANCE, {
            dataType: 'tokens',
            account: ACCOUNT,
            address: ACCOUNT,
            chain: 'arbitrum',
            provider: 'GoldRush',
        });

        const chain = 'arbitrum';

        const provider = 'GoldRush';

        await delay(TIME_TO_BLOCK + 1000);

        const result = await checkIfBalanceIsUpdated(ACCOUNT, chain, provider);

        expect(result).toBe(false);
    });
});
