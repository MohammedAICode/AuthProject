import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: "node22",
  format: ["esm"],
  bundle: true,
  dts: false,
  external: [
    "@prisma/client",
    ".prisma/client"
  ]
});