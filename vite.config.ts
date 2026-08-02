// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// 自定义 Vite 插件：CSS 中的 oklch → srgb 兼容微信 WebView
function wechatCSSCompat(): Plugin {
  return {
    name: "wechat-css-compat",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const [key, chunk] of Object.entries(bundle)) {
        if (chunk.type === "asset" && key.endsWith(".css") && typeof chunk.source === "string") {
          // color-mix(in oklab, ...) → color-mix(in srgb, ...)
          chunk.source = chunk.source.replace(/color-mix\(in oklab,/g, "color-mix(in srgb,");
          // 移除 @supports 包裹，让 solid fallback 直接生效
          // Tailwind v4 在 opacity 类上会先设 solid color 作为 fallback，再在 @supports 里用 color-mix
          // 微信 WebView 既然不支持 color-mix，不如直接让它用 solid fallback
        }
      }
    },
  };
}

export default defineConfig({
  nitro: { preset: "node-server" },
  vite: {
    plugins: [wechatCSSCompat()],
    preview: {
      allowedHosts: true,
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
