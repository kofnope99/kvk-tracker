import { cookies } from "next/headers";
export async function POST() {
  cookies().delete("admin_session");
  return Response.json({ ok: true });
}
