import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const LANGUAGES = [
  ["English","en"],["Afrikaans","af"],["Zulu","zu"],["Xhosa","xh"],["Southern Sotho","st"],
  ["Tswana","tn"],["Northern Sotho","nso"],["Swati","ss"],["Venda","ve"],["Tsonga","ts"],
  ["Swahili","sw"],["Arabic","ar"],["Amharic","am"],["Somali","so"],["French","fr"],
  ["Spanish","es"],["Portuguese","pt"],["German","de"],["Italian","it"],["Dutch","nl"],
  ["Russian","ru"],["Ukrainian","uk"],["Polish","pl"],["Chinese","zh"],["Japanese","ja"],
  ["Korean","ko"],["Hindi","hi"],["Urdu","ur"],["Bengali","bn"],["Tamil","ta"],
  ["Telugu","te"],["Gujarati","gu"],["Marathi","mr"],["Kannada","kn"],["Malayalam","ml"],
  ["Punjabi","pa"],["Turkish","tr"],["Persian","fa"],["Greek","el"],["Hebrew","he"],
  ["Indonesian","id"],["Malay","ms"],["Vietnamese","vi"],["Thai","th"],["Filipino","tl"],
  ["Romanian","ro"],["Hungarian","hu"],["Czech","cs"],["Danish","da"],["Finnish","fi"],
  ["Norwegian","no"],["Swedish","sv"],["Yoruba","yo"],["Igbo","ig"],["Hausa","ha"]
];

const icons = {
  text: "⌨",
  voice: "🎙",
  photo: "◉",
  history: "◷",
  settings: "⚙",
  copy: "⧉",
  speak: "🔊",
  swap: "⇄",
  send: "➜",
  camera: "📷",
  moon: "☾",
  sun: "☀"
};

function SelectLanguage({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {LANGUAGES.map(([name, code]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
}

function App() {
  const [mode, setMode] = useState("text");
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("zu");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dark, setDark] = useState(true);
  const [toast, setToast] = useState("");

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ftf-history") || "[]");
    } catch {
      return [];
    }
  });

  const [showHistory, setShowHistory] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ftf-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    document.body.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  const sourceName = useMemo(
    () => LANGUAGES.find((x) => x[1] === source)?.[0] || source,
    [source]
  );

  const targetName = useMemo(
    () => LANGUAGES.find((x) => x[1] === target)?.[0] || target,
    [target]
  );

  const notify = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2600);
  };

  async function translate() {
    if (!input.trim()) {
      return notify("Enter or speak something first.");
    }

    setBusy(true);

    try {
      const endpoint =
        import.meta.env.VITE_TRANSLATE_URL ||
        "https://libretranslate.com/translate";

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          q: input,
          source,
          target,
          format: "text"
        })
      });

      const data = await response.json();

      if (!response.ok || !data.translatedText) {
        throw new Error(
          data.error || "Translation unavailable"
        );
      }

      setOutput(data.translatedText);

      setHistory((h) => [
        {
          id: Date.now(),
          input,
          output: data.translatedText,
          source,
          target,
          time: new Date().toLocaleString()
        },
        ...h
      ].slice(0, 50));

    } catch (error) {

      setOutput(
        "Translation service is not available. Add your own LibreTranslate-compatible endpoint to VITE_TRANSLATE_URL in a .env file."
      );

      notify("Translation endpoint unavailable.");

    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      return notify(
        "Speech recognition is not supported by this browser."
      );
    }

    const recognition = new Recognition();

    recognition.lang = source;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (e) => {
      let words = "";

      for (
        let i = e.resultIndex;
        i < e.results.length;
        i++
      ) {
        words += e.results[i][0].transcript;
      }

      setInput(words);
    };

    recognition.onerror = () =>
      notify("Microphone recognition could not start.");

    recognition.start();

    notify("Listening...");
  }

  function speak() {
    if (!output) return;

    if (!("speechSynthesis" in window)) {
      return notify(
        "Speech output is not supported by this browser."
      );
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(output);

    utterance.lang = target;

    speechSynthesis.speak(utterance);
  }

  function copy() {
    if (!output) return;

    navigator.clipboard?.writeText(output);

    notify("Translation copied.");
  }

  function swap() {
    setSource(target);
    setTarget(source);

    setInput(output);
    setOutput(input);
  }

  function selectPhoto(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    notify(
      "Photo selected. OCR can be connected to your preferred provider."
    );

    setMode("text");

    setInput(`Photo selected: ${file.name}`);
  }

  return (
    <div className="app">

      <header className="topbar">

        <div className="brand">

          <div className="brand-mark">
            F↔F
          </div>

          <div>
            <strong>FACE-TO-FACE</strong>

            <span>
              Universal communication
            </span>
          </div>

        </div>

        <div className="top-actions">

          <button
            className="ghost"
            onClick={() => setShowHistory(!showHistory)}
            title="History"
          >
            {icons.history}
          </button>

          <button
            className="ghost"
            onClick={() => setDark(!dark)}
            title="
