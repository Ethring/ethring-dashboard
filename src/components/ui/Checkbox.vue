<template>
    <div class="checkbox" @click.stop="stop">
        <input :id="id" type="checkbox" :value="value" :checked="value" :disabled="disabled" @change="changeHandler" />
        <label :for="id">
            <span class="checkbox__checkmark">
                <checkmark v-if="value" />
            </span>
            <span class="checkbox__label" v-html="label" />
        </label>
    </div>
</template>

<script>
import checkmark from '@/assets/icons/app/checkmark.svg';

export default {
    name: 'Checkbox',
    components: {
        checkmark,
    },
    props: {
        label: {
            type: String,
            required: false,
        },
        id: {
            type: String,
            default: 'checkbox',
        },
        value: {
            type: Boolean,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:value', 'change'],
    setup(props, { emit }) {
        const changeHandler = () => {
            emit('update:value', !props.value);
            emit('change', !props.value);
        };
        const stop = () => {
            return;
        };
        return { changeHandler, stop };
    },
};
</script>

<style lang="scss" scoped>
input[type='checkbox'] {
    display: none;

    & + label {
        display: inline-flex;
        align-items: center;
        font-size: 18px;
        font-family: 'Poppins_Regular';
        line-height: 19px;
        color: #73b1b1;
        cursor: pointer;
    }

    &:checked + label {
        .checkbox {
            &__checkmark {
                transition: all 0.3s ease-in-out;
                background: #3fdfae;
                border: 1px solid #97ffd0;
            }

            &__label {
                color: $colorDarkPanel;
            }
        }
    }

    &:disabled {
        & + label {
            cursor: not-allowed;

            .checkbox {
                &__checkmark {
                    background: transparent;
                    border: 1px solid $colorDarkPanel;
                }

                &__label {
                    color: $colorDarkPanel;
                }
            }
        }
    }
}

.checkbox {
    display: inline-flex;
    align-items: center;
    cursor: pointer;

    &__checkmark {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: $colorLightGreen;
        border-radius: 4px;
        margin-right: 14px;
        transition: all 0.2s;
    }

    &__label {
        display: flex;
        font-size: 1rem !important;
        width: fit-content;
        margin-right: 5px;
    }
}
</style>
