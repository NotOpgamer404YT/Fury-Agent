/**
 * Runtime environment status.
 *
 * Fury Agent is self-hosted: every deployment brings its own database,
 * secrets and OAuth app. When one of those is missing the app must say so
 * plainly instead of pretending to work, so we compute a small, serialisable
 * status here and render it in the dashboard shell.
 *
 * Never put secret *values* in this module — only booleans.
 */

export type EnvStatus = {
  database: boolean;
  authSecret: boolean;
  encryption: boolean;
  github: boolean;
};

export function envStatus(): EnvStatus {
  return {
    database: Boolean(process.env.DATABASE_URL),
    authSecret: Boolean(process.env.AUTH_SECRET),
    encryption: Boolean(process.env.ENCRYPTION_KEY),
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  };
}

export type EnvWarning = { key: keyof EnvStatus; message: string; href: string };

/**
 * Warnings worth interrupting the user for. GitHub and providers are optional
 * by design (you add them when you need them), so only the two settings that
 * break persistence and key storage are surfaced.
 */
export function envWarnings(status: EnvStatus = envStatus()): EnvWarning[] {
  const warnings: EnvWarning[] = [];
  if (!status.database) {
    warnings.push({
      key: "database",
      message:
        "DATABASE_URL is not set. Accounts, tasks and checkpoints live in process memory and are lost when the function restarts or redeploys.",
      href: "/docs/deployment",
    });
  }
  if (!status.authSecret) {
    warnings.push({
      key: "authSecret",
      message:
        "AUTH_SECRET is not set. In production, sign-in is refused rather than signing sessions with the public development key.",
      href: "/docs/configuration",
    });
  }
  if (!status.encryption) {
    warnings.push({
      key: "encryption",
      message: "ENCRYPTION_KEY is not set. Provider API keys cannot be encrypted at rest, so adding a provider will fail.",
      href: "/docs/providers",
    });
  }
  return warnings;
}
