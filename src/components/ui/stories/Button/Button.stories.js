import Button from '@/components/ui/Button';

export default {
    title: 'Components/UI/Button',
    component: Button,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The Button component are used to initialize an action. Button labels express what action will occur when the user interacts with it.',
            },
        },
    },
};

const Template = (args) => ({
    components: { Button },
    setup() {
        return { args };
    },
    template: `<Button v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = { title: `BUTTON CONTENT`, type: 'primary', size: 'large' };

export const Disabled = Template.bind({});

Disabled.args = {
    title: `DISABLED BTN CONTENT`,
    disabled: true,
};

export const Loading = Template.bind({});

Loading.args = {
    title: `LOADING BTN CONTENT`,
    loading: true,
};
