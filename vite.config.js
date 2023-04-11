// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import ts2 from "rollup-plugin-typescript2";
import path from "path";

export default defineConfig({
  assetsInclude: ["**/*.md"],
  plugins: [
    {
      ...ts2({
        check: true,
        tsconfig: path.resolve(__dirname, `tsconfig.json`), // your tsconfig.json path
        tsconfigOverride: {
          compilerOptions: {
            sourceMap: false,
            declaration: true,
            declarationMap: true,
          },
        },
      }),
      enforce: "pre",
    },
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "Remix hook form",
      // the proper extensions will be added
      fileName: "index",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["react", "react-dom", "react-hook-form", "@remix-run/react"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps

        globals: {
          react: "React",
          "@remix-run/react": "@remix-run/react",
          "react-hook-form": "react-hook-form",
        },
      },
    },
  },
});
