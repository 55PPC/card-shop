import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { adminLoginSchema } from "@/lib/validation";
import { createAdminSessionToken, setAdminSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const parsed = adminLoginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login request" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email }
  });

  if (!admin || !admin.enabled || !(await verifyPassword(parsed.data.password, admin.passwordHash))) {
    return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  });

  const response = NextResponse.json({
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name
    }
  });

  setAdminSessionCookie(
    response,
    createAdminSessionToken({
      adminId: admin.id,
      email: admin.email
    })
  );

  return response;
}
