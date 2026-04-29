import { z } from "@hono/zod-openapi";

export const endedCallStatusSchema = z.enum(["completed", "call-disconnected"]);

export const bolnaWebhookPayloadSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).optional(),
  agent_id: z.string().optional(),
  status: z.string().optional(),
  conversation_duration: z.coerce.number().nonnegative().optional(),
  transcript: z.string().optional(),
});

export const endedBolnaCallSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).transform(String),
  agent_id: z.string().min(1),
  status: endedCallStatusSchema,
  conversation_duration: z.coerce.number().nonnegative(),
  transcript: z.string(),
});

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export const bolnaWebhookSentResponseSchema = z.object({
  status: z.literal("sent"),
});

export const bolnaWebhookIgnoredResponseSchema = z.object({
  status: z.literal("ignored"),
  reason: z.enum(["call_not_ended", "duplicate_ended_call"]),
});

export const bolnaWebhookInvalidResponseSchema = z.object({
  error: z.literal("Invalid ended call payload"),
  issues: z.array(z.unknown()),
});

export const bolnaWebhookSlackFailedResponseSchema = z.object({
  error: z.literal("Slack delivery failed"),
  slackStatus: z.number().int(),
});

export type BolnaWebhookPayload = z.infer<typeof bolnaWebhookPayloadSchema>;
export type EndedBolnaCall = z.infer<typeof endedBolnaCallSchema>;
export type EndedCallStatus = z.infer<typeof endedCallStatusSchema>;
