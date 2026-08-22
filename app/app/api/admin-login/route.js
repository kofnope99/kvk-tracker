import { cookies } from "next/headers";

export async function POST(req) {
  const { password } = await req.json();
  if (password && password === process.env.ADMIN_PASSWORD) {
    cookies().set("admin_session", process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: "Wrong password" }, { status: 401 });
}
