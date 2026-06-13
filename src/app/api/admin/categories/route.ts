import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin-api";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }]
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    sort?: number;
    enabled?: boolean;
  };

  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const category = body.id
    ? await prisma.category.update({
        where: { id: body.id },
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description ?? null,
          sort: Number(body.sort ?? 0),
          enabled: Boolean(body.enabled)
        }
      })
    : await prisma.category.create({
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description ?? null,
          sort: Number(body.sort ?? 0),
          enabled: body.enabled ?? true
        }
      });

  return NextResponse.json({ category });
}
