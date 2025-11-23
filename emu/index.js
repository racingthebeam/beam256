import BEAM256 from "./beam256.js";

async function run() {
    const Module = await BEAM256();

    // Option 1: ccall
    // const sum = Module.ccall('init', 'number', ['number', 'number'], [3, 5]);
    const init = Module.ccall('init', 'number');
    console.log('Init:', init);

    // // Option 2: cwrap (more convenient for repeated calls)
    // const multiply = Module.cwrap('multiply', 'number', ['number', 'number']);
    // console.log('Product:', multiply(4, 7));
}

run();
