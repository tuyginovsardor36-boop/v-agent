import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".local-agent-data");
const DB_FILE = path.join(DATA_DIR, "state.json");

type State = {
  version: 1;
  projects: Array<{ id: string; name: string; workspace: string; createdAt: string }>;
  sessions: Array<{ id: string; agent: "builder" | "debugger"; prompt: string; status: string; createdAt: string; changedFiles: string[] }>;
  settings: { workspaceRoot: string; groqConfigured: boolean };
};

const initialState: State = { version: 1, projects: [], sessions: [], settings: { workspaceRoot: process.env.AGENT_WORKSPACE_ROOT ?? process.cwd(), groqConfigured: Boolean(process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2) } };

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try { await readFile(DB_FILE, "utf8"); } catch { await atomicWrite(initialState); }
}

async function atomicWrite(state: State) {
  const temp = `${DB_FILE}.tmp`;
  await writeFile(temp, JSON.stringify(state, null, 2), "utf8");
  await rename(temp, DB_FILE);
}

export async function readState(): Promise<State> {
  await ensureStore();
  try {
    const parsed = JSON.parse(await readFile(DB_FILE, "utf8")) as Partial<State>;
    return { ...initialState, ...parsed, version: 1 };
  } catch {
    await atomicWrite(initialState);
    return initialState;
  }
}

export async function saveSession(session: State["sessions"][number]) {
  const state = await readState();
  state.sessions = [session, ...state.sessions].slice(0, 100);
  await atomicWrite(state);
  return session;
}

export type { State };
export { DATA_DIR };

export async function getAgentStatus() {
  const state = await readState();
  return { ...state.settings, projects: state.projects, sessions: state.sessions };
}

export async function setWorkspaceRoot(workspaceRoot: string) {
  const state = await readState();
  state.settings.workspaceRoot = workspaceRoot;
  await atomicWrite(state);
  return state.settings;
}

export async function addProject(project: State["projects"][number]) {
  const state = await readState();
  state.projects = [project, ...state.projects.filter((item) => item.id !== project.id)];
  await atomicWrite(state);
  return project;
}

export async function getWorkspaceRoot() { return (await readState()).settings.workspaceRoot; }
