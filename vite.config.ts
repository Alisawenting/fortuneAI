import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import postcssPresetEnv from "postcss-preset-env";

export default defineConfig({
  nitro: { preset: "node-server" },
  vite: {
    css: {
      postcss: {
        plugins: [
          postcssPresetEnv({
            stage: 2,
            features: {
              // 微信 WebView 兼容关键项
              "oklab-function": { preserve: false, subFeatures: { displayP3: false } },
              "color-function": { preserve: false },
              "color-mix": { preserve: false },
              "nesting-rules": true,
            },
            autoprefixer: { grid: true },
          }) as any,
        ],
      },
    },
    preview: { allowedHosts: true },
  },
  tanstackStart: { server: { entry: "server" } },
});
