import DefaultLoading from '@/components/ui/DefaultLoading';

export default {
    title: 'Components/UI/Default Loading',
    component: DefaultLoading,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Loading spinners are used when retrieving data or performing slow computations, and help to notify users that loading is underway',
            },
        },
    },
};

const Template = (args) => ({
    components: { DefaultLoading },
    setup() {
        return { args };
    },
    template: '<DefaultLoading v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
    tip: 'Connecting',
};
