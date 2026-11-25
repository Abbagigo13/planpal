// Bundles the Express app (and all its dependencies) into dist/app.js
// for the Vercel serverless function in api/index.ts.
import { build } from "esbuild";

await build({
  entryPoints: ["server/_core/app.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/app.js",
  banner: {
    js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);",
  },
});