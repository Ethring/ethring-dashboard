<template>
    <div>
        <a-spin :tip="tipTranslate" size="large" class="logo-loading" :spinning="spinning">
            <template #indicator>
                <Logo class="logo-indicator" />
            </template>

            <slot name="content" />
        </a-spin>

        <div class="logo-loading-elements" v-if="overlay">
            <Logo class="square" />
            <Logo class="square" />
            <Logo class="square" />
            <Logo class="square" />
            <Logo class="square" />
            <Logo class="square" />

            <div class="circle"></div>
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="circle"></div>

            <div class="triangle"></div>
            <div class="triangle"></div>
            <div class="triangle"></div>
            <div class="triangle"></div>
            <div class="triangle"></div>
        </div>
    </div>
</template>
<script>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import Logo from '@/assets/icons/sidebar/logo.svg';

import anime from 'animejs/lib/anime.es.js';

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

        overlay: {
            type: Boolean,
            default: false,
        },
    },

    setup(props) {
        const { t } = useI18n();

        const tipTranslate = computed(() => {
            const [block] = props.tip.split('.') || [];

            if (block === 'loadings') {
                return t(props.tip);
            }

            return props.tip;
        });

        function randomValues() {
            anime({
                targets: '.square, .circle, .triangle',
                translateX: function () {
                    return anime.random(-500, 500);
                },
                translateY: function () {
                    return anime.random(-300, 300);
                },
                rotate: function () {
                    return anime.random(0, 360);
                },
                scale: function () {
                    return anime.random(0.2, 2);
                },
                duration: 1000,
                easing: 'easeInOutQuad',
                complete: randomValues,
            });
        }

        onMounted(() => {
            randomValues();
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

.square {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    background: linear-gradient(#303030, #757575);
    z-index: 2;
}

.circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    background: var(--#{$prefix}banner-logo-color);
    border-radius: 50%;
}

.triangle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    background: var(--#{$prefix}banner-secondary-color);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    -webkit-clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}
</style>
