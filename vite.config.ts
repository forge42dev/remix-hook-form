// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import ts2 from "rollup-plugin-typescript2";

export default defineConfig({
  plugins: [
    {
      ...ts2({
        check: true,
        exclude: [
          "**/__tests__/**",
          "**/__mocks__/**",
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/*.config.ts",
          "**/testing-app/**",
        ],
        tsconfig: resolve(__dirname, `tsconfig.json`),
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
      entry: resolve(__dirname, "src/index.ts"),
      name: "Remix hook form",
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react-hook-form", "@remix-run/react"],

      output: {
        globals: {
          react: "React",
          "@remix-run/react": "@remix-run/react",
          "react-hook-form": "react-hook-form",
        },
      },
    },
  },
});
