import Modal from '@/components/app/Modal';

export default {
    title: 'Components/UI/Modal',
    component: Modal,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Modals focus the user’s attention exclusively on one task or piece of information via a window that sits on top of the page content.',
            },
        },
    },
};

const Template = (args) => ({
    components: { Modal },
    setup() {
        return { args };
    },
    template: `<Modal v-bind="args">Modal content</Modal>`,
});

export const Default = Template.bind({});
Default.args = {
    title: 'Modal Title',
    position: 'fixed',
    width: '588px',
    height: '400px',
};
