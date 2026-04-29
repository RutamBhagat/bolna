import alchemy from "alchemy";
import { KVNamespace, Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/server/.env" });

const app = await alchemy("bolna");

const bolnaWebhookDedupe = await KVNamespace("bolna-webhook-dedupe", {
  title: "bolna-webhook-dedupe",
});

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    SLACK_WEBHOOK_URL: alchemy.env.SLACK_WEBHOOK_URL!,
    BOLNA_WEBHOOK_DEDUPE: bolnaWebhookDedupe,
  },
  dev: {
    port: 3000,
  },
});

console.log(`Server -> ${server.url}`);

await app.finalize();
