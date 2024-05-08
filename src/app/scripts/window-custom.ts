import { ref, Ref } from 'vue';

declare global {
    interface Window {
        customNotifications: {
            showSuccess: (title: string, description: string, duration: number, { withDuration }: { withDuration: boolean }) => void;
            showPrepare: (title: string, description: string, duration: number) => void;
            closeNotificationByKey: (key: string) => void;
        };

        CALL_NEXT_TX_WAIT_TIME: Ref<number>;

        BALANCE_WAIT_TIME: Ref<number>;
    }
}

export default function windowCustom() {
    window.CALL_NEXT_TX_WAIT_TIME = ref(3.5);
    window.BALANCE_WAIT_TIME = ref(6);
}

windowCustom();
