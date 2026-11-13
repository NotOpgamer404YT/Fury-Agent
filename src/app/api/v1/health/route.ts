import { isDbConfigured } from "@/lib/database";
import { isEncryptionConfigured } from "@/lib/encryption";

export async function GET() {
  return Response.json({
    status: "ok",
    version: "1.0.0",
    database: isDbConfigured() ? "configured" : "not-configured (dev memory store)",
    encryption: isEncryptionConfigured() ? "configured" : "not-configured",
    auth: process.env.AUTH_SECRET ? "configured" : "default-dev-secret",
    github: process.env.GITHUB_CLIENT_ID ? "configured" : "not-configured",
  });
}
