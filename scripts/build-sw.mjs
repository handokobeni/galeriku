/**
 * Post-build script to compile and inject the service worker manifest.
 * Runs after `next build` to generate public/sw.js with precache entries.
 *
 * Uses @serwist/next configurator mode (Turbopack-compatible).
 */

import { serwist } from "@serwist/next/config";
import { runBuildCommand } from "@serwist/cli";
import path from "node:path";

const cwd = process.cwd();

const buildOptions = await serwist({
  swSrc: path.join(cwd, "src/app/sw.ts"),
  swDest: path.join(cwd, "public/sw.js"),
  globDirectory: cwd,
});

await runBuildCommand({ config: buildOptions, watch: false });
