<template>
    <div
        class="overlay-container"
        :class="{
            active: isActive,
        }"
    >
        <div
            class="overlay-content"
            :class="{
                error: shortcutStatus === STATUSES.FAILED,
                success: shortcutStatus === STATUSES.SUCCESS,
            }"
        >
            <OverlayIcon class="overlay-icon" />

            <div class="wallet-icon-container">
                <ModuleIcon
                    v-if="connectedWallet"
                    class="wallet-icon"
                    :module="connectedWallet.walletModule"
                    :ecosystem="connectedWallet.ecosystem"
                />
                <div class="status-icon-container">
                    <component :is="moduleStatusIcon" />
                </div>
            </div>
        </div>

        <div class="overlay-bottom">
            <div class="overlay-status-info">
                <div
                    class="status-progress"
                    :class="{
                        [operationProgressStatus]: operationProgressStatus,
                    }"
                >
                    <a-progress :percent="operationProgress" size="small" :status="operationProgressStatus" />
                </div>

                <div class="status-title">{{ statusTitle }} {{ shortcutIndex + 1 }} / {{ operationsCount }}</div>

                <div class="status-description">{{ statusDescription }}</div>
            </div>
            <UiButton
                class="overlay-btn"
                :class="{ active: isShowTryAgain }"
                :loading="shortcutStatus === STATUSES.IN_PROGRESS"
                title="Try Again"
                @click="handleOnTryAgain"
            />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, h, computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import useAdapter from '#/core/wallet-adapter/compositions/useAdapter';
import useNotification from '@/compositions/useNotification';

import { LoadingOutlined } from '@ant-design/icons-vue';

import UiButton from '@/components/ui/Button.vue';

import ModuleIcon from '@/core/wallet-adapter/UI/Entities/ModuleIcon.vue';

import OverlayIcon from '@/assets/icons/platform-icons/overlay-loading.svg';
import SuccessIcon from '@/assets/icons/form-icons/check-circle.svg';
import FailedIcon from '@/assets/icons/form-icons/clear.svg';
import ProcessIcon from '@/assets/icons/form-icons/process.svg';
import WaitingIcon from '@/assets/icons/form-icons/waiting.svg';

