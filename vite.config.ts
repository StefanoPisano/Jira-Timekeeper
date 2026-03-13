import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/jira": {
        target: "https://dummy.atlassian.net",
        changeOrigin: true,

        rewrite: (path) => path.replace(/^\/api\/jira/, ""),

        configure(proxy) {
          proxy.on("proxyReq", (proxyReq, req) => {
            const domain = req.headers["x-jira-domain"];

            if (domain) {
              proxyReq.setHeader("host", domain);
              proxyReq.protocol = "https:";
            }
          });
        }
      }
    }
  }
});