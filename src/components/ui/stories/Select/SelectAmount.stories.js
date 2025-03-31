import SelectAmount from '@/components/ui/Select/SelectAmountInput';

export default {
    title: 'Components/UI/SelectAmount',
    component: SelectAmount,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The SelectAmount component is used to provide input value',
            },
        },
    },
};

const Template = (args) => ({
    components: { SelectAmount },
    setup() {
        return { args };
    },
    template: '<SelectAmount v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
    onReset: false,
    label: 'Amount',
};

export const AmountLoading = Template.bind({});
AmountLoading.args = {
    onReset: false,
    isAmountLoading: true,
    label: 'Amount',
};

export const TokenLoading = Template.bind({});
TokenLoading.args = {
    onReset: false,
    isTokenLoading: true,
    label: 'Amount',
};

export const BalanceError = Template.bind({});
BalanceError.args = {
    onReset: false,
    error: true,
    label: 'Amount',
};
