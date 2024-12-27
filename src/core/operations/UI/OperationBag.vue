<template>
    <a-drawer v-model:open="isOpen" root-class-name="operation-bag" :title="operationBagTitle" placement="right">
        <template #extra>
            <div class="operation-bag__actions">
                <a-segmented v-model:value="activeRadio" :options="radioOptions">
                    <template #label="{ payload }">
                        <a-tooltip placement="bottom">
                            <template #title>
                                {{ payload.title }}
                            </template>
                            <component :is="payload.icon"></component>
                        </a-tooltip>
                    </template>
                </a-segmented>
            </div>
        </template>
        <p>{{ operationBagTitle }} operations</p>
    </a-drawer>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons-vue';

export default {
    name: 'OperationBag',
    components: {
        ArrowDownOutlined,
        ArrowUpOutlined,
    },
    setup() {
        const TITLES = {
            deposit: 'Deposit',
            withdraw: 'Withdraw',
        };

        const store = useStore();

        const activeRadio = ref('deposit');
        const operationBagTitle = computed(() => TITLES[activeRadio.value]);

        const radioOptions = [
            {
                value: 'deposit',
                payload: {
                    title: 'Deposit',
                    icon: 'ArrowUpOutlined',
                },
            },
            {
                value: 'withdraw',
                payload: {
                    title: 'Withdraw',
                    icon: 'ArrowDownOutlined',
                },
            },
        ];

        const isOpen = computed({
            get: () => store.getters['operationBag/isOpen'],
            set: (value) => store.dispatch('operationBag/setIsOpen', value),
        });

        return {
            isOpen,
            activeRadio,
            radioOptions,
            operationBagTitle,
        };
    },
};
</script>
