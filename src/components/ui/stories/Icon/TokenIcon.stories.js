import TokenIcon from '@/components/ui/Tokens/TokenIcon';

export default {
    title: 'Components/UI/TokenIcon',
    component: TokenIcon,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The TokenIcon component is used for displaying token icon within the Swap, Bridge, and Superswap modules',
            },
        },
    },
};

const Template = (args) => ({
    components: { TokenIcon },
    setup() {
        return { args };
    },
    template: `<TokenIcon v-bind="args" />`,
});

const token = {
    symbol: 'USDC',
    logo: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
};

export const Default = Template.bind({});
Default.args = {
    token: token,
};

export const CustomTokenIcon = Template.bind({});
CustomTokenIcon.args = {
    token: token,
    width: 50,
    height: 50,
};
