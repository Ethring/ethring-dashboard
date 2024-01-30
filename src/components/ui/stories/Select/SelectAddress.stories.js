import SelectAddress from '@/components/ui/SelectAddress';

export default {
    title: 'Components/UI/SelectAddress',
    component: SelectAddress,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The SelectAddress component is used to enter the correct recipient address',
            },
        },
    },
};

const Template = (args) => ({
    components: { SelectAddress },
    setup() {
        return { args };
    },
    template: '<SelectAddress v-bind="args" />',
});

const selectedNetwork = {
    net: 'polygon',
    name: 'Polygon',
    chain_id: 137,
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
    ecosystem: 'EVM',
};

export const Default = Template.bind({});
Default.args = {
    value: '',
    selectedNetwork: selectedNetwork,
    items: [],
    onReset: false,
    error: false,
};

export const SelectWithValue = Template.bind({});
SelectWithValue.args = {
    value: '0x41f911451233700f10F4F4102940C8B5f5C6D4F8',
    selectedNetwork: selectedNetwork,
    items: [],
    onReset: false,
    error: false,
};

export const SelectWithErrorValue = Template.bind({});
SelectWithErrorValue.args = {
    value: '0x41f911451233700f10F4F4102940C8B5f5C6D4F8r',
    selectedNetwork: selectedNetwork,
    items: [],
    onReset: false,
    error: true,
};
