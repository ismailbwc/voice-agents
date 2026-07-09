import Retell from "retell-sdk";

let client: Retell | null = null;

export function getRetellClient(): Retell {
  if (!client) {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) throw new Error("RETELL_API_KEY is not configured");
    client = new Retell({ apiKey });
  }
  return client;
}
