.define IO_CPU_BASE                 0x00
.define IO_CPU_DATA_STACK_BASE      (IO_CPU_BASE + 0)
.define IO_CPU_DATA_STACK_PTR       (IO_CPU_BASE + 1)
.define IO_CPU_FRAME_STACK_BASE     (IO_CPU_BASE + 2)
.define IO_CPU_FRAME_STACK_PTR      (IO_CPU_BASE + 3)
.define IO_CPU_JUMP_TABLE_BASE      (IO_CPU_BASE + 4)

.define IO_DBG_BASE                 0x10
.define IO_DBG_STATUS               (IO_DBG_BASE + 0)
.define IO_DBG_SELECT               (IO_DBG_BASE + 1)
.define IO_DBG_CLEAR                (IO_DBG_BASE + 2)
.define IO_DBG_VALUE                (IO_DBG_BASE + 3)

.define IO_DATA_BASE                0x18
.define IO_DATA_SELECT              (IO_DATA_BASE + 0)
.define IO_DATA_SIZE                (IO_DATA_BASE + 1)
.define IO_DATA_OFFSET              (IO_DATA_BASE + 2)
.define IO_DATA_CMD                 (IO_DATA_BASE + 3)
.define IO_DATA_STATUS              (IO_DATA_BASE + 4)

.define IO_COUNTER_BASE             0x20
.define IO_COUNTER_SELECT           (IO_COUNTER_BASE + 0)
.define IO_COUNTER_STATUS           (IO_COUNTER_BASE + 1)
.define IO_COUNTER_ADDR             (IO_COUNTER_BASE + 2)

.define IO_TIME_BASE                0x28
.define IO_TIME_SYS_UPTIME          (IO_TIME_BASE + 0)
.define IO_TIME_APP_UPTIME          (IO_TIME_BASE + 1)
.define IO_TIME_WALL_TIME           (IO_TIME_BASE + 2)

.define IO_RNG_BASE                 0x2C
.define IO_RNG_VALUE                (IO_RNG_BASE + 0)

.define IO_LINK_BASE                0x30
; TODO

.define IO_CTL_BASE                 0x40
.define IO_CTL_POLL                 (IO_CTL_BASE + 0)
.define IO_CTL_PLAYER               (IO_CTL_BASE + 1)
.define IO_CTL_BTN_STATE            (IO_CTL_BASE + 2)
.define IO_CTL_BTN_DELTA_COUNT_0    (IO_CTL_BASE + 3)
.define IO_CTL_BTN_DELTA_COUNT_1    (IO_CTL_BASE + 4)
.define IO_CTL_BTN_DELTA_COUNT_2    (IO_CTL_BASE + 5)
.define IO_CTL_BTN_DELTA_COUNT_3    (IO_CTL_BASE + 6)
.define IO_CTL_RGB_LED_SET          (IO_CTL_BASE + 7)
.define IO_CTL_LED_SET              (IO_CTL_BASE + 8)

.define IO_DISP_BASE                0x50
.define IO_DISP_STATUS              (IO_DISP_BASE + 0)
.define IO_DISP_MODE                (IO_DISP_BASE + 1)
.define IO_DISP_CMD                 (IO_DISP_BASE + 2)
.define IO_DISP_FRAMEBUFFER_BASE    (IO_DISP_BASE + 3)
.define IO_DISP_PALETTE_BASE        (IO_DISP_BASE + 4)

.define IO_GPU_BASE                 0x80

.define IO_AUDIO_BASE               0xC0

