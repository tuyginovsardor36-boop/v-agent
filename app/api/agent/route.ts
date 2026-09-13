import { NextResponse } from "next/server";
import { z } from "zod";
import { addProject, getAgentStatus, getWorkspaceRoot, saveSession, setWorkspaceRoot } from "@/lib/local-store";
import { listWorkspace, readWorkspaceFile, runWorkspaceCommand, writeWorkspaceFile } from "@/lib/workspace/safe";

const requestSchema = z.object({ action: z.enum(["chat", "status", "set-secret", "set-workspace", "list", "read", "write", "run"]), agent: z.enum(["builder", "debugger"]).optional(), prompt: z.string().max(12000).optional(), path: z.string().max(300).optional(), content: z.string().max(500_000).optional(), command: z.string().max(100).optional(), args: z.array(z.string().max(200)).max(10).optional(), secret: z.string().max(500).optional(), workspaceRoot: z.string().max(500).optional() });

function textStream(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({ start(controller) { controller.enqueue(encoder.encode(text)); controller.close(); } });
}

async function groq(messages: Array<{ role: string; content: string }>) {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;
  if (!apiKey) throw new Error("Groq key topilmadi. .env.local ichida GROQ_API_KEY=gsk_... ko‘rinishida saqlang; process.env... ni qiymat sifatida yozmang.");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile", messages, temperature: 0.15, max_tokens: 1800 }) });
  if (!response.ok) throw new Error(`Groq API xatosi: ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "Javob olinmadi.";
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    if (body.action === "status") return NextResponse.json(await getAgentStatus());
    if (body.action === "set-secret") {
      return NextResponse.json({ configured: Boolean(body.secret), note: "Secret faqat process environment uchun qabul qilinadi. Uni .env.local fayliga qo‘shing va serverni qayta ishga tushiring." });
    }
    if (body.action === "set-workspace") return NextResponse.json(await setWorkspaceRoot(body.workspaceRoot ?? process.cwd()));
    if (body.action === "list") return NextResponse.json({ entries: await listWorkspace(body.path) });
    if (body.action === "read") return NextResponse.json({ content: await readWorkspaceFile(body.path ?? "") });
    if (body.action === "write") return NextResponse.json({ path: await writeWorkspaceFile(body.path ?? "", body.content ?? "") });
    if (body.action === "run") return NextResponse.json(await runWorkspaceCommand(body.command ?? "", body.args ?? []));
    if (body.action === "chat") {
      const agent = body.agent ?? "builder";
      const prompt = body.prompt?.trim() ?? "";
      if (!prompt) return NextResponse.json({ error: "Prompt kerak" }, { status: 400 });
      const root = await getWorkspaceRoot();
      const context = agent === "builder" ? "Sen Full-stack Builder agentsan. Next.js frontend/backend kodini rejalashtir, aniq fayllar va xavfsiz buyruqlarni tavsiya qil." : "Sen Autonomous Debugger agentsan. Xatoni tahlil qil, reproduksiya, test va tuzatish qadamlarini aniq ko‘rsat.";
      const answer = await groq([{ role: "system", content: `${context} Workspace: ${root}. Secretlarni hech qachon qaytarmagin. Javobni o‘zbek tilida ber. Avval qisqa reja, keyin bajarilgan ishlar va tekshiruvlar.` }, { role: "user", content: prompt }]);
      const session = { id: crypto.randomUUID(), agent, prompt, status: "completed", createdAt: new Date().toISOString(), changedFiles: [] as string[] };
      await saveSession(session);
      await addProject({ id: root, name: root.split(/[\\/]/).pop() || "Local project", workspace: root, createdAt: new Date().toISOString() });
      return new Response(textStream(answer), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Server xatosi" }, { status: 400 }); }
}
