const InternalSampleRate = 12_000;

const Inc = InternalSampleRate / sampleRate;

class Processor extends AudioWorkletProcessor {
    #memoryBuffer;
    #ramOffset;
    #memory;
    #phase = 0;
    #commands = [];

    constructor() {
        super();

        // First message received by the processor is always a "ready"
        // message from the emulator - use this to store a reference
        // to the machine's RAM, then setup the command handler.
        this.port.onmessage = (evt) => {
            if (evt.data.type !== "ready") {
                console.error(`Audio engine expected "ready" message, got "${evt.data.type}"`);
                return;
            }
            this.#memoryBuffer = evt.data.memoryBuffer;
            this.#ramOffset = evt.data.ramOffset;
            this.#memory = new Uint8Array(this.#memoryBuffer, this.#ramOffset, 256 * 1024);
            this.port.onmessage = (evt) => { this.#handleCommand(evt.data); };
        };
    }

    process(inputs, outputs) {
        const out = outputs[0][0];

        let p = this.#phase;
        for (let i = 0; i < out.length; i++) {
            let v = this.#memory[Math.floor(p)];
            v = (v - 127) / 127;
            out[i] = v;
            p += Inc;
            if (p >= 256 * 1024) {
                p -= (256 * 1024);
            }
        }

        this.#phase = p;

        return true;
    }

    #handleCommand(cmd) {
        // TODO: enqueue command
        console.log("Processor cmd", cmd);
    }
};

registerProcessor("beam256-audio-engine", Processor);
