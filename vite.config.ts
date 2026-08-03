import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// CSS 兼容微信 WebView：color-mix(in oklab) → color-mix(in srgb)
function wechatCompat(): Plugin {
  return {
    name: "wechat-compat",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "asset" || !chunk.name?.endsWith(".css")) continue;
        let css = chunk.source as string;
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
