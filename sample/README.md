# Simple Voice Agent

This project demonstrates one complete spoken turn:

```text
You speak → browser detects your pause → final transcript → AI → spoken answer
```

The browser handles speech-to-text and text-to-speech. The server only sends the transcript to Claude and returns its answer.

## Run it

Open two terminal windows.

### 1. Start the server

```bash
cd server
bun install
bun run index.ts
```

Add your Anthropic key to `server/.env` first:

```env
ANTHROPIC_API_KEY=your_key_here
```

### 2. Start the website

```bash
cd ui
bun install
bun run dev
```

Open the local URL printed by Vite in Chrome or Edge. Press **Start talking**, allow microphone access, speak, and pause.

## How the code maps to the flow

1. `ui/src/SimpleComponents/ASR.tsx` starts the browser microphone.
2. The browser's `SpeechRecognition` API detects a pause and produces a final transcript.
3. The UI sends that text to `POST /llm`.
4. `server/claudeSDK.ts` asks Claude for a short answer.
5. The UI uses `speechSynthesis` to speak the returned text.

This is intentionally a one-turn-at-a-time example. Press the button again for the next question.
