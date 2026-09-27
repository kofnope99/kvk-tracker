import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "../../../../lib/checkAdmin";

export async function POST() {
  cookies().set(ADMIN_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return Response.json({ ok: true });
}
