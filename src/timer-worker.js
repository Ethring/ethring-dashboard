onmessage = function (event) {
    if (event.data === 'start_timer') {
        const timerID = this.setTimeout(() => {
            postMessage('timer_expired');
        }, 30000);

        postMessage({ timerID });
    }

    if (event.data?.clearTimer) {
        this.clearTimeout(event.data.timerID);
    }
};
