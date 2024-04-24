<template>
    <a-button type="link" class="sidebar-logo">
        <a-space>
            <div class="sidebar-item__icon">
                <ZometLogo />
            </div>
            <div v-if="!collapsed" class="title">
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
    components: {
        ZometLogo,
        ZometText,
    },
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
};
</script>
