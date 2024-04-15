import { h } from 'vue';

import { notification } from 'ant-design-vue';

import { LoadingOutlined, SettingOutlined, DoubleRightOutlined } from '@ant-design/icons-vue';
import ExternalLinkIcon from '@/assets/icons/module-icons/external-link.svg';

import Button from '@/components/ui/Button';

const MAX_TEXT_LENGTH = 100;

export default function useNotification() {
    const openExplorer = (explorer, key) => {
        window.open(explorer, '_blank');
        return closeNotification(key);
    };

    const showNotification = ({
        key,
        type = 'info',
        title = 'notification',
        description = '',
        duration = 3,
        prepare = false,
        onCancel = () => {},
        ...args
    } = {}) => {
        const { explorerLink, txHash, wait } = args;

        let descriptionText = description;

        if (description && description.length > MAX_TEXT_LENGTH) {
            descriptionText = `${description.slice(0, MAX_TEXT_LENGTH)}.......`;
        }

        const notificationParams = {
            class: `custom-notification ${type} ${key}`,
            key,
            type,
            message: title,
            description: descriptionText,
            placement: 'bottomRight',
            duration,
            ...args,
        };

        if (explorerLink) {
            notificationParams.btn = () =>
                h(ExternalLinkIcon, { class: 'notification-explorer', onClick: () => openExplorer(explorerLink, key) });
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
                h(SettingOutlined, {
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
