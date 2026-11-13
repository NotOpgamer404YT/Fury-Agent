import { getSessionUser, deleteUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return ok({ user });
}

export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    await deleteUser(user.id);
    await destroySession();
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
