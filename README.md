# Bolna Call-End Slack Alert

This Hono service receives Bolna execution webhooks and sends a Slack incoming webhook alert when a call ends

The Slack alert includes:

- `id`
- `agent_id`
- `duration` from Bolna `conversation_duration`
- `transcript`

Non-ended webhook events are acknowledged and ignored.
Duplicate ended webhook events with the same Bolna `id` are acknowledged and ignored after the first Slack alert.

## Scalar API Documentation

The API documentation is available at ![Scalar API Documentation](https://bolna-server-stage.rutambhagat.workers.dev/scalar) endpoint.

## Setup

Install dependencies:

```bash
bun install
```

Create local environment values:

```bash
cp apps/server/.env.example apps/server/.env
```

Set these values in `apps/server/.env`:

```txt
CORS_ORIGIN=*
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

Do not commit a real Slack webhook URL.

## Local Development

Start the Cloudflare Worker locally through Alchemy:

```bash
bun run dev
```

The API runs at `http://localhost:3000`.

Health check:

```bash
curl http://localhost:3000/health
```

Send a completed-call webhook:

```bash
curl -X POST http://localhost:3000/webhooks/bolna \
  -H "Content-Type: application/json" \
  -d '{
    "id": "exec_123",
    "agent_id": "d311e737-70e6-4075-bef6-c0ef3a7026b4",
    "status": "completed",
    "conversation_duration": 42,
    "transcript": "Agent: Hello from Bolna.\nUser: I need help.\nAgent: Sure."
  }'
```

Send a non-ended webhook:

```bash
curl -X POST http://localhost:3000/webhooks/bolna \
  -H "Content-Type: application/json" \
  -d '{ "status": "in-progress" }'
```

Send an invalid ended webhook:

```bash
curl -i -X POST http://localhost:3000/webhooks/bolna \
  -H "Content-Type: application/json" \
  -d '{
    "id": "exec_123",
    "agent_id": "d311e737-70e6-4075-bef6-c0ef3a7026b4",
    "status": "completed",
    "conversation_duration": 42
  }'
```

## Deployment

Deploy through the generated Alchemy package:

```bash
bun run deploy
```

Configure `SLACK_WEBHOOK_URL` for the deployed Worker environment before live testing.
Deployment also creates a Workers KV namespace used to deduplicate ended-call webhooks by Bolna `id`.

To test with Bolna:

1. Deploy the Worker.
2. Copy the deployed Worker URL ending in `/webhooks/bolna`.
3. Add that URL in the Bolna agent Analytics webhook settings.
4. Trigger a test call if the trial account allows it.

## Issues During Development

Live Bolna webhook testing showed that completed call payloads send the call length as
`conversation_duration`, not `conversation_time`. The first implementation followed the
sample docs and required `conversation_time`, so real completed-call events failed Zod
validation before the Slack alert could be sent.

The webhook schema and Slack formatter now use `conversation_duration` as the source for
the required `duration` value.

Duplicate ended-call deliveries can happen during webhook retries or repeated local testing with the same sample payload. The Worker stores each delivered ended-call `id` in KV for 30 days and returns `{"status":"ignored","reason":"duplicate_ended_call"}` for repeats.
