import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const LANGUAGES = [
  { code: "auto", name: "Detect language" },
  { code: "en", name: "English" },
  { code: "af", name: "Afrikaans" },
  { code: "zu", name: "isiZulu" },
  { code: "xh", name: "isiXhosa" },
  { code: "st", name: "Sesotho" },
  { code: "tn", name: "Setswana" },
  { code: "ts", name: "Xitsonga" },
  { code: "nso", name: "Sepedi" },
  { code: "ve", name: "Tshivenda" },
  { code: "nr", name: "isiNdebele" },
  { code: "ss", name: "siSwati" },
  { code: "sw", name: "Swahili" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "tr", name: "Turkish" }
];

function App() {
  const [dark, setDark] = useState(false);
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("en");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("text");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("face-to-face-theme");
    const savedHistory = localStorage.getItem("face-to-face-history");

    if (savedTheme === "dark") {
      setDark(true);
    }

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "face-to-face-theme",
      dark ? "dark" : "light"
    );
  }, [dark]);

  useEffect(() => {
    localStorage.setItem(
      "face-to-face-history",
      JSON.stringify(history)
    );
  }, [history]);

  function notify(message) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 3000);
  }

  async function translateText() {
    const text = input.trim();

    if (!text) {
      notify("Please enter some text first.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = import.meta.env.VITE_TRANSLATE_URL;

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            q: text,
            source,
            target,
            format: "text"
          })
        });

        if (!response.ok) {
          throw new Error("Translation request failed");
        }

        const data = await response.json();

        const translated =
          data.translatedText ||
          data.translation ||
          data.text ||
          "";

        setOutput(translated);

        addToHistory(text, translated);
      } else {
        setOutput(
          "Translation service is not configured yet. Add VITE_TRANSLATE_URL to your environment variables to connect a LibreTranslate-compatible translation API."
        );

        notify("Translation API not configured.");
      }
    } catch (error) {
      console.error(error);

      notify("Translation failed. Please check your translation service.");

      setOutput("");
    } finally {
      setLoading(false);
    }
  }

  function addToHistory(original, translated) {
    const item = {
      id: Date.now(),
      original,
      translated,
      source,
      target,
      createdAt: new Date().toLocaleString()
    };

    setHistory((previous) => [item, ...previous].slice(0, 50));
  }

  function speak(text, language) {
    if (!text) {
      notify("There is no text to speak.");
      return;
    }

    if (!("speechSynthesis" in window)) {
      notify("Speech output is not supported by this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    if (language && language !== "auto") {
      utterance.lang = language;
    }

    window.speechSynthesis.speak(utterance);
  }

  function copyText(text) {
    if (!text) {
      notify("There is nothing to copy.");
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => notify("Copied to clipboard."))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
      notify("Copied to clipboard.");
    } catch {
      notify("Could not copy the text.");
    }

    document.body.removeChild(textarea);
  }

  function swapLanguages() {
    if (source === "auto") {
      notify("Choose a source language before swapping.");
      return;
    }

    const previousSource = source;

    setSource(target);
    setTarget(previousSource);

    const previousInput = input;

    setInput(output);
    setOutput(previousInput);
  }

  function clearAll() {
    setInput("");
    setOutput("");
    notify("Conversation cleared.");
  }

  function clearHistory() {
    setHistory([]);
    notify("History cleared.");
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      notify("Voice input is not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      source === "auto" ? "en-US" : source;

    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      notify("Listening...");
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setInput((previous) =>
        previous
          ? `${previous} ${transcript}`
          : transcript
      );

      notify("Voice captured.");
    };

    recognition.onerror = () => {
      notify("Voice recognition failed.");
    };

    recognition.start();
  }

  function selectPhoto() {
    if (fileRef.current) {
      fileRef.current.click();
    }
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMode("photo");

    notify(
      `Photo selected: ${file.name}. OCR can be connected to your preferred provider.`
    );
  }

  function selectHistory(item) {
    setInput(item.original || "");
    setOutput(item.translated || "");
    setSource(item.source || "auto");
    setTarget(item.target || "en");
    setShowHistory(false);
  }

  const theme = dark ? "dark" : "light";

  return (
    <div className={`app ${theme}`}>
      <style>{`
        :root {
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-width: 320px;
        }

        button,
        textarea,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          min-height: 100vh;
          transition: background 0.25s ease, color 0.25s ease;
        }

        .app.light {
          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(104, 90, 255, 0.12),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 15%,
              rgba(20, 190, 255, 0.10),
              transparent 25%
            ),
            #f6f7fb;
          color: #172033;
        }

        .app.dark {
          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(104, 90, 255, 0.20),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 15%,
              rgba(20, 190, 255, 0.15),
              transparent 25%
            ),
            #0b1020;
          color: #f4f7ff;
        }

        .shell {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 22px 0 50px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          font-size: 24px;
          font-weight: 900;
          color: white;
          background:
            linear-gradient(
              135deg,
              #6f6cff,
              #00b8ff
            );
          box-shadow:
            0 12px 35px rgba(80, 90, 255, 0.30);
        }

        .brand h1 {
          margin: 0;
          font-size: 18px;
          letter-spacing: 0.04em;
        }

        .brand p {
          margin: 3px 0 0;
          font-size: 13px;
          opacity: 0.65;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-button,
        .ghost-button {
          border: 1px solid rgba(120, 130, 160, 0.22);
          background: transparent;
          color: inherit;
          border-radius: 14px;
          min-height: 44px;
          padding: 0 14px;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .icon-button:hover,
        .ghost-button:hover {
          transform: translateY(-1px);
        }

        .app.light .icon-button,
        .app.light .ghost-button,
        .app.light .panel {
          background: rgba(255, 255, 255, 0.76);
        }

        .app.dark .icon-button,
        .app.dark .ghost-button,
        .app.dark .panel {
          background: rgba(18, 26, 48, 0.78);
        }

        .hero {
          text-align: center;
          margin: 35px auto 30px;
          max-width: 760px;
        }

        .hero h2 {
          margin: 0;
          font-size: clamp(32px, 6vw, 58px);
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .hero h2 span {
          background:
            linear-gradient(
              90deg,
              #706cff,
              #00b8ff
            );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero p {
          margin: 18px auto 0;
          max-width: 600px;
          line-height: 1.6;
          opacity: 0.72;
        }

        .mode-switch {
          display: flex;
          gap: 8px;
          width: fit-content;
          margin: 26px auto 0;
          padding: 6px;
          border-radius: 16px;
          border: 1px solid rgba(120, 130, 160, 0.20);
        }

        .mode-switch button {
          border: 0;
          background: transparent;
          color: inherit;
          padding: 10px 16px;
          border-radius: 11px;
        }

        .mode-switch button.active {
          color: white;
          background:
            linear-gradient(
              135deg,
              #6f6cff,
              #00aef0
            );
        }

        .translator-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 16px;
          align-items: stretch;
          margin-top: 30px;
        }

        .panel {
          border: 1px solid rgba(120, 130, 160, 0.20);
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 20px 60px rgba(10, 20, 50, 0.08);
          backdrop-filter: blur(16px);
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom:
            1px solid rgba(120, 130, 160, 0.14);
        }

        .language-select {
          border: 0;
          background: transparent;
          color: inherit;
          font-weight: 700;
          outline: none;
          max-width: 180px;
        }

        .language-select option {
          color: #172033;
        }

        .textarea {
          width: 100%;
          min-height: 300px;
          resize: vertical;
          border: 0;
          outline: none;
          padding: 22px;
          background: transparent;
          color: inherit;
          font-size: 18px;
          line-height: 1.6;
        }

        .textarea::placeholder {
          color: #8c96aa;
        }

        .output {
          min-height: 300px;
          padding: 22px;
          font-size: 18px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .empty-output {
          opacity: 0.45;
        }

        .panel-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-top:
            1px solid rgba(120, 130, 160, 0.14);
        }

        .small-actions {
          display: flex;
          gap: 8px;
        }

        .small-button {
          border: 0;
          background: transparent;
          color: inherit;
          padding: 8px 10px;
          border-radius: 10px;
        }

        .small-button:hover {
          background: rgba(120, 130, 160, 0.12);
        }

        .translate-button {
          width: 64px;
          border: 0;
          border-radius: 22px;
          background:
            linear-gradient(
              135deg,
              #6f6cff,
              #00b8ff
            );
          color: white;
          font-size: 24px;
          font-weight: 900;
          box-shadow:
            0 15px 40px rgba(80, 100, 255, 0.30);
        }

        .translate-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .feature-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 26px;
        }

        .feature {
          padding: 20px;
          border-radius: 20px;
          border: 1px solid rgba(120, 130, 160, 0.18);
        }

        .app.light .feature {
          background: rgba(255, 255, 255, 0.60);
        }

        .app.dark .feature {
          background: rgba(18, 26, 48, 0.55);
        }

        .feature-icon {
          font-size: 24px;
        }

        .feature h3 {
          margin: 14px 0 8px;
          font-size: 16px;
        }

        .feature p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          opacity: 0.65;
        }

        .notice {
          position: fixed;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          z-index: 100;
          padding: 14px 18px;
          border-radius: 14px;
          color: white;
          background: #172033;
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.25);
        }

        .history-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          justify-content: flex-end;
          background: rgba(0, 0, 0, 0.35);
        }

        .history-drawer {
          width: min(430px, 92vw);
          height: 100%;
          padding: 24px;
          overflow-y: auto;
        }

        .app.light .history-drawer {
          background: #ffffff;
          color: #172033;
        }

        .app.dark .history-drawer {
          background: #111a30;
          color: #f4f7ff;
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .history-item {
          width: 100%;
          text-align: left;
          margin-bottom: 12px;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(120, 130, 160, 0.18);
          background: transparent;
          color: inherit;
        }

        .history-item strong,
        .history-item span {
          display: block;
        }

        .history-item span {
          margin-top: 8px;
          opacity: 0.6;
        }

        .history-item small {
          display: block;
          margin-top: 10px;
          opacity: 0.45;
        }

        .photo-area {
          margin-top: 30px;
          padding: 45px 20px;
          text-align: center;
          border:
            2px dashed rgba(110, 120, 180, 0.35);
          border-radius: 24px;
        }

        .photo-area h3 {
          margin: 0 0 10px;
        }

        .photo-area p {
          opacity: 0.65;
        }

        .primary-button {
          border: 0;
          border-radius: 14px;
          padding: 13px 20px;
          color: white;
          background:
            linear-gradient(
              135deg,
              #6f6cff,
              #00b8ff
            );
        }

        .footer {
          margin-top: 34px;
          text-align: center;
          font-size: 13px;
          opacity: 0.55;
        }

        @media (max-width: 850px) {
          .translator-grid {
            grid-template-columns: 1fr;
          }

          .translate-button {
            width: 100%;
            height: 56px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .shell {
            width: min(100% - 20px, 1180px);
          }

          .brand p {
            display: none;
          }

          .top-actions {
            gap: 6px;
          }

          .icon-button {
            padding: 0 10px;
          }

          .hero {
            margin-top: 22px;
          }

          .textarea,
          .output {
            min-height: 240px;
          }
        }
      `}</style>

      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">F</div>

            <div>
              <h1>FACE-TO-FACE</h1>
              <p>Universal communication</p>
            </div>
          </div>

          <div className="top-actions">
            <button
              className="icon-button"
              onClick={() => setShowHistory(true)}
              title="History"
            >
              🕘 History
            </button>

            <button
              className="icon-button"
              onClick={() => setDark(!dark)}
              title="Toggle theme"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <section className="hero">
          <h2>
            Speak. Translate. <span>Connect.</span>
          </h2>

          <p>
            A mobile-first multilingual communication platform
            designed to help people communicate across languages.
          </p>

          <div className="mode-switch">
            <button
              className={mode === "text" ? "active" : ""}
              onClick={() => setMode("text")}
            >
              ⌨️ Text
            </button>

            <button
              className={mode === "voice" ? "active" : ""}
              onClick={() => {
                setMode("voice");
                startListening();
              }}
            >
              🎙️ Voice
            </button>

            <button
              className={mode === "photo" ? "active" : ""}
              onClick={() => {
                setMode("photo");
                selectPhoto();
              }}
            >
              📷 Photo
            </button>
          </div>
        </section>

        {mode === "photo" ? (
          <section className="photo-area">
            <div style={{ fontSize: "48px" }}>📷</div>

            <h3>Photo Translation</h3>

            <p>
              Select an image to prepare it for OCR and translation.
            </p>

            <button
              className="primary-button"
              onClick={selectPhoto}
            >
              Select Photo
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhoto}
            />
          </section>
        ) : (
          <section className="translator-grid">
            <div className="panel">
              <div className="panel-head">
                <select
                  className="language-select"
                  value={source}
                  onChange={(event) =>
                    setSource(event.target.value)
                  }
                >
                  {LANGUAGES.map((language) => (
                    <option
                      key={language.code}
                      value={language.code}
                    >
                      {language.name}
                    </option>
                  ))}
                </select>

                <button
                  className="small-button"
                  onClick={startListening}
                  title="Voice input"
                >
                  🎙️
                </button>
              </div>

              <textarea
                className="textarea"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Type or speak your message..."
              />

              <div className="panel-foot">
                <div className="small-actions">
                  <button
                    className="small-button"
                    onClick={() => speak(input, source)}
                    title="Listen"
                  >
                    🔊
                  </button>

                  <button
                    className="small-button"
                    onClick={() => copyText(input)}
                    title="Copy"
                  >
                    📋
                  </button>
                </div>

                <button
                  className="small-button"
                  onClick={clearAll}
                >
                  Clear
                </button>
              </div>
            </div>

            <button
              className="translate-button"
              onClick={async () => {
                swapLanguages();
              }}
              title="Swap languages"
            >
              ⇄
            </button>

            <div className="panel">
              <div className="panel-head">
                <select
                  className="language-select"
                  value={target}
                  onChange={(event) =>
                    setTarget(event.target.value)
                  }
                >
                  {LANGUAGES.filter(
                    (language) => language.code !== "auto"
                  ).map((language) => (
                    <option
                      key={language.code}
                      value={language.code}
                    >
                      {language.name}
                    </option>
                  ))}
                </select>

                <button
                  className="small-button"
                  onClick={() => speak(output, target)}
                  title="Listen to translation"
                >
                  🔊
                </button>
              </div>

              <div
                className={
                  output
                    ? "output"
                    : "output empty-output"
                }
              >
                {loading
                  ? "Translating..."
                  : output ||
                    "Your translation will appear here."}
              </div>

              <div className="panel-foot">
                <div className="small-actions">
                  <button
                    className="small-button"
                    onClick={() => copyText(output)}
                    title="Copy translation"
                  >
                    📋 Copy
                  </button>

                  <button
                    className="small-button"
                    onClick={() => speak(output, target)}
                    title="Speak translation"
                  >
                    🔊 Listen
                  </button>
                </div>

                <button
                  className="primary-button"
                  onClick={translateText}
                  disabled={loading}
                >
                  {loading ? "Working..." : "Translate"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="feature-grid">
          <div className="feature">
            <div className="feature-icon">🌍</div>
            <h3>150+ Languages Ready</h3>
            <p>
              Built with a configurable translation architecture
              for global communication.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">🎙️</div>
            <h3>Voice Communication</h3>
            <p>
              Uses browser speech recognition and speech synthesis
              where supported.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">📷</div>
            <h3>Photo Workflow</h3>
            <p>
              Ready for connection
