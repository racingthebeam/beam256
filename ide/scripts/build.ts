import * as esbuild from "esbuild";
import { readFileSync } from "fs";
import { resolve } from "path";

const env = process.env.NODE_ENV ?? "dev";
const envFile = readFileSync(resolve(`env/${env}.env`), "utf-8");

const define: Record<string, string> = {};
for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    define[`process.env.${key}`] = JSON.stringify(rest.join("="));
}

const opts = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    format: "esm",
    sourcemap: true,
    minify: env === "prod",
    define,
    alias: {},
    loader: {
        ".png": "file",
        ".jpg": "file",
        ".svg": "file",
        ".css": "css"
    }
};

// grab local modules from TS config so we don't duplicate them here
const tsc = JSON.parse(readFileSync(import.meta.dirname + "/../tsconfig.json"));
for (const [k, v] of Object.entries(tsc.compilerOptions.paths)) {
    opts.alias[k] = `./${v[0]}`;
}

if (env === "dev") {
    const ctx = await esbuild.context({ ...opts, outdir: "public/dist" });
    await ctx.watch();
    const { hosts, port } = await ctx.serve({
        servedir: "public"
    });
    console.log(`Dev server running at http://${hosts[0]}:${port}`)
} else {
    await esbuild.build({ ...opts, outfile: "dist/bundle.js" });
}


