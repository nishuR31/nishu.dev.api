import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl =
    mode === "development"
      ? env.VITE_API_URL || "http://localhost:4000"
      : env.BACKEND_URL || "http://localhost:4000";

  return {
    root: "client",
    base: "/admin/",
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: backendUrl.startsWith("https://"),
        },
        "/socket.io": {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
          secure: backendUrl.startsWith("https://"),
        },
      },
    },
    build: {
      outDir: "../dist/client",
      emptyOutDir: true,
    },
  };
});
