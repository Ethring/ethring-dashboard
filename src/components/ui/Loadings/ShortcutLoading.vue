<template>
    <div
        class="overlay-container"
        :class="{
            active: [STATUSES.IN_PROGRESS, STATUSES.SUCCESS, STATUSES.FAILED].includes(status) && status !== STATUSES.PENDING,
        }"
    >
        <div class="overlay-content">
            <OverlayIcon
                class="overlay-icon"
                :class="{
                    error: status === STATUSES.FAILED,
                    success: status === STATUSES.SUCCESS,
                }"
            />

            <div class="wallet-icon-container">
                <ModuleIcon v-if="connectedWallet" :module="connectedWallet.walletModule" :ecosystem="connectedWallet.ecosystem" />
            </div>
        </div>

        <div class="overlay-bottom">
            <Button
                v-if="[STATUSES.FAILED, STATUSES.SUCCESS].includes(status)"
                @click="handleOnTryAgain"
                :loading="status === STATUSES.IN_PROGRESS"
                title="Try Again"
            />
        </div>
    </div>
</template>
<script>
import OverlayIcon from '@/assets/icons/platform-icons/overlay-loading.svg';
import { STATUSES } from '../../../shared/models/enums/statuses.enum';

import Button from '@/components/ui/Button.vue';
import useAdapter from '@/Adapter/compositions/useAdapter';
import ModuleIcon from '@/Adapter/UI/Entities/ModuleIcon.vue';
import { useStore } from 'vuex';
import { ModuleType } from '../../../shared/models/enums/modules.enum';

export default {
    name: 'ShortcutLoading',
    components: {
        OverlayIcon,
        Button,
        ModuleIcon,
    },
    props: {
        status: {
            type: [String, null],
            required: true,
            default: STATUSES.PENDING,
        },
        shortcutIndex: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        shortcutId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            STATUSES,
        };
    },

    setup(props) {
        const { connectedWallet } = useAdapter();

        const store = useStore();

        const handleOnTryAgain = () => {
            if (props.shortcutIndex === 0 || props.shortcutIndex === props.total - 1) {
                store.dispatch('shortcuts/setShortcutStatus', {
                    shortcutId: props.shortcutId,
                    status: STATUSES.PENDING,
                });
            }

            if (props.shortcutIndex !== 0) {
                store.dispatch('tokenOps/setCallConfirm', {
                    module: ModuleType.shortcut,
                    value: true,
                });
            }

            if (props.shortcutId && props.shortcutIndex === props.total - 1) {
                store.dispatch('shortcuts/resetShortcut', {
                    shortcutId: props.shortcutId,
                });
            }
        };

        return {
            connectedWallet,
            handleOnTryAgain,
        };
    },
};
</script>
<style lang="scss">
.overlay-container {
    width: 101%;

    min-height: 500px;
    max-width: 520px;

    background: var(--#{$prefix}secondary-background);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    position: absolute;

    top: 0;
    left: -1%;
    right: 0;

    z-index: -1;

    &.active {
        display: flex;

        z-index: 7;
    }

    .overlay-bottom {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 0;
    }

    .overlay-content {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;

        height: 80%;
        width: 80%;
    }

    .overlay-icon {
        width: 100%;
        height: 100%;
        animation: spin 10s linear infinite;

        &.error {
            animation: none;

            g {
                stroke: var(--#{$prefix}danger);
            }
        }

        &.success {
            animation: none;

            g {
                stroke: var(--#{$prefix}success);
            }
        }
    }

    .wallet-icon-container {
        width: 160px;
        height: 160px;

        background: var(--#{$prefix}secondary-background);

        border-radius: 50%;

        position: absolute;

        left: 0;
        right: 0;
        top: 0;
        bottom: 0;

        margin: auto;

        display: flex;
        justify-content: center;
        align-items: center;

        > div {
            width: 100% !important;
            height: 100% !important;

            background: transparent !important;
        }
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
}
</style>
