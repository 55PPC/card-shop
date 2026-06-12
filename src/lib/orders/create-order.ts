import { InventoryStatus, OrderStatus, Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "../db";
import { hashPassword } from "../auth/password";
import { generateOrderNo } from "./order-number";

export type CreateOrderInput = {
  productId: string;
  quantity: number;
  email: string;
  queryPassword: string;
  couponCode?: string | null;
};

export async function createOrder(input: CreateOrderInput) {
  return createOrderWithClient(prisma, input);
}

export async function createOrderWithClient(client: PrismaClient, input: CreateOrderInput) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantity must be positive");
  }

  return client.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: input.productId }
    });

    if (!product || !product.enabled) {
      throw new Error("Product is unavailable");
    }

    const availableInventory = await tx.inventoryItem.findMany({
      where: {
        productId: product.id,
        status: InventoryStatus.AVAILABLE
      },
      orderBy: { createdAt: "asc" },
      take: input.quantity,
      select: { id: true }
    });

    if (availableInventory.length < input.quantity) {
      throw new Error("Insufficient inventory");
    }

    const subtotal = new Prisma.Decimal(product.price).mul(input.quantity);
    const discountTotal = new Prisma.Decimal(0);
    const total = subtotal.sub(discountTotal);
    const queryPasswordHash = await hashPassword(input.queryPassword);

    const order = await tx.order.create({
      data: {
        orderNo: generateOrderNo(),
        email: input.email,
        queryPasswordHash,
        status: OrderStatus.PENDING,
        subtotal,
        discountTotal,
        total,
        couponCode: input.couponCode,
        items: {
          create: {
            productId: product.id,
            productTitle: product.title,
            unitPrice: product.price,
            quantity: input.quantity,
            total
          }
        }
      },
      include: {
        items: true
      }
    });

    const lockedInventory = await tx.inventoryItem.updateMany({
      where: {
        id: { in: availableInventory.map((item) => item.id) },
        status: InventoryStatus.AVAILABLE
      },
      data: {
        status: InventoryStatus.LOCKED,
        orderId: order.id,
        lockedAt: new Date()
      }
    });

    if (lockedInventory.count !== input.quantity) {
      throw new Error("Insufficient inventory");
    }

    await syncProductStock(tx, product.id);

    return order;
  });
}

async function syncProductStock(
  tx: Pick<PrismaClient, "inventoryItem" | "product">,
  productId: string
) {
  const availableCount = await tx.inventoryItem.count({
    where: {
      productId,
      status: InventoryStatus.AVAILABLE
    }
  });

  await tx.product.update({
    where: { id: productId },
    data: { stock: availableCount }
  });
}
