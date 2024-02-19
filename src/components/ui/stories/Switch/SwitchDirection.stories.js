import SwitchDirection from '@/components/ui/SwitchDirection';

export default {
    title: 'Components/UI/Switch',
    component: SwitchDirection,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'SwitchDirection component is best used for changing the state of system functionalities and preferences',
            },
        },
    },
};

const Template = (args) => ({
    components: { SwitchDirection },
    setup() {
        return { args };
    },
    template: '<SwitchDirection v-bind="args" />',
});

export const Default = Template.bind({});

export const Disabled = Template.bind({});
Disabled.args = {
    disabled: true,
};

export const WithCustomIcon = Template.bind({});
WithCustomIcon.args = {
    icon: 'SwapIcon',
};
