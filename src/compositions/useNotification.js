import { h, ref } from 'vue';

import { notification, Progress } from 'ant-design-vue';

import { LoadingOutlined, DoubleRightOutlined } from '@ant-design/icons-vue';
import ExternalLinkIcon from '@/assets/icons/module-icons/external-link.svg';

export default function useNotification() {
    const openExplorer = (explorer, key) => {
        window.open(explorer, '_blank');
        return closeNotification(key);
    };

    const showNotification = ({
        key,
        type = 'info',
        title = 'notification',
        description = null,
        duration = 3,
        prepare = false,
        progress = false,
        ...args
    } = {}) => {
        const { explorerLink, txHash, wait } = args;

        const notificationParams = {
            class: `custom-notification ${type} ${key}`,
            key,
            type,
            message: title,
            description,
            placement: 'bottomRight',
            duration,
            ...args,
        };

        const btnComponents = [];

        if (explorerLink) {
            btnComponents.push(() =>
                h(ExternalLinkIcon, { class: 'notification-explorer', onClick: () => openExplorer(explorerLink, key) }));
        }

        if (progress) {
            const progressPercent = ref(100);

            const progressStartTime = Date.now();

            btnComponents.push(() => h(Progress, { class: 'notification-progress-line', percent: progressPercent.value, size: 'small', showInfo: false, strokeColor: type === 'error' ? '#E4455D' : '#14EC8A' }));

            const updateProgressLine = () => {
                const elapsedTime = Date.now() - progressStartTime;

                const remainingTime = ((duration - 0.5) * 1000) - elapsedTime;

                const calculatedProgress = (remainingTime / ((duration - 0.5) * 1000)) * 100;

                progressPercent.value = Math.round(Math.max(calculatedProgress, 0));

                if (remainingTime <= 0) {
                    clearInterval(progressInterval);
                }
            };

            const progressInterval = setInterval(updateProgressLine, 100);
        }

        if (btnComponents.length > 0) {
            notificationParams.btn = () => btnComponents.map(component => component());
        }

        if (txHash && wait) {
            notificationParams.icon = () =>
                h(LoadingOutlined, {
                    spin: true,
                    'data-qa': `waiting-${txHash}-tx`,
                });
        }

        if (prepare) {
            notificationParams.icon = () =>
                h(LoadingOutlined, {
                    spin: true,
                    'data-qa': 'prepare-tx',
                });
        } else if (key?.startsWith('switch')) {
            notificationParams.icon = () =>
                h(DoubleRightOutlined, {
                    style: {
                        animation: 'arrowMovement 1.2s linear infinite',
                    },
                    'data-qa': 'switch-network',
                });
        }

        notification[type](notificationParams);
    };

    const closeNotification = (key) => {
        notification.close(key);
    };

    const destroyAllNotifications = () => {
        notification.destroy();
    };

    return {
        showNotification,
        closeNotification,
        destroyAllNotifications,
    };
}
