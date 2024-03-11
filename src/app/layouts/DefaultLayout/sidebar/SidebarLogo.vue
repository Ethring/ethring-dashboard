<template>
    <a-button type="link" class="sidebar-logo">
        <a-space>
            <div class="sidebar-item__icon">
                <ZometLogo />
            </div>
            <div class="title" v-if="!collapsed">
                <ZometText />
                <a-tag color="#14ec8a" :bordered="false" class="tag"> BETA </a-tag>
            </div>
        </a-space>
    </a-button>
</template>

<script>
import ZometLogo from '@/assets/icons/sidebar/logo.svg';
import ZometText from '@/assets/icons/sidebar/logo-text.svg';

export default {
    name: 'SidebarLogo',
    props: {
        collapsed: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            default: '',
        },
    },
    components: {
        ZometLogo,
        ZometText,
    },
};
</script>
