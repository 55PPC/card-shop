import { InventoryStatus, OrderStatus, Prisma } from "@prisma/client";
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
  return createOrderWithClient(prisma as unknown as OrderTransactionRunner, input);
}

type OrderTransactionClient = {
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql): Promise<T>;
  product: {
    findUnique(args: { where: { id: string } }): Promise<{
      id: string;
      enabled: boolean;
      title: string;
      price: Prisma.Decimal | string | number;
    } | null>;
    update(args: { where: { id: string }; data: { stock: number } }): Promise<unknown>;
  };
  order: {
    create(args: {
      data: {
        orderNo: string;
        email: string;
        queryPasswordHash: string;
        status: OrderStatus;
        subtotal: Prisma.Decimal;
        discountTotal: Prisma.Decimal;
        total: Prisma.Decimal;
        couponCode?: string | null;
        items: {
          create: {
            productId: string;
            productTitle: string;
            unitPrice: Prisma.Decimal | string | number;
            quantity: number;
            total: Prisma.Decimal;
          };
        };
      };
      include: { items: true };
    }): Promise<{
      id: string;
      orderNo: string;
      items: Array<{ productId: string; productTitle: string; quantity: number }>;
    }>;
  };
  inventoryItem: {
    count(args: { where: { productId: string; status: InventoryStatus } }): Promise<number>;
  };
};

type OrderTransactionRunner<TTx extends OrderTransactionClient = OrderTransactionClient> = {
  $transaction<T>(callback: (tx: TTx) => Promise<T>): Promise<T>;
};

type ClaimedInventoryRow = {
  id: string;
};

export async function createOrderWithClient<TTx extends OrderTransactionClient>(
  client: OrderTransactionRunner<TTx>,
  input: CreateOrderInput
) {
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

    const lockedAt = new Date();
    const lockedInventory = await claimInventory(tx, {
      productId: product.id,
      orderId: order.id,
      quantity: input.quantity,
      lockedAt
    });

    if (lockedInventory.length !== input.quantity) {
      throw new Error("Insufficient inventory");
    }

    await syncProductStock(tx, product.id);

    return order;
  });
}

async function claimInventory(
  tx: OrderTransactionClient,
  input: {
    productId: string;
    orderId: string;
    quantity: number;
    lockedAt: Date;
  }
) {
  return tx.$queryRaw<ClaimedInventoryRow[]>(Prisma.sql`
    WITH picked AS (
      SELECT "id"
      FROM "InventoryItem"
      WHERE "productId" = ${input.productId}
        AND "status" = ${InventoryStatus.AVAILABLE}::"InventoryStatus"
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${input.quantity}
    )
    UPDATE "InventoryItem"
    SET "status" = ${InventoryStatus.LOCKED}::"InventoryStatus",
        "orderId" = ${input.orderId},
        "lockedAt" = ${input.lockedAt},
        "updatedAt" = ${input.lockedAt}
    WHERE "id" IN (SELECT "id" FROM picked)
    RETURNING "id"
  `);
}

async function syncProductStock(
  tx: Pick<OrderTransactionClient, "inventoryItem" | "product">,
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
