import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default {
    title: 'Components/UI/Loading Overlay',
    component: LoadingOverlay,
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
    components: { LoadingOverlay },
    setup() {
        return { args };
    },
    template: '<LoadingOverlay v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
    spinning: true,
    tip: 'Connecting',
};
