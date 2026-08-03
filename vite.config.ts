import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function wechatCompat(): Plugin {
  return {
    name: "wechat-compat",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "asset" || !chunk.name?.endsWith(".css")) continue;
        let css = chunk.source as string;
        // color-mix(in oklab, ...) → color-mix(in srgb, ...)
        // 这是唯一需要修复的：微信 WebView 的 @supports 检测通过了，
        // 但 oklab 色域渲染失败。换成 srgb 色域就能正常渲染
        css = css.replace(/color-mix\(in\s+oklab,/g, "color-mix(in srgb,");
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
