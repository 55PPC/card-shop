import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return {
    admin,
    response: null
  };
}
