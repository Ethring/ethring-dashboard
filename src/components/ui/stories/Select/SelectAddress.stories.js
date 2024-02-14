import SelectAddress from '@/components/ui/Select/SelectAddressInput';

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
    onReset: false,
};