import { ModuleType } from '@/shared/models/enums/modules.enum';
import { STATUS_TYPE, STATUSES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import OperationFactory from '@/core/operations/OperationsFactory';
import useShortcutOperations from '../../../core/shortcuts/compositions/useShortcutOperations';

export default defineComponent({
    name: 'ShortcutLoading',
    components: {
        OverlayIcon,
        UiButton,
        ModuleIcon,
    },

    props: {
        shortcutId: {
            type: String,
            required: true,
        },
    },

    setup(props) {
        if (props.shortcutId === 'undefined') return;

        const { connectedWallet } = useAdapter();

        const store = useStore();

        const { handleOnTryAgain, operationStatus, operationsCount, operationProgress, operationProgressStatus } = useShortcutOperations(
            props.shortcutId,
        );

        const shortcutStatus = computed<STATUS_TYPE>(() => store.getters['shortcuts/getShortcutStatus'](props.shortcutId));

        const isActive = computed<boolean>(() => {
            return [STATUSES.IN_PROGRESS, STATUSES.SUCCESS, STATUSES.FAILED].includes(shortcutStatus.value as any);
        });

        const isShowTryAgain = computed(() => {
            const status = STATUSES[shortcutStatus.value];
            return [STATUSES.FAILED, STATUSES.SUCCESS].includes(status);
        });

        const shortcutIndex = computed(() => store.getters['shortcuts/getShortcutIndex']);

        const updateProgress = () => {
            if (!store.getters['shortcuts/getShortcutOpsFactory'](props.shortcutId)) return 0;
            if (typeof store.getters['shortcuts/getShortcutOpsFactory'](props.shortcutId)?.getPercentageOfSuccessOperations !== 'function')
                return 0;

            return store.getters['shortcuts/getShortcutOpsFactory'](props.shortcutId)?.getPercentageOfSuccessOperations() || 0;
        };

        const moduleStatusIcon = computed(() => {
            switch (operationStatus.value) {
                case STATUSES.IN_PROGRESS:
                    return h(LoadingOutlined, { spin: true });

                case STATUSES.PENDING:
                    return h(ProcessIcon);

                case STATUSES.REJECTED:
                case STATUSES.FAILED:
                    return h(FailedIcon);

                case STATUSES.SUCCESS:
                    return h(SuccessIcon);

                default:
                    return h(WaitingIcon);
            }
        });

        const statusTitle = computed(() => {
            switch (operationStatus.value) {
                case STATUSES.IN_PROGRESS:
                    return 'Transaction in progress';

                case STATUSES.PENDING:
                    return 'Transaction pending';

                case STATUSES.FAILED:
                    return 'Transaction failed';

                case STATUSES.REJECTED:
                    return 'Transaction rejected';

                case STATUSES.SUCCESS:
                    return 'Transaction success';

                default:
                    return 'Transaction waiting';
            }
        });

        const statusDescription = computed(() => {
            switch (operationStatus.value) {
                case STATUSES.IN_PROGRESS:
                    return 'Transaction preparing, please check your wallet for confirmation';

                case STATUSES.PENDING:
                    return 'Transaction pending, please check your wallet for confirmation';

                case STATUSES.REJECTED:
                    return 'Transaction has been rejected';

                case STATUSES.FAILED:
                    return 'Transaction has been failed';

                case STATUSES.SUCCESS:
                    return 'Transaction has been successfully completed';

                default:
                    return 'Transaction waiting for confirmation';
            }
        });

        onMounted(() => {
            operationProgress.value = 0;
            operationProgress.value = updateProgress();
        });

        onUnmounted(() => {
            operationProgress.value = 0;
        });

        return {
            STATUSES,

            isActive,
            isShowTryAgain,

            shortcutStatus,

            shortcutIndex,
            connectedWallet,
            handleOnTryAgain,
            moduleStatusIcon,

            statusTitle,
            statusDescription,

            operationStatus,
            operationProgressStatus,
            operationProgress,
            operationsCount,
        };
    },
});
</script>
<style lang="scss">
.overlay-container {
    width: 100%;

    min-height: 500px;

    background: var(--#{$prefix}main-background);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    position: absolute;

    top: 0;
    right: 0;
    bottom: 0;

    z-index: -1;

    &.active {
        display: flex;

        z-index: 15;
    }

    .overlay-bottom {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding: 20px 0;
        & > div:not(:last-child) {
            margin-bottom: 10px;
        }

        .overlay-btn {
            width: 100%;
            max-width: 200px;

            &:not(.active) {
                opacity: 0;
                user-select: none;
                visibility: hidden;
            }

            &.active {
                opacity: 1;
            }
        }
    }

    .overlay-content {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }

    .overlay-content.error,
    .overlay-content.success {
        .overlay-icon {
            animation-play-state: paused;
        }
    }
    .overlay-content.error {
        .overlay-icon {
            g {
                stroke: var(--#{$prefix}danger);
            }
        }
    }

    .overlay-content.success {
        .overlay-icon {
            g {
                stroke: var(--#{$prefix}success);
            }
        }
    }

    .overlay-icon {
        width: 60%;
        max-width: 260px;
        animation: spin 10s linear infinite;
    }

    .wallet-icon-container {
        width: 140px;
        height: 140px;

        background: var(--#{$prefix}secondary-background);
        border: 0.5px solid var(--#{$prefix}icon-placeholder);

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

        .wallet-icon {
            width: 100% !important;
            height: 100% !important;
            background: transparent !important;
        }

        .status-icon-container {
            position: absolute;
            right: 10px;
            bottom: 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            background-color: var(--#{$prefix}select-bg-color);
            width: 30px;
            height: 30px;
            max-width: 30px;
            max-height: 30px;

            border-radius: 50%;
            svg {
                width: 20px;
                height: 20px;
            }
        }
    }

    .overlay-status-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        & > div:not(:last-child) {
            margin-bottom: 10px;
        }

        text-align: center;

        line-height: 1.5;
        .status-title {
            font-size: var(--#{$prefix}default-fs);
            font-weight: 600;
            color: var(--#{$prefix}primary-text);
        }

        .status-description {
            font-size: var(--#{$prefix}small-lg-fs);
            color: var(--#{$prefix}primary-text);
        }

        .status-progress {
            width: 100%;
            min-width: 200px;
            max-width: 200px;

            &:not(.success, .exception) {
                .ant-progress-text {
                    color: var(--#{$prefix}primary-text);
                }
            }

            .ant-progress-inner {
                background: var(--#{$prefix}icon-placeholder);
            }
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
@/shared/models/enums/tx-types
