import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "./",
    plugins: [tailwindcss(), tanstackRouter({}), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@fonts": path.resolve(__dirname, "./fonts"),
      },
    },
    // Make environment variables available to the client
    define: {
      "import.meta.env.VITE_SERVER_URL": JSON.stringify(
        env.VITE_SERVER_URL || "http://localhost:3000"
      ),
    },
  };
});
