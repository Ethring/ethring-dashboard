import ServiceIcon from '@/components/ui/ServiceIcon';

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

export const Default = {
    args: {
        name: 'Debridge',
        icon: 'https://app.debridge.finance/assets/images/bridge.svg',
    },
};
