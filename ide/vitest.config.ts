import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
    },
    resolve: {
        alias: {
            "@racingthebeam/uikit": "./libs/uikit",
            "@racingthebeam/domutil": "./libs/domutil"
        }
    }
});
