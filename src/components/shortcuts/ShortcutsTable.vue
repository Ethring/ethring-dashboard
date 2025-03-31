<template>
    <a-table
        size="small"
        :columns="columns"
        :data-source="shortcuts"
        class="shortcuts-table"
        :pagination="false"
        :max-width="1200"
        :min-width="400"
        :scroll="{ x: 800 }"
        :custom-row="
            (record) => ({
                onClick: (event) => openShortcut(record),
            })
        "
    >
        <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'logoURI'">
                <ShortcutIcon :shortcut="record" />
            </template>
            <template v-if="column.key === 'networksConfig'">
                <template v-for="network in record.networksConfig.additionalNetworks" :key="network">
                    <a-tooltip :title="network">
                        <a-avatar :src="getNetworkLogo(network)" :size="16" />
                    </a-tooltip>
                </template>
            </template>
            <template v-if="column.key === 'author'">
                <a-row align="middle" :wrap="false">
                    <div class="avatar">
                        <a-tooltip :title="record.author.name">
                            <a-avatar v-if="record.author.avatar" :src="record.author.avatar" :alt="record.author.name" :size="30" />
                            <a-avatar v-else :size="30">
                                <template #icon><UserOutlined /></template>
                            </a-avatar>
                        </a-tooltip>
                    </div>
                </a-row>
            </template>

            <template v-if="column.key === 'minUsdAmount'">
                <template v-if="record.minUsdAmount">
                    <Amount type="usd" :value="record.minUsdAmount" symbol="$" />
                </template>
                <template v-else>
                    <span>any</span>
                </template>
            </template>
        </template>
    </a-table>
</template>
<script>
import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';
import { computed } from 'vue';
import { useStore } from 'vuex';

import { UserOutlined } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';
import ShortcutIcon from './ShortcutIcon.vue';
import { min } from 'lodash';

export default {
    name: 'ShortcutsTable',
    components: {
        UserOutlined,
        ShortcutIcon,
    },
    props: {
        shortcuts: {
            type: Array,
            required: true,
            default: () => [],
        },
        columns: {
            type: Array,
            required: true,
            default: () => [],
        },
    },
    setup(props) {
        const store = useStore();
        const router = useRouter();

        const chainsInfo = computed(() => ({
            evm: store.getters['configs/getConfigsByEcosystems'](Ecosystem.EVM),
            cosmos: store.getters['configs/getConfigsByEcosystems'](Ecosystem.COSMOS),
        }));

        const getNetworkLogo = (network) => {
            const net = network === 'cosmos' ? 'cosmoshub' : network;
            if (chainsInfo.value.evm[net]) return chainsInfo.value.evm[net].logo;
            if (chainsInfo.value.cosmos[net]) return chainsInfo.value.cosmos[net].logo;
        };

        const openShortcut = (record) => {
            if (!record?.isActive) return;

            store.dispatch('shortcutsList/setSelectedShortcut', record);
            router.push('/shortcuts/' + record.id);
        };

        return {
            openShortcut,
            getNetworkLogo,
        };
    },
};
</script>
