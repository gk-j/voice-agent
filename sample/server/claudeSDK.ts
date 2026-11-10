import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

export async function claudeSDK(query: string): Promise<string> {
  const message = await client.messages.create({
    model: process.env["ANTHROPIC_MODEL"] ?? "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: "You are a friendly voice assistant. Keep answers clear and brief because they will be spoken aloud.",
    messages: [{ role: "user", content: query }],
  });

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
