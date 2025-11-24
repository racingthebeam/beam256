CORE_SRC := $(wildcard src/core/*.c)
WASM_SRC := $(wildcard src/wasm/*.c)

CFLAGS = -Iinclude

OUT_DIR := build

WASM_OUT_DIR := $(OUT_DIR)/wasm
WASM_MODULE_NAME := beam256.js
WASM_MODULE_JS := $(WASM_OUT_DIR)/beam256.js
WASM_MODULE := $(WASM_OUT_DIR)/beam256.wasm

all: wasm

wasm: $(WASM_MODULE_JS)

deploy: wasm
	cp $(WASM_MODULE_JS) emu/
	cp $(WASM_MODULE) emu/

clean:
	rm -rf $(OUT_DIR)

$(WASM_OUT_DIR):
	mkdir -p $@

$(WASM_MODULE_JS): $(WASM_OUT_DIR) $(CORE_SRC) $(WASM_SRC)
	emcc $(CORE_SRC) $(WASM_SRC) \
		-O3 \
		$(CFLAGS) \
		-o $(WASM_MODULE_JS) \
		-s MODULARIZE=1 \
		-s EXPORT_ES6=1 \
		-s EXPORT_NAME="BEAM256" \
		-s ALLOW_TABLE_GROWTH=1 \
		-s EXPORTED_FUNCTIONS='["_init", "_ram_base", "_tick", "_is_halted", "_read_reg"]' \
		-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPU8","addFunction"]'

.PHONY: all wasm clean deploy

