import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import { reactRouterDevTools } from "react-router-devtools";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [reactRouterDevTools(), reactRouter(), tsconfigPaths()],
});
