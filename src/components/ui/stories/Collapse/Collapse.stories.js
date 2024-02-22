import Collapse from '@/components/ui/Collapse';

export default {
    title: 'Components/UI/Collapse',
    component: Collapse,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The Collapse component allows you to reveal or hide child components that are stacked vertically.',
            },
        },
    },
};

const Template = (args) => ({
    components: { Collapse },
    setup() {
        return { args };
    },
    template: `
    <Collapse v-bind="args">
      <template v-slot:header>
        Header Content
      </template>
      <template v-slot:content>
        Content
      </template>
    </Collapse>
  `,
});

export const Default = Template.bind({});
Default.args = {
    loading: false,
    hideContent: false,
};
