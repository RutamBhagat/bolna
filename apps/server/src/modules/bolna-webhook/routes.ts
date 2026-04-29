import { zValidator } from "@hono/zod-validator";
import type { CloudflareEnv } from "@bolna/env/server";
import { Hono } from "hono";
import { bolnaWebhookPayloadSchema } from "./schema";
import { formatSlackAlert, isEndedCall, parseEndedCall, sendSlackAlert } from "./service";

export const bolnaWebhookRoutes = new Hono<{ Bindings: CloudflareEnv }>();

bolnaWebhookRoutes.get("/health", (c) => {
  return c.json({ status: "ok" });
});

bolnaWebhookRoutes.post(
  "/webhooks/bolna",
  zValidator("json", bolnaWebhookPayloadSchema),
  async (c) => {
    const payload = c.req.valid("json");

    if (!isEndedCall(payload)) {
      return c.json({ status: "ignored", reason: "call_not_ended" });
    }

    const parsed = parseEndedCall(payload);

    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid ended call payload",
          issues: parsed.error.issues,
        },
        400,
      );
    }

    const text = formatSlackAlert(parsed.data);
    const slackResult = await sendSlackAlert(c.env.SLACK_WEBHOOK_URL, text);

    if (!slackResult.ok) {
      return c.json(
        {
          error: "Slack delivery failed",
          slackStatus: slackResult.status,
        },
        502,
      );
    }

    return c.json({ status: "sent" });
  },
);
