import { cookies } from "next/headers";

export function isAdmin() {
  const session = cookies().get("admin_session")?.value;
  return Boolean(session && session === process.env.ADMIN_PASSWORD);
}
