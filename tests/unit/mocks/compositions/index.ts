import { computed } from 'vue';

import chainList from './chain-list.json';
import tokensWithBalance from './tokens-with-balance.json';
import tokensWithoutBalance from './tokens-without-balance.json';
import { Ecosystem, Ecosystems } from '../../../../src/shared/models/enums/ecosystems.enum';

export const chainListMockEvm = chainList.evm;
export const chainListMockCosmos = chainList.cosmos;

export const chainListMock = {
    [Ecosystem.EVM]: chainListMockEvm,
    [Ecosystem.COSMOS]: chainListMockCosmos,
};

export const tokensList = {
    withBalance: tokensWithBalance,
    withoutBalance: tokensWithoutBalance,
};

export const EVM_TEST_ADAPTER = () => ({
    walletAccount: computed(() => 'EVM Test Account'),
    currentChainInfo: computed(() => chainListMockEvm[0]),
    chainList: computed(() => chainListMockEvm),
});

export const EVM_TEST_SECOND_ADAPTER = () => ({
    walletAccount: computed(() => 'EVM Test 2 Account'),
    currentChainInfo: computed(() => chainListMockEvm[0]),
    chainList: computed(() => chainListMockEvm),
});

export const COSMOS_TEST_ADAPTER = () => ({
    walletAccount: computed(() => 'COSMOS Test Account'),
    currentChainInfo: computed(() => chainListMockCosmos[0]),
    chainList: computed(() => chainListMockCosmos),
});

export const MOCKED_ADAPTER = {
    [Ecosystem.EVM]: EVM_TEST_ADAPTER,
    [`${Ecosystem.EVM}-1`]: EVM_TEST_SECOND_ADAPTER,
    [Ecosystem.COSMOS]: COSMOS_TEST_ADAPTER,
};
