<template>
    <div class="select-network" data-qa="select-network">
        <div class="network" :class="{ 'default-network-logo': !name }">
            <TokenIcon :token="current" class="network-logo" />
        </div>

        <div class="label" :class="{ name, placeholder }">
            <template v-if="name">
                {{ name }}
            </template>
            <template v-else>
                {{ placeholder }}
            </template>
        </div>

        <ArrowDownIcon class="arrow" />
    </div>
</template>

<script>
import { computed } from 'vue';

import TokenIcon from '@/components/ui/Tokens/TokenIcon.vue';

import ArrowDownIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

export default {
    name: 'SelectNetwork',
    props: {
        current: {
            type: Object,
            default() {
                return {};
            },
        },
        placeholder: {
            type: String,
        },
    },
    components: {
        TokenIcon,
        ArrowDownIcon,
    },
    setup(props) {
        const name = computed(() => {
            const name = props.current?.name || props.current?.symbol;
            return name;
        });

        return {
            name,
        };
    },
};
</script>
