import { notification } from 'ant-design-vue';

export default function useNotification() {
    const showNotification = ({ key, type = 'info', title = 'notification', description = null, ...args } = {}) => {
        notification[type]({
            key,
            message: title,
            description,
            placement: 'bottomRight',
            ...args,
        });
    };

    const closeNotification = (key) => {
        notification.close(key);
    };

    return {
        showNotification,
        closeNotification,
    };
}
