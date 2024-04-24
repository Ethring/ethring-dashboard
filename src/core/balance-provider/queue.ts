export default class RequestQueue {
    private queue: (() => Promise<any>)[] = [];
    private isProcessing: boolean = false;
    private currentRequests: number = 0;
    private maxConcurrentRequests: number = 3;

    constructor(private delayBetweenRequests: number = 300) {}

    async add(request: () => Promise<any>) {
        this.queue.push(request);
        await this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const requestsToProcess = Math.min(this.maxConcurrentRequests - this.currentRequests, this.queue.length);
            const batchRequests = this.queue.splice(0, requestsToProcess);
            const batchPromises = batchRequests.map((request) => this.executeRequest(request));
            await Promise.all(batchPromises);
            await this.wait(this.delayBetweenRequests);
        }
        this.isProcessing = false;
    }

    private async executeRequest(request: () => Promise<any>) {
        this.currentRequests++;
        await request();
        this.currentRequests--;
    }

    private wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
