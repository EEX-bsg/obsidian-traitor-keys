import esbuild from "esbuild";
import { readFileSync } from "fs";

const banner = {
  js: `/*\n * THIS FILE IS GENERATED.\n * If you want to view the source, visit the repo.\n */`,
};

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "cjs",
  target: "es2018",
  platform: "browser",
  outfile: "main.js",
  external: ["obsidian"],
  banner,
  sourcemap: process.argv.includes("--production") ? false : "inline",
});

if (process.argv.includes("--watch")) {
  await context.watch();
  console.log("Watching for changes...");
} else {
  await context.rebuild();
  await context.dispose();
}
