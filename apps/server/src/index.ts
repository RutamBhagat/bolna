import { env, type CloudflareEnv } from "@bolna/env/server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bolnaWebhookRoutes } from "./modules/bolna-webhook/routes";

const app = new OpenAPIHono<{ Bindings: CloudflareEnv }>();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.route("/", bolnaWebhookRoutes);
app.doc31("/doc", {
  openapi: "3.1.0",
  info: {
    title: "Bolna Call-End Slack Alert API",
    version: "1.0.0",
  },
});
app.get(
  "/scalar",
  Scalar({
    url: "/doc",
    pageTitle: "Bolna API Reference",
  }),
);

export default app;
