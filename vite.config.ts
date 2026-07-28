// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // 显式启用 nitro 的 node-server 预设，产出可自监听端口的独立 Node 服务
  // （默认 cloudflare-module 预设产物是 Worker 格式，用 node 跑不监听端口）。
  // 构建产物在 .output/：服务端 .output/server/index.mjs，静态资源 .output/public。
  // 端口用环境变量 PORT 控制（默认 3000）。
  nitro: { preset: "node-server" },
  vite: {
    preview: {
      allowedHosts: true, // 允许所有 host，方便内网穿透访问
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
