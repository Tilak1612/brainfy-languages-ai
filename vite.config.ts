import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import Anthropic from "@anthropic-ai/sdk";

// Dev-server middleware that proxies chat to the Anthropic API server-side.
// The API key is read from the environment / .env and NEVER shipped to the
// browser. If no key is configured, /api/health reports ai:false and the app
// falls back to the scripted tutor.
function brainfyApi(apiKey?: string): Plugin {
  return {
    name: "brainfy-api",
    configureServer(server) {
      server.middlewares.use("/api/health", (req, res, next) => {
        if (req.method !== "GET") return next();
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ai: !!apiKey }));
      });

      server.middlewares.use("/api/chat", (req, res, next) => {
        if (req.method !== "POST") return next();
        if (!apiKey) {
          res.statusCode = 503;
          res.end("AI not configured");
          return;
        }
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", async () => {
          try {
            const { system, messages } = JSON.parse(body || "{}");
            const client = new Anthropic({ apiKey });
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.setHeader("cache-control", "no-cache");
            const stream = client.messages.stream({
              model: "claude-opus-4-8",
              max_tokens: 400,
              thinking: { type: "disabled" }, // snappy replies for a live tutor
              system,
              messages,
            });
            stream.on("text", (t) => res.write(t));
            await stream.finalMessage();
            res.end();
          } catch (e) {
            res.statusCode = 500;
            res.end("error: " + (e instanceof Error ? e.message : String(e)));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  return {
    plugins: [react(), tailwindcss(), brainfyApi(apiKey)],
  };
});
