import { z } from "zod";

export const endedCallStatusSchema = z.enum(["completed", "call-disconnected"]);

export const bolnaWebhookPayloadSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).optional(),
  agent_id: z.string().optional(),
  status: z.string().optional(),
  conversation_time: z.coerce.number().nonnegative().optional(),
  transcript: z.string().optional(),
});

export const endedBolnaCallSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).transform(String),
  agent_id: z.string().min(1),
  status: endedCallStatusSchema,
  conversation_time: z.coerce.number().nonnegative(),
  transcript: z.string(),
});

export type BolnaWebhookPayload = z.infer<typeof bolnaWebhookPayloadSchema>;
export type EndedBolnaCall = z.infer<typeof endedBolnaCallSchema>;
export type EndedCallStatus = z.infer<typeof endedCallStatusSchema>;
