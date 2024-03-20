<template>
    <div class="step-item">
        <div class="step-item__content">
            <div class="step-item-icon">
                <div class="primary-icon">
                    <component :is="data.operationType" />
                </div>
                <div class="secondary-icon icon"></div>
            </div>
            <div class="step-item__info">
                <div class="label">{{ data.name }}</div>
                <div class="content">
                    <div class="token-info">
                        <div class="icon"></div>
                        <div class="amount">10.00 <span>ETH</span></div>
                    </div>
                    <div class="space-between">to</div>
                    <div class="token-info">
                        <div class="icon"></div>
                        <div class="amount">10.00 <span>ETH</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import swap from '@/assets/icons/operations/swap.svg';
import stake from '@/assets/icons/operations/stake.svg';
import bridge from '@/assets/icons/operations/bridge.svg';

export default {
    name: 'StepItem',
    components: {
        swap,
        bridge,
        stake,
    },
    props: {
        data: {
            default: {},
        },
    },
};
</script>
<style lang="scss">
.step-item {
    @include pageFlexRow;

    background: var(--#{$prefix}select-bg-color);

    height: 56px;
    padding: 8px;

    box-sizing: border-box;
    border-radius: 8px;

    margin-bottom: 10px;

    &--finish {
        background: var(--#{$prefix}banner-secondary-color);
    }

    &--process {
        background: none;
        border: 1px solid var(--#{$prefix}border-color);

        .primary-icon {
            background: var(--#{$prefix}banner-secondary-color) !important;
        }
    }

    &-icon {
        position: relative;

        .primary-icon {
            @include pageFlexRow;
            justify-content: center;
            width: 40px;
            height: 40px;

            border-radius: 50%;
            background: var(--#{$prefix}main-background);

            svg {
                path:not([stroke]) {
                    fill: var(--#{$prefix}primary-text);
                }

                path:not([fill]) {
                    stroke: var(--#{$prefix}primary-text);
                }
            }
        }

        .secondary-icon {
            position: absolute;
            right: -6px;
            bottom: 0;

            background: var(--#{$prefix}token-secondary-icon-color);
        }
    }

    &__info {
        margin-left: 20px;

        .label {
            font-weight: 500;
            font-size: var(--#{$prefix}default-fs);
            color: var(--#{$prefix}base-text);
            line-height: 20px;
        }

        .content {
            @include pageFlexRow;
            height: 24px;

            .token-info {
                @include pageFlexRow;

                .amount {
                    line-height: 20px;
                    font-size: var(--#{$prefix}small-lg-fs);
                    font-weight: 500;
                    color: var(--#{$prefix}primary-text);
                    margin-left: 4px;

                    span {
                        font-weight: 400;
                        color: var(--#{$prefix}currency-text);
                    }
                }
            }

            .icon {
                background: var(--#{$prefix}token-primary-icon-color);
            }

            .space-between {
                font-weight: 400;
                font-size: var(--#{$prefix}small-lg-fs);
                color: var(--#{$prefix}currency-text);

                margin: 0 10px;
            }
        }
    }

    &__content {
        @include pageFlexRow;
    }
}

.icon {
    width: 16px;
    height: 16px;

    border-radius: 50%;
}
</style>