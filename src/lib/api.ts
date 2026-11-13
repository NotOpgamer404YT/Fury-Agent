import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}
export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function unauthorized() {
  return fail("Unauthorized", 401);
}
export function serverError(e: unknown) {
  if (e instanceof ZodError) return fail(e.errors.map((x) => `${x.path.join(".")}: ${x.message}`).join("; "), 422);
  const msg = e instanceof Error ? e.message : "Internal error";
  if (msg === "Unauthorized") return unauthorized();
  // Never leak secrets — strip anything that looks like a token
  return fail(msg.replace(/(sk-|ghp_|Bearer\s+)[A-Za-z0-9_\-]+/g, "$1***").slice(0, 500), 400);
}
