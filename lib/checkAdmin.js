import { cookies } from "next/headers";

const COOKIE_NAME = "k2194_admin";

export function isAdmin() {
  const c = cookies().get(COOKIE_NAME);
  return c?.value === "true";
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
