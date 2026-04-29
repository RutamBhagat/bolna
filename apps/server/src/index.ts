import { env, type CloudflareEnv } from "@bolna/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bolnaWebhookRoutes } from "./modules/bolna-webhook/routes";

const app = new Hono<{ Bindings: CloudflareEnv }>();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.route("/", bolnaWebhookRoutes);

export default app;
