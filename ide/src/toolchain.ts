type Job = {
    id: number,
    op: string,
    payload: any,
    onComplete: (err?: string, res?: any) => void
};

export class Toolchain {
    #worker = new Worker("/vendor/toolchain_worker.js");
    #ready = false;
    #queue = new Array<Job>();
    #nextID = 1;
    #pendingJob: Job | null = null;

    get ready(): boolean { return this.#ready; }

    constructor() {
        this.#worker.onmessage = (evt) => {
            if (evt.data.ready) {
                console.log("Toolchain ready");
                this.#ready = true;
                this.#drain();
                return;
            }
            this.#handleResult(evt.data);
        };
    }

    build(payload: string): Promise<any> {
        return this.#submitJob("build", payload);
    }

    #submitJob(op: string, payload: any): Promise<string> {
        return new Promise((yes, no) => {
            this.#queue.push({
                id: this.#nextID++,
                op: op,
                payload: payload,
                onComplete(err, res) {
                    if (err) {
                        no(err);
                    } else {
                        yes(res);
                    }
                },
            });
            this.#drain();
        });
    }

    #drain() {
        if (!this.ready || this.#queue.length === 0) return;

        if (this.#pendingJob) {
            console.error("BUG: #drain() called when job still pending");
        }

        this.#pendingJob = this.#queue.shift() as Job;

        this.#worker.postMessage({
            id: this.#pendingJob.id,
            op: this.#pendingJob.op,
            payload: this.#pendingJob.payload,
        });
    }

    #handleResult(res: { id: number, error?: string, result?: any }) {
        const pj = this.#pendingJob;
        if (pj === null) {
            console.error("BUG: received a toolchain result when no pending job");
            return;
        }

        this.#pendingJob = null;

        pj.onComplete(res.error, res.result);

        this.#drain();
    }
}
