import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validation";
import { registerUser, createSession } from "@/lib/auth";
import { ok, serverError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "register"), 10, 60_000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  try {
    const body = registerSchema.parse(await req.json());
    const user = await registerUser(body.name, body.email.toLowerCase(), body.password);
    await createSession(user.id, req.headers.get("user-agent") ?? undefined);
    return ok({ user });
  } catch (e) {
    return serverError(e);
  }
}
