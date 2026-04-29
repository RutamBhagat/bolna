import {
  endedBolnaCallSchema,
  endedCallStatusSchema,
  type BolnaWebhookPayload,
  type EndedBolnaCall,
} from "./schema";

export function isEndedCall(payload: BolnaWebhookPayload): boolean {
  return endedCallStatusSchema.safeParse(payload.status).success;
}

export function parseEndedCall(payload: BolnaWebhookPayload) {
  return endedBolnaCallSchema.safeParse(payload);
}

export function formatSlackAlert(call: EndedBolnaCall): string {
  return [
    "*Bolna call ended*",
    `id: \`${call.id}\``,
    `agent_id: \`${call.agent_id}\``,
    `duration: \`${call.conversation_time}s\``,
    "",
    "transcript:",
    "```",
    call.transcript,
    "```",
  ].join("\n");
}

export async function sendSlackAlert(slackWebhookUrl: string, text: string) {
  const response = await fetch(slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      body: await response.text(),
    };
  }

  return { ok: true as const };
}
