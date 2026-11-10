import { useEffect, useRef, useState } from "react";
import "./VoiceAgent.css";

type Stage = "ready" | "listening" | "thinking" | "speaking" | "error";

const stageText: Record<Stage, string> = {
  ready: "Ready",
  listening: "Listening — speak now",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Something went wrong",
};

export function ASR() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const supported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const [stage, setStage] = useState<Stage>("ready");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const text = Array.from(event.results, (result) => result[0].transcript).join(" ");
      setTranscript(text);

      const latestResult = event.results[event.results.length - 1];
      if (latestResult?.isFinal) void askAssistant(text);
    };

    async function askAssistant(query: string) {
      if (!query.trim()) return;
      setStage("thinking");
      setError("");

      try {
        const response = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = (await response.json()) as { answer?: string; error?: string };

        if (!response.ok || !data.answer) {
          throw new Error(data.error ?? "The assistant returned an empty answer.");
        }

        setAnswer(data.answer);
        const utterance = new SpeechSynthesisUtterance(data.answer);
        utterance.rate = 1;
        utterance.onstart = () => setStage("speaking");
        utterance.onend = () => setStage("ready");
        utterance.onerror = () => showError("The browser could not speak the answer.");
        window.speechSynthesis.speak(utterance);
      } catch (requestError) {
        showError(requestError instanceof Error ? requestError.message : "Could not reach the assistant.");
      }
    }

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;

      const messages: Record<string, string> = {
        "not-allowed": "Allow microphone access in your browser, then try again.",
        "audio-capture": "Check that your microphone is connected.",
        "no-speech": "I did not hear anything. Please try again.",
        network: "Speech recognition needs a network connection.",
      };
      showError(messages[event.error] ?? "Could not recognize your speech.");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      window.speechSynthesis.cancel();
      recognitionRef.current = null;
    };
  }, []);

  function showError(message: string) {
    setError(message);
    setStage("error");
  }

  function startListening() {
    if (!recognitionRef.current || stage === "thinking") return;

    if (stage === "listening") {
      recognitionRef.current.stop();
      return;
    }

    window.speechSynthesis.cancel();
    setTranscript("");
    setAnswer("");
    setError("");

    try {
      recognitionRef.current.start();
      setStage("listening");
    } catch {
      showError("Could not start the microphone. Please try again.");
    }
  }

  if (!supported) {
    return <main className="voice-shell"><h1>Simple Voice Agent</h1><p className="error">Speech recognition is unavailable. Open this page in Chrome or Edge.</p></main>;
  }

  return (
    <main className="voice-shell">
      <p className="eyebrow">Browser voice demo</p>
      <h1>Simple Voice Agent</h1>
      <p className="intro">Press once, ask a question, then pause. The assistant answers out loud.</p>

      <section className="flow" aria-label="Voice agent steps">
        <span>🎙️ You speak</span><b>→</b><span>📝 Transcript</span><b>→</b>
        <span>🧠 AI reply</span><b>→</b><span>🔊 Voice</span>
      </section>

      <button className={`mic-button ${stage}`} onClick={startListening} disabled={!supported || stage === "thinking"}>
        <span className="mic-icon">{stage === "listening" ? "■" : "●"}</span>
        {stage === "listening" ? "Stop and send" : "Start talking"}
      </button>

      <p className={`status ${stage}`} role="status"><span />{stageText[stage]}</p>

      <div className="conversation">
        <article><h2>You said</h2><p>{transcript || "Your final transcript will appear here."}</p></article>
        <article><h2>Assistant said</h2><p>{answer || "The AI response will appear here and play through your speakers."}</p></article>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      <p className="note">A short pause makes the browser finalize your sentence automatically.</p>
    </main>
  );
}
