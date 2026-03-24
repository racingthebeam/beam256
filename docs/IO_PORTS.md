# IO Ports

## Ideas

  - Graphics mode (resolution, bit depth) (1)
  - Graphics status (writable to trigger draw) (1)
  - Graphics framebuffer base address (1)
  - Graphics palette base address (1)
  - Stack base address (1)
  - Stack pointer (1)
  - Time (milliseconds since startup) (1)
  - Timer peripherals (~12)
  - Button input (state, change count) (~4)
  - LED output (if we decide to have user-controllable LEDs) (~1)
  - Something for reading/writing persistent storage (high-scores, save progress etc.) (~4)
  - Something for reading additional information data from image (for games larger than 256KiB) (~4)
  - GPU control (set buffer address, flush, status) (~4)
  - Audio control (channel params (osc type, freq, sample address, volume, envelope settings), trigger (~25)
  - Sequencer control (buffer address, length, loop mode, active channels, playback status) (~5)
  - Maybe: UART control (if we want to add a UART) (~6)
  - Maybe: ADC input (if we allow a future analog controller)
  - Maybe: debug controls
