import ServiceIcon from '@/components/ui/EstimatePanel/ServiceIcon';

export default {
    title: 'Components/UI/ServiceIcon',
    component: ServiceIcon,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The ServiceIcon component is used for displaying services within the Swap, Bridge, and Superswap modules',
            },
        },
    },
};

const Template = (args) => ({
    components: { ServiceIcon },
    setup() {
        return { args };
    },
    template: `<ServiceIcon v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
    name: 'Debridge',
    icon: 'https://app.debridge.finance/assets/images/bridge.svg',
};

export const WithLabel = Template.bind({});
WithLabel.args = {
    name: 'Debridge',
    icon: 'https://app.debridge.finance/assets/images/bridge.svg',
    showTitle: true,
};
