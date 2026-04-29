import type { CloudflareEnv } from "@bolna/env/server";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  bolnaWebhookIgnoredResponseSchema,
  bolnaWebhookInvalidResponseSchema,
  bolnaWebhookPayloadSchema,
  bolnaWebhookSentResponseSchema,
  bolnaWebhookSlackFailedResponseSchema,
  healthResponseSchema,
} from "./schema";
import { formatSlackAlert, isEndedCall, parseEndedCall, sendSlackAlert } from "./service";

export const bolnaWebhookRoutes = new OpenAPIHono<{ Bindings: CloudflareEnv }>();

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  summary: "Check service health",
  responses: {
    200: {
      description: "Service is available",
      content: {
        "application/json": {
          schema: healthResponseSchema,
        },
      },
    },
  },
});

const bolnaWebhookRoute = createRoute({
  method: "post",
  path: "/webhooks/bolna",
  summary: "Receive Bolna execution webhook events",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: bolnaWebhookPayloadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Webhook was accepted",
      content: {
        "application/json": {
          schema: z.union([bolnaWebhookSentResponseSchema, bolnaWebhookIgnoredResponseSchema]),
        },
      },
    },
    400: {
      description: "Ended call payload is missing required fields",
      content: {
        "application/json": {
          schema: bolnaWebhookInvalidResponseSchema,
        },
      },
    },
    502: {
      description: "Slack delivery failed",
      content: {
        "application/json": {
          schema: bolnaWebhookSlackFailedResponseSchema,
        },
      },
    },
  },
});

bolnaWebhookRoutes.openapi(healthRoute, (c) => {
  return c.json({ status: "ok" }, 200);
});

bolnaWebhookRoutes.openapi(bolnaWebhookRoute, async (c) => {
  const payload = c.req.valid("json");

  console.log("Bolna webhook payload", payload);

  if (!isEndedCall(payload)) {
    return c.json({ status: "ignored", reason: "call_not_ended" }, 200);
  }

  const parsed = parseEndedCall(payload);

  console.log("Bolna webhook parsed", parsed);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid ended call payload" as const,
        issues: parsed.error.issues as unknown[],
      },
      400,
    );
  }

  const text = formatSlackAlert(parsed.data);
  const slackResult = await sendSlackAlert(c.env.SLACK_WEBHOOK_URL, text);

  if (!slackResult.ok) {
    return c.json(
      {
        error: "Slack delivery failed" as const,
        slackStatus: slackResult.status,
      },
      502,
    );
  }

  return c.json({ status: "sent" }, 200);
});
