// Emulator provides IO and all other external integration
// to a Machine
export class Emulator {
    constructor({ machine }) {
        this.machine = machine;
    }

    start() {
        const tick = () => {
            this.machine.runCycles(100);
            setTimeout(tick, 0);
        };

        tick();
    }
}
