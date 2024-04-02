import { describe, expect, test, vi, afterEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';

import WalletInfoLarge from '@/components/app/WalletInfoLarge';
import EyeOpenIcon from '@/assets/icons/dashboard/eyeOpen.svg';
import EyeCloseIcon from '@/assets/icons/dashboard/eye.svg';

const SHOW_BALANCE_KEY = 'user-settings:show-balances';

const getShowBalance = () => JSON.parse(window.localStorage.getItem(SHOW_BALANCE_KEY));
const setShowBalance = (showBalance) => localStorage.setItem(SHOW_BALANCE_KEY, JSON.stringify(showBalance));

const cutAddressMock = vi.fn(() => { });

const storeMock = {
    getters: {
        'tokens/loader': false,
        'app/showBalance': true,
        'tokens/targetAccount': '0x',
        'tokens/getTotalBalanceByType': vi.fn(() => 100),
    },
    dispatch: vi.fn(),
};

const useAdapterMock = () => ({
    walletAccount: '0x',
    currentChainInfo: { ecosystem: 'EVM' },
    action: vi.fn(),
});

describe('Show/hide balances', () => {
    const wrapper = shallowMount(WalletInfoLarge, {
        global: {
            provide: {
                store: storeMock,
                useAdapter: useAdapterMock,
                cutAddress: cutAddressMock,
            },
            mocks: {
                $t: (tKey) => tKey
            },
        }
    });

    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    afterEach(() => {
        getItemSpy.mockClear();
        setItemSpy.mockClear();
        localStorage.clear();
    });

    test('Case #1. Check show/hide balance icon', () => {
        const showBalance = true;
        setShowBalance(showBalance);

        expect(wrapper.findComponent(EyeOpenIcon).exists()).toBe(true);
        expect(wrapper.findComponent(EyeCloseIcon).exists()).toBe(false);
        expect(wrapper.find('.balance').exists()).toBe(true);
    });

    test('Case #2. Get showBalance from LocalStorage', () => {
        const showBalance = true;

        setShowBalance(showBalance);
        expect(getShowBalance()).toStrictEqual(showBalance);
        expect(getItemSpy).toHaveBeenCalledWith(SHOW_BALANCE_KEY);
    });
})
