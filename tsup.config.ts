import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  bundle: true,
  sourcemap: true,
  clean: true,
  dts: true,
  format: "esm",
  outExtension: () => ({ js: ".mjs" }),
});
