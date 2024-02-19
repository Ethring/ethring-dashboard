import SelectOption from '@/components/ui/Select/SelectOption';

export default {
    title: 'Components/UI/SelectOption',
    component: SelectOption,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The SelectOption component is used for collecting user provided information from a list of options',
            },
        },
    },
};

const Template = (args) => ({
    components: { SelectOption },
    setup() {
        return { args };
    },
    template: '<SelectOption v-bind="args" />',
});

const token = {
    "balance": "3.544955163868191",
    "balanceUsd": "2.815438281",
    "net": "polygon",
    "name": "MATIC Native Token",
    "symbol": "MATIC",
    "logo": "https://cryptologos.cc/logos/polygon-matic-logo.png?v=025",
    "chainLogo": "https://cryptologos.cc/logos/polygon-matic-logo.png?v=025",
    "chain": "polygon",
};

export const Default = Template.bind({});
Default.args = {
    label: 'Token',
    record: token,
};

export const SelectNetwork = Template.bind({});
SelectNetwork.args = {
    type: 'network',
    label: 'Network',
    record: token,
};

