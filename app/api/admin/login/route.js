import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "../../../../lib/checkAdmin";

export async function POST(req) {
  const { password } = await req.json();
  if (password && password === process.env.ADMIN_PASSWORD) {
    cookies().set(ADMIN_COOKIE_NAME, "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: "Wrong password" }, { status: 401 });
}
