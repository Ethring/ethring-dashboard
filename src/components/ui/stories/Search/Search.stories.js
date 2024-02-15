import SearchInput from '@/components/ui/SearchInput';

export default {
    title: 'Components/UI/SearchInput',
    component: SearchInput,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The SearchInput component is used to retrieve necessary information quickly from a huge list.',
            },
        },
    },
};

const Template = (args) => ({
    components: { SearchInput },
    setup() {
        return { args };
    },
    template: '<SearchInput v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
    placeholder: 'Select a token',
};

export const WithValue = Template.bind({});
WithValue.args = {
    placeholder: 'Select a token',
    value: 'ATOM',
};
