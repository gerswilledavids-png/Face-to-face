import React,{useEffect,useMemo,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import"./styles.css";

const LANGUAGES=[["en-US","English"],["af-ZA","Afrikaans"],["zu-ZA","isiZulu"],["xh-ZA","isiXhosa"],["st-ZA","Sesotho"],["tn-ZA","Setswana"],["sw-KE","Swahili"],["fr-FR","French"],["es-ES","Spanish"],["pt-PT","Portuguese"],["de-DE","German"],["ar-SA","Arabic"],["hi-IN","Hindi"],["zh-CN","Chinese"],["ja-JP","Japanese"]];
const nameOf=c=>LANGUAGES.find(x=>x[0]===c)?.[1]||c;

function App(){
 const[source,setSource]=useState("en-US"),[target,setTarget]=useState("af-ZA");
 const[input,setInput]=useState(""),[output,setOutput]=useState("");
 const[dark,setDark]=useState(true),[status,setStatus]=useState("Ready");
 const[history,setHistory]=useState([]),[showHistory,setShowHistory]=useState(false);
 const[busy,setBusy]=useState(false),[photo,setPhoto]=useState("");
 const fileRef=useRef(null);
 const sourceName=useMemo(()=>nameOf(source),[source]);
 const targetName=useMemo(()=>nameOf(target),[target]);
 useEffect(()=>{document.body.dataset.theme=dark?"dark":"light"},[dark]);
 const notify=m=>{setStatus(m);setTimeout(()=>setStatus("Ready"),2500)};
 async function translate(){
  const text=input.trim(); if(!text){notify("Enter text first.");return}
  setBusy(true);setStatus("Translating...");
  const endpoint=import.meta.env.VITE_TRANSLATE_URL;
  let result="";
  try{
   if(endpoint){const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:text,source:source.split("-")[0],target:target.split("-")[0],format:"text"})});if(!r.ok)throw new Error("Translation service unavailable");const d=await r.json();result=d.translatedText||text}
   else{result=`[${targetName}] ${text}`;notify("Demo mode: add VITE_TRANSLATE_URL for live translation.")}
   setOutput(result);setHistory(h=>[{id:Date.now(),source,target,input:text,output:result},...h].slice(0,20));
  }catch(e){setOutput("");notify(e.message||"Translation failed.")}finally{setBusy(false);if(endpoint)setStatus("Translation complete.")}
 }
 function speak(text,lang){if(!text){notify("Nothing to speak.");return}if(!("speechSynthesis"in window)){notify("Speech is not supported by this browser.");return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;speechSynthesis.speak(u)}
 function voice(){const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){notify("Voice input is not supported by this browser.");return}const r=new R();r.lang=source;r.interimResults=false;r.onstart=()=>setStatus("Listening...");r.onresult=e=>setInput(v=>v?(v+" "+e.results[0][0].transcript):e.results[0][0].transcript);r.onerror=()=>notify("Voice input failed.");r.onend=()=>setStatus("Ready");r.start()}
 async function copy(){if(!output){notify("Nothing to copy.");return}try{await navigator.clipboard.writeText(output);notify("Translation copied.")}catch{notify("Copy failed.")}}
 function swap(){const a=source,b=target,x=input,y=output;setSource(b);setTarget(a);setInput(y);setOutput(x);notify("Languages swapped.")}
 return <main className="app">
  <header className="topbar"><div className="brand"><div className="mark">F2F</div><div><strong>FACE-TO-FACE</strong><span>Universal communication</span></div></div><div className="actions"><button className="ghost" onClick={()=>setShowHistory(v=>!v)} title="History">◷</button><button className="ghost" onClick={()=>setDark(v=>!v)} title="Theme">{dark?"☀":"☾"}</button></div></header>
  <section className="hero"><div><p className="eyebrow">MULTILINGUAL TRANSLATOR</p><h1>Speak. Translate. Connect.</h1><p className="subtitle">A mobile-first communication workspace with text, voice, speech and photo-ready workflows.</p></div><div className="status">{status}</div></section>
  <section className="card">
   <div className="languages"><label><span>FROM</span><select value={source} onChange={e=>setSource(e.target.value)}>{LANGUAGES.map(([c,n])=><option key={c} value={c}>{n}</option>)}</select></label><button className="swap" onClick={swap}>⇄</button><label><span>TO</span><select value={target} onChange={e=>setTarget(e.target.value)}>{LANGUAGES.map(([c,n])=><option key={c} value={c}>{n}</option>)}</select></label></div>
   <div className="workspace">
    <div className="panel"><div className="panelHead"><b>{sourceName}</b><button className="mini" onClick={()=>setInput("")}>Clear</button></div><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Type or speak your message..."/><div className="buttons"><button className="secondary" onClick={voice}>🎙 Voice</button><button className="secondary" onClick={()=>speak(input,source)}>🔊 Listen</button><button className="primary" disabled={busy} onClick={translate}>{busy?"Translating...":"Translate"}</button></div></div>
    <div className="panel"><div className="panelHead"><b>{targetName}</b><button className="mini" onClick={copy}>Copy</button></div><div className="output">{output||<span className="placeholder">Your translation will appear here.</span>}</div><div className="buttons"><button className="secondary" onClick={()=>speak(output,target)}>🔊 Speak</button><button className="secondary" onClick={copy}>⧉ Copy</button><button className="secondary" onClick={()=>{setInput("");setOutput("");setPhoto("");notify("Cleared.")}}>⌫ Clear all</button></div></div>
   </div>
   <div className="tools"><input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f){setPhoto(f.name);notify(`Photo selected: ${f.name}`)}}}/><button className="tool" onClick={()=>fileRef.current?.click()}>📷 {photo||"Choose photo"}</button><span>OCR can be connected to your preferred provider.</span></div>
  </section>
  {showHistory&&<section className="history"><div className="panelHead"><h2>Recent conversations</h2><button className="mini" onClick={()=>setHistory([])}>Clear history</button></div>{history.length===0?<p className="placeholder">No translations yet.</p>:history.map(i=><article key={i.id}><small>{nameOf(i.source)} → {nameOf(i.target)}</small><p>{i.input}</p></article>)}</section>}
  <footer><span>FACE-TO-FACE</span><span>Text • Voice • Speech • Photo-ready</span></footer>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
