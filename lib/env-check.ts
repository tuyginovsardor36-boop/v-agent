export interface MissingEnvVar {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export function checkRequiredEnvVars(): MissingEnvVar[] {
  return [];
}

export function hasAllRequiredEnvVars(): boolean {
  return true;
}

export const hasEnvVars = true;
