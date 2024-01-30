import EmptyList from '@/components/ui/EmptyList';

export default {
    title: 'Components/UI/EmptyList',
    component: EmptyList,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The EmptyList component lets you display a message to the user if an element cannot be displayed and states the reason why.',
            },
        },
    },
};

const Template = (args) => ({
    components: { EmptyList },
    setup() {
        return { args };
    },
    template: '<EmptyList v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
    title: 'Empty list',
};
