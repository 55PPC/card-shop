import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin-api";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    categoryId?: string;
    title?: string;
    slug?: string;
    description?: string | null;
    price?: string | number;
    originalPrice?: string | number | null;
    icon?: string | null;
    sort?: number;
    enabled?: boolean;
  };

  if (!body.categoryId || !body.title || !body.slug || body.price === undefined) {
    return NextResponse.json({ error: "Category, title, slug, and price are required" }, { status: 400 });
  }

  const product = body.id
    ? await prisma.product.update({
        where: { id: body.id },
        data: productData(body)
      })
    : await prisma.product.create({
        data: {
          ...productData(body),
          stock: 0
        }
      });

  return NextResponse.json({ product });
}

function productData(body: {
  categoryId?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  price?: string | number;
  originalPrice?: string | number | null;
  icon?: string | null;
  sort?: number;
  enabled?: boolean;
}) {
  return {
    categoryId: body.categoryId as string,
    title: body.title as string,
    slug: body.slug as string,
    description: body.description ?? null,
    price: String(body.price),
    originalPrice: body.originalPrice ? String(body.originalPrice) : null,
    icon: body.icon ?? "sparkles",
    sort: Number(body.sort ?? 0),
    enabled: body.enabled ?? true
  };
}
