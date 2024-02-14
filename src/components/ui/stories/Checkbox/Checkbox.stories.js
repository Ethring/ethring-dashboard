import Checkbox from '@/components/ui/Checkbox';

export default {
    title: 'Components/UI/Checkbox',
    component: Checkbox,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The Checkbox component lets you check or uncheck specific option.',
            },
        },
    },
};

const Template = (args) => ({
    components: { Checkbox },
    setup() {
        return { args };
    },
    template: `<Checkbox v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
    label: 'Checkbox Label',
    id: 'checkbox',
    value: false,
    disabled: false,
};

export const Checked = Template.bind({});
Checked.args = {
    label: 'Checkbox Label',
    id: 'checkbox',
    value: true,
    disabled: false,
};

export const Disabled = Template.bind({});
Disabled.args = {
    label: 'Checkbox Label',
    id: 'checkbox',
    value: false,
    disabled: true,
};
