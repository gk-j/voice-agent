import express, { json } from "express";
import { claudeSDK } from "./claudeSDK";

const app = express();
const port = Number(process.env["PORT"] ?? 3000);

app.use(json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/llm", async (request, response) => {
  const query = request.body?.query;

  if (typeof query !== "string" || !query.trim()) {
    response.status(400).json({ error: "A non-empty query is required." });
    return;
  }

  try {
    const answer = await claudeSDK(query.trim());
    response.json({ answer });
  } catch (error) {
    console.error("LLM request failed:", error);
    response.status(500).json({ error: "The AI could not answer right now." });
  }
});

app.listen(port, () => {
  console.log(`Voice agent server running at http://localhost:${port}`);
});
