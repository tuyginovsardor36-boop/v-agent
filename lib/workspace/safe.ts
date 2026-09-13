import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { getWorkspaceRoot } from "@/lib/local-store";

const execFileAsync = promisify(execFile);
const MAX_OUTPUT = 12000;
const ALLOWED = new Set(["pnpm", "npm", "yarn", "node", "npx", "python", "python3", "pip", "pip3", "git", "tsc"]);

export async function resolveSafePath(relativePath: string) {
  const root = path.resolve(await getWorkspaceRoot());
  const target = path.resolve(root, relativePath || ".");
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error("Path is outside the configured workspace");
  return { root, target, relative: path.relative(root, target) || "." };
}

export async function listWorkspace(relativePath = ".") {
  const { target } = await resolveSafePath(relativePath);
  const entries = await fs.readdir(target, { withFileTypes: true });
  return entries.filter((entry) => !entry.name.startsWith(".git") && entry.name !== "node_modules").map((entry) => ({ name: entry.name, type: entry.isDirectory() ? "directory" : "file" }));
}

export async function readWorkspaceFile(relativePath: string) {
  const { target } = await resolveSafePath(relativePath);
  const stat = await fs.stat(target);
  if (!stat.isFile() || stat.size > 500_000) throw new Error("Only files up to 500KB can be read");
  return fs.readFile(target, "utf8");
}

export async function writeWorkspaceFile(relativePath: string, content: string) {
  const { target } = await resolveSafePath(relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, "utf8");
  return relativePath;
}

export async function runWorkspaceCommand(command: string, args: string[] = []) {
  const executable = command.trim().split(/\s+/)[0];
  if (!ALLOWED.has(executable) || args.some((arg) => /[;&|`$<>]/.test(arg))) throw new Error("Command is not allowed");
  const cwd = await getWorkspaceRoot();
  try {
    const result = await execFileAsync(executable, args, { cwd, timeout: 45_000, maxBuffer: MAX_OUTPUT * 2, shell: false, env: { ...process.env, CI: "1" } });
    return { ok: true, output: `${result.stdout}${result.stderr}`.slice(-MAX_OUTPUT) };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, output: `${failure.stdout ?? ""}${failure.stderr ?? failure.message ?? "Command failed"}`.slice(-MAX_OUTPUT) };
  }
}
