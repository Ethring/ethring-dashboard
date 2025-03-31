import { within, userEvent, waitFor, expect } from '@storybook/test';

import { store } from '../../../../.storybook/preview';
import { Worker } from '../../../../.storybook/mocks/txManager';
import { SRC_NETWORK, ADD_LP_MOCK } from '../../../../.storybook/mocks/constants';

import ShortcutDetails from '@/pages/shortcuts/ShortcutDetails.vue';

export const AddLiquidityShortcut = {
    render: (args) => ({
        components: { ShortcutDetails },
        setup() {
            // worker for mock api requests
            Worker.start();

            store.dispatch('configs/initConfigs');
            store.dispatch('configs/setConfigLoading', false);

            store.dispatch('tokenOps/setSrcNetwork', SRC_NETWORK);

            store.dispatch('shortcutsList/setSelectedShortcut', ADD_LP_MOCK);

            return { args };
        },
        template: '<ShortcutDetails v-bind="args" />',
    }),
    args: {},
    play: async ({ canvasElement }) => {
        try {
            const canvas = within(canvasElement);

            await waitFor(async () => {
                const amountInput = canvas.getByPlaceholderText('0');

                await userEvent.type(amountInput, '2');
            });

            await waitFor(async () => {
                const confirmBtn = canvas.getAllByTestId('confirm-btn')[2];

                expect(confirmBtn.innerText).toBe('APPROVE');
                confirmBtn.click();
            });

            await waitFor(
                async () => {
                    const tryAgainBtn = canvas.getByText('Try Again');
                    tryAgainBtn.click();

                    const amountInput = canvas.getByPlaceholderText('0');

                    await userEvent.type(amountInput, '2');

                    const confirmBtn = canvas.getAllByTestId('confirm-btn')[2];

                    expect(confirmBtn.innerText).toBe('CONFIRM');
                },
                { timeout: 90000 },
            );
        } catch (error) {
            console.error('Simulated error:', error);
        }
    },
};

export default {
    title: 'Pages/ShortcutDetails',
    component: ShortcutDetails,
};
