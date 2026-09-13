"use client";

import { useEffect, useState } from "react";
import { Bot, Bug, CheckCircle2, ChevronRight, Command, FolderGit2, KeyRound, Loader2, Play, RotateCcw, ShieldCheck, Terminal, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Agent = "builder" | "debugger";
type Session = { id: string; agent: Agent; prompt: string; status: string; createdAt: string };

const agentInfo = {
  builder: { label: "Full-stack Builder", description: "Frontend, backend va ishga tushirish", icon: Wrench, accent: "bg-amber-400", sample: "Next.js loyiham uchun login sahifasi va API route yarat" },
  debugger: { label: "Autonomous Debugger", description: "Xatoni topadi, tekshiradi va tuzatadi", icon: Bug, accent: "bg-cyan-400", sample: "npm run typecheck xatosini tahlil qil va tuzatish rejasini ber" },
};

export function AgentsClient() {
  const [agent, setAgent] = useState<Agent>("builder");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [workspace, setWorkspace] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("Tekshirilmoqda");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadStatus() {
    const response = await fetch("/api/agent", { method: "POST", body: JSON.stringify({ action: "status" }) });
    if (!response.ok) return;
    const data = await response.json();
    setSessions(data.sessions ?? []);
    setWorkspace(data.workspaceRoot ?? "");
    setStatus(data.groqConfigured ? "Groq tayyor" : "Groq key kutilmoqda");
  }
  useEffect(() => { void loadStatus(); }, []);

  async function submit() {
    if (!prompt.trim() || busy) return;
    setBusy(true); setAnswer(""); setNotice("");
    try {
      const response = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "chat", agent, prompt }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? "Xato"); }
      const text = await response.text(); setAnswer(text); setPrompt(""); await loadStatus();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Agent xatosi"); }
    finally { setBusy(false); }
  }

  async function saveSecret() {
    setNotice("Bu panel secretni saqlamaydi. .env.local fayliga GROQ_API_KEY=gsk_... yozing (process.env... emas), keyin Next.js serverni restart qiling.");
    setSecret("");
  }

  const current = agentInfo[agent]; const Icon = current.icon;
  return <main className="min-h-screen bg-[#0b0e11] text-[#f4f1ea] selection:bg-amber-300 selection:text-black">
    <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 py-6 md:px-10">
      <header className="flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-amber-300 text-black"><Bot /></div><div><p className="font-mono text-xs uppercase tracking-[0.3em] text-white/45">v0.diy / local lab</p><h1 className="text-lg font-semibold tracking-tight">Agent Workshop</h1></div></div>
        <div className="flex items-center gap-3"><Badge variant="outline" className="border-white/15 bg-white/5 text-white/70"><span className={`mr-2 size-2 rounded-full ${status === "Groq tayyor" ? "bg-emerald-400" : "bg-amber-300"}`} />{status}</Badge><Button variant="ghost" size="icon" className="text-white/60 hover:bg-white/10 hover:text-white" onClick={() => void loadStatus()} aria-label="Refresh"><RotateCcw /></Button></div>
      </header>
      <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        <aside className="flex flex-col gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/35">01 / choose agent</p>
          {(Object.keys(agentInfo) as Agent[]).map((key) => { const item = agentInfo[key]; const ItemIcon = item.icon; return <button key={key} type="button" onClick={() => setAgent(key)} className={`group rounded-2xl border p-4 text-left transition ${agent === key ? "border-amber-300/60 bg-white/[0.08]" : "border-white/10 bg-white/[0.025] hover:border-white/25"}`}><div className="mb-7 flex items-start justify-between"><div className={`grid size-9 place-items-center rounded-lg ${item.accent} text-black`}><ItemIcon /></div>{agent === key && <ChevronRight className="text-amber-300" />}</div><p className="font-medium">{item.label}</p><p className="mt-1 text-sm text-white/45">{item.description}</p></button> })}
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="mb-3 flex items-center gap-2 text-sm"><ShieldCheck className="text-emerald-400" /> Safe local execution</div><p className="text-xs leading-5 text-white/40">Fayllar faqat workspace ichida. Buyruqlar allowlist va timeout bilan ishlaydi.</p></div>
        </aside>
        <section className="flex min-h-[620px] flex-col rounded-3xl border border-white/10 bg-[#11161b] shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div><p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/35">02 / mission control</p><h2 className="mt-1 text-2xl font-semibold">{current.label}</h2></div><div className="flex items-center gap-2 text-xs text-white/35"><Terminal /> auto mode</div></div>
          <div className="flex-1 overflow-y-auto p-6">{!answer && !busy && <div className="grid h-full place-items-center text-center"><div className="max-w-md"><div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-amber-300"><Icon size={28} /></div><h3 className="text-xl font-medium">Ishni topshiring</h3><p className="mt-2 text-sm leading-6 text-white/45">{current.sample}. Agent reja tuzadi va natijani shu yerda qaytaradi.</p></div></div>}{busy && <div className="flex items-center gap-3 text-sm text-white/55"><Loader2 className="animate-spin text-amber-300" /> Groq javobi va ish jarayoni tayyorlanmoqda...</div>}{answer && <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/80">{answer}</div>}{notice && <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">{notice}</div>}</div>
          <div className="border-t border-white/10 p-4"><Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void submit(); }} placeholder={`${current.sample} ...`} className="min-h-24 resize-none border-white/10 bg-black/20 text-white placeholder:text-white/25" /><div className="mt-3 flex items-center justify-between"><p className="text-xs text-white/30">Ctrl / Cmd + Enter — yuborish</p><Button onClick={() => void submit()} disabled={busy || !prompt.trim()} className="bg-amber-300 text-black hover:bg-amber-200"><Play data-icon="inline-start" /> Run agent</Button></div></div>
        </section>
        <aside className="flex flex-col gap-4"><p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/35">03 / local state</p><Card className="border-white/10 bg-white/[0.025] text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderGit2 /> Workspace</CardTitle><CardDescription className="text-white/40">JSON sessions va projects shu mashinada saqlanadi.</CardDescription></CardHeader><CardContent><p className="break-all font-mono text-xs text-white/55">{workspace || "Loading..."}</p></CardContent></Card><Card className="border-white/10 bg-white/[0.025] text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound /> Groq secret</CardTitle><CardDescription className="text-white/40">Key hech qachon JSON yoki browserga yozilmaydi.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><Input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="gsk_..." className="border-white/10 bg-black/20" /><Button variant="outline" onClick={saveSecret} disabled={!secret} className="border-white/15 text-white hover:bg-white/10">Qabul qilish</Button></CardContent></Card><Card className="flex-1 border-white/10 bg-white/[0.025] text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Command /> Recent sessions</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">{sessions.length === 0 && <p className="text-sm text-white/35">Hali session yo‘q.</p>}{sessions.slice(0, 5).map((item) => <div key={item.id} className="border-l border-amber-300/40 pl-3"><p className="truncate text-sm">{item.prompt}</p><p className="mt-1 text-xs text-white/35">{item.agent} · <CheckCircle2 className="inline size-3 text-emerald-400" /> {item.status}</p></div>)}</CardContent></Card></aside>
      </div>
    </div>
  </main>;
}
