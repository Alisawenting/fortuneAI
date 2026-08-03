import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// CSS 兼容微信 WebView
function wechatCompat(): Plugin {
  return {
    name: "wechat-compat",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "asset" || !chunk.name?.endsWith(".css")) continue;
        let css = chunk.source as string;
        // 1. color-mix(in oklab) → color-mix(in srgb)
        css = css.replace(/color-mix\(in\s+oklab,/g, "color-mix(in srgb,");
        // 2. @layer → @media screen
        css = css.replace(/@layer\s+\w+\s*\{/g, "@media screen{");
        css = css.replace(/@layer\s+\w+\s*;/g, "");
        // 3. 删除所有 @supports 块（保留块外 fallback）
        css = css.replace(/@supports\s*\([^{]*\)\s*\{/g, "@media screen{");
        // 4. 删除 color-mix() 块内的 var()（避免混合色域失败）
        // 5. backdrop-filter 替换为基础样式
        css = css.replace(/backdrop-filter:[^;};]+/g, "");
        css = css.replace(/-webkit-backdrop-filter:[^;};]+/g, "");
        chunk.source = css;
      }
    },
  };
}

export default defineConfig({
  nitro: { preset: "node-server" },
  vite: {
    plugins: [wechatCompat()],
    preview: { allowedHosts: true },
  },
  tanstackStart: { server: { entry: "server" } },
});
