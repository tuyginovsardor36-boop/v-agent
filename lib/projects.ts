import "server-only";

import { auth } from "@/app/(auth)/auth";
import { getUserV0Client } from "@/lib/v0-client";

export interface Project {
  id: string;
  name: string;
  demoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface V0Chat {
  id: string;
  name?: string;
  demo?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{ role: string; content: string }>;
}

function getProjectName(chat: V0Chat): string {
  if (chat.name) {
    return chat.name;
  }
  const firstUserMessage = chat.messages?.find((msg) => msg.role === "user");
  return firstUserMessage?.content?.slice(0, 50) || "Untitled Project";
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  // Database removed, returning empty list
  return [];
}
