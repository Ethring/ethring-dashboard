<template>
    <button :class="{ secondary, xl, disabled }" class="button" :disabled="disabled || loading">
        <loadingIcon v-if="loading" class="rotating" />
        <div v-else>{{ title }}</div>
    </button>
</template>
<script>
import loadingIcon from '@/assets/icons/dashboard/load-btn.svg';

export default {
    name: 'Button',
    components: {
        loadingIcon,
    },
    props: {
        xl: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        secondary: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            default: '',
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
};
</script>
<style lang="scss" scoped>
.button {
    min-width: 80px;
    height: 40px;
    border-radius: 8px;
    padding: 0 10px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    outline: none;
    background: $colorBlack;
    color: $colorWhite;
    font-family: 'Poppins_SemiBold';
    font-size: 14px;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;

    &.xl {
        font-size: 20px;
        height: 64px;
        font-family: 'Poppins_SemiBold';
    }

    @include animateEasy;

    &:hover {
        background: $colorBrightGreen;
        color: $colorBlack;
    }

    &.disabled {
        background: $colorLightGreen;

        color: #73b1b1;
    }

    &.secondary {
        background: transparent;
        border: 1px solid #1c1f2c;
        color: #1c1f2c;

        &:hover {
            color: #0d7e71;
            border: 1px solid #0d7e71;
        }

        &.disabled {
            color: #73b1b1;
            border: 1px solid #73b1b1;

            &:hover {
                color: #73b1b1;
                border: 1px solid #73b1b1;
                cursor: initial;
            }
        }
    }
}

body.dark {
    .button {
        background: $colorBrightGreen;
        color: $colorBlack;

        &.disabled {
            background: #1c1f2c;
            color: #486060;

            &:hover {
                color: #486060;
                background: #1c1f2c;
                cursor: initial;
            }
        }

        &:hover {
            background: #486060;
            color: $colorWhite;
        }

        &.secondary {
            background: transparent;
            border: 1px solid $colorBrightGreen;
            color: $colorBrightGreen;

            &:hover {
                color: $colorWhite;
                border: 1px solid $colorWhite;
            }

            &.disabled {
                background: transparent;
                color: #486060;
                border: 1px solid #486060;

                &:hover {
                    color: #486060;
                    border: 1px solid #486060;
                    cursor: initial;
                }
            }
        }
    }
}

@keyframes rotating {
    from {
        -ms-transform: rotate(0deg);
        -moz-transform: rotate(0deg);
        -webkit-transform: rotate(0deg);
        -o-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    to {
        -ms-transform: rotate(360deg);
        -moz-transform: rotate(360deg);
        -webkit-transform: rotate(360deg);
        -o-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}
.rotating {
    -webkit-animation: rotating 2s linear infinite;
    -moz-animation: rotating 2s linear infinite;
    -ms-animation: rotating 2s linear infinite;
    -o-animation: rotating 2s linear infinite;
    animation: rotating 2s linear infinite;
}
</style>
