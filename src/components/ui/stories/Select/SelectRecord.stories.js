import SelectRecord from '@/components/ui/Select/SelectRecord';

export default {
    title: 'Components/UI/SelectRecord',
    component: SelectRecord,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The SelectRecord component is used for collecting user provided information from a list of options',
            },
        },
    },
};

const Template = (args) => ({
    components: { SelectRecord },
    setup() {
        return { args };
    },
    template: '<SelectRecord v-bind="args" />',
});

const network = {
    "net": "optimism",
    "name": "Optimism",
    "chain_id": 10,
    "logo": "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png?v=025",
    "ecosystem": "EVM",
    "id": "EVM:optimism",
    "chain": "optimism",
};

export const Default = Template.bind({});
Default.args = {
    placeholder: 'Network',
};

export const Disabled = Template.bind({});
Disabled.args = {
    current: network,
    disabled: true,
};

export const WithValue = Template.bind({});
WithValue.args = {
    current: network,
};
