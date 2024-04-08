import useNotification from '@/compositions/useNotification';

declare global {
    interface Window {
        customNotifications: {
            showSuccess: (title: string, description: string, duration: number) => void;
            showPrepare: (title: string, description: string, duration: number) => void;
            closeNotificationByKey: (key: string) => void;
        };
    }
}
export default function development() {
    console.log('development script');

    const { showNotification, closeNotification } = useNotification();

    if (!window) {
        return;
    }

    window.customNotifications = {
        showSuccess: (title: string = 'Success test', description: string = null, duration: number = 3) => {
            showNotification({
                type: 'success',
                key: 'success-notification',
                title: `${title} - will close in ${duration}s`,
                description,
                duration,
            });
        },

        showPrepare: (title: string = 'Prepare test', description: string = null, duration: number = 3) => {
            showNotification({
                type: 'info',
                key: 'prepare-notification',
                title: `${title} - will close in ${duration}s`,
                description,
                duration,
                prepare: true,
            });
        },

        closeNotificationByKey(key) {
            closeNotification(key);
        },
    };
}
