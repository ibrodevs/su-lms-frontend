export function parseFeatureFlag(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

export const featureFlags = {
  passwordRecovery: parseFeatureFlag(import.meta.env.VITE_ENABLE_PASSWORD_RECOVERY),
} as const;
