export const Up = 1;
export const Down = 2;
export const Left = 4;
export const Right = 8;
export const A = 16;
export const B = 32;
export const X = 64;
export const Y = 128;
export const Start = 256;
export const Select = 512;

export type EmulatorImage = {
    memory: Uint8Array
};

export class Emulator {
    #dead = false;
    #canvas: OffscreenCanvas;
    #worker = new Worker("/vendor/emulator_worker.js");
    #readyPromise: Promise<void>;
    #memoryBuffer: SharedArrayBuffer = new SharedArrayBuffer(0);
    #ramOffset: number = 0;

    constructor(audioCtx: AudioContext, canvas: HTMLCanvasElement) {
        this.#canvas = canvas.transferControlToOffscreen();

        const ae = new AudioWorkletNode(audioCtx, "beam256-audio-engine", {
            outputChannelCount: [1]
        });

        const volume = new GainNode(audioCtx);
        volume.gain.setValueAtTime(0.3, 0);
        ae.connect(volume);
        volume.connect(audioCtx.destination);

        console.log("audio engine", ae);

        this.#readyPromise = new Promise((yes, no) => {
            this.#worker.onmessage = (evt) => {
                if (evt.data.type !== "ready") {
                    console.error(`expected ready, got ${evt.data.type}`);
                    return;
                }
                // TODO: reset worker message handler
                this.#memoryBuffer = evt.data.memoryBuffer;
                this.#ramOffset = evt.data.ramOffset;
                yes();
            };
        });

        this.#worker.postMessage({
            type: "init",
            canvas: this.#canvas,
            audioPort: ae.port
        }, [this.#canvas, ae.port]);
    }

    waitForReady(): Promise<void> {
        return this.#readyPromise;
    }

    destroy() {
        if (this.#dead) return;
        this.#dead = true;
        this.#worker.terminate();
    }

    reset(image: EmulatorImage) {
        this.#worker.postMessage({
            type: "reset",
            memory: image.memory,
        });
    }

    buttonDown(btn: number) {
        this.#worker.postMessage({
            type: "buttonDown",
            button: btn,
        });
    }

    buttonUp(btn: number) {
        this.#worker.postMessage({
            type: "buttonUp",
            button: btn,
        });
    }
}
