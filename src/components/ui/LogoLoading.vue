<template>
    <div>
        <a-spin :tip="tipTranslate" size="large" class="logo-loading" :spinning="spinning">
            <template #indicator>
                <Logo class="logo-indicator" />
            </template>

            <slot name="content" />
        </a-spin>
    </div>
</template>
<script>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Logo from '@/assets/icons/sidebar/logo.svg';

export default {
    name: 'LogoLoading',

    components: {
        Logo,
    },

    props: {
        spinning: {
            type: Boolean,
            default: false,
        },
        tip: {
            type: String,
            default: 'loadings.initLoading',
        },
    },

    setup(props) {
        const { t } = useI18n();

        const tipTranslate = computed(() => {
            const [block] = props.tip.split('.') || [];

            if (block === 'loadings') return t(props.tip);

            return props.tip;
        });

        return {
            tipTranslate,
        };
    },
};
</script>
<style lang="scss">
.logo-loading {
    border-radius: 16px;
}
</style>
