import useNotification from '@/compositions/useNotification';

export default function development() {
    console.log('development script');

    const { showNotification, closeNotification } = useNotification();

    if (!window) {
        return;
    }

    window.customNotifications = {
        showSuccess: (
            title: string = 'Success test',
            description: string = '',
            duration: number = 3,
            { withDuration }: { withDuration: boolean } = { withDuration: true },
        ) => {
            const durationText = withDuration ? ` - will close in ${duration}s` : '';

            showNotification({
                type: 'success',
                key: 'success-notification',
                title: `${title}${durationText}`,
                description,
                duration,
            });
        },

        showPrepare: (
            title: string = 'Prepare test',
            description: string = '',
            duration: number = 3,
            { withDuration }: { withDuration: boolean } = { withDuration: true },
        ) => {
            const durationText = withDuration ? ` - will close in ${duration}s` : '';

            showNotification({
                type: 'info',
                key: 'prepare-notification',
                title: `${title}${durationText}`,
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
