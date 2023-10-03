<template>
    <div class="checkbox" @click.stop="stop">
        <input :id="id" type="checkbox" :value="value" :checked="value" :disabled="disabled" @change="changeHandler" />
        <label :for="id">
            <span class="checkbox__checkmark">
                <CheckmarkIcon v-if="value" />
            </span>
            <span class="checkbox__label" v-html="label" />
        </label>
    </div>
</template>

<script>
import CheckmarkIcon from '@/assets/icons/app/checkmark.svg';

export default {
    name: 'Checkbox',
    components: {
        CheckmarkIcon,
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

        font-size: var(--#{$prefix}h6-fs);
        font-weight: 400;
        line-height: 19px;
        color: var(--#{$prefix}checkbox-text);
        cursor: pointer;
    }

    &:checked + label {
        .checkbox {
            &__checkmark {
                transition: all 0.3s ease-in-out;
                background: var(--#{$prefix}icon-logo-bg-color);
                border: 1px solid var(--#{$prefix}checkbox-checked);
            }

            &__label {
                color: var(--#{$prefix}primary-text);
            }
        }
    }

    &:disabled {
        & + label {
            cursor: not-allowed;

            .checkbox {
                &__checkmark {
                    background: transparent;
                    border: 1px solid var(--#{$prefix}checkbox-disabled);
                }

                &__label {
                    color: var(--#{$prefix}checkbox-disabled-text);
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
        background: var(--#{$prefix}checkbox-bg-color);
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
