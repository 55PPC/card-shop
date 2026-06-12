import { InventoryStatus, OrderStatus, type PrismaClient } from "@prisma/client";
import { prisma } from "../db";

type DeliveryItem = {
  productTitle: string;
  secret: string;
};

type DeliverableOrder = {
  id: string;
  orderNo: string;
  status: string;
  deliveryItems: unknown;
  deliverySummary: string | null;
  items: Array<{
    productId: string;
    productTitle: string;
    quantity: number;
  }>;
};

type InventoryRow = {
  id: string;
  productId: string;
  secret: string;
};

type DeliveryClient = {
  $transaction<T>(callback: (tx: DeliveryTransactionClient) => Promise<T>): Promise<T>;
};

type DeliveryTransactionClient = {
  order: {
    findUnique(args: unknown): Promise<DeliverableOrder | null>;
    update(args: unknown): Promise<DeliverableOrder>;
  };
  inventoryItem: {
    findMany(args: unknown): Promise<InventoryRow[]>;
    updateMany(args: unknown): Promise<unknown>;
    count?(args: unknown): Promise<number>;
  };
  product: {
    update(args: unknown): Promise<unknown>;
  };
};

export async function deliverOrder(orderNo: string) {
  return deliverOrderWithClient(prisma as unknown as DeliveryClient, orderNo);
}

export async function deliverOrderWithClient(client: DeliveryClient, orderNo: string) {
  return client.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNo },
      include: { items: true }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === OrderStatus.DELIVERED) {
      return existingDelivery(order);
    }

    if (order.status !== OrderStatus.PAID) {
      throw new Error("Order is not paid");
    }

    const expectedQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const lockedInventory = await tx.inventoryItem.findMany({
      where: {
        orderId: order.id,
        status: InventoryStatus.LOCKED
      },
      orderBy: { createdAt: "asc" }
    });

    if (lockedInventory.length < expectedQuantity) {
      throw new Error("Insufficient locked inventory for order");
    }

    const productTitleById = new Map(order.items.map((item) => [item.productId, item.productTitle]));
    const deliveryItems = lockedInventory.slice(0, expectedQuantity).map((item) => ({
      productTitle: productTitleById.get(item.productId) ?? "Product",
      secret: item.secret
    }));
    const deliveredAt = new Date();

    await tx.inventoryItem.updateMany({
      where: {
        id: { in: lockedInventory.slice(0, expectedQuantity).map((item) => item.id) },
        status: InventoryStatus.LOCKED
      },
      data: {
        status: InventoryStatus.DELIVERED,
        deliveredAt
      }
    });

    const deliverySummary = summarizeDelivery(order.items);

    const deliveredOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt,
        deliveryItems,
        deliverySummary
      },
      include: { items: true }
    });

    await syncProductStocks(tx, order.items.map((item) => item.productId));

    return {
      order: deliveredOrder,
      items: deliveryItems,
      summary: deliverySummary
    };
  });
}

function existingDelivery(order: DeliverableOrder) {
  return {
    order,
    items: parseDeliveryItems(order.deliveryItems),
    summary: order.deliverySummary ?? summarizeDelivery(order.items)
  };
}

function parseDeliveryItems(value: unknown): DeliveryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is DeliveryItem => {
    return (
      typeof item === "object" &&
      item !== null &&
      "productTitle" in item &&
      "secret" in item &&
      typeof item.productTitle === "string" &&
      typeof item.secret === "string"
    );
  });
}

function summarizeDelivery(items: DeliverableOrder["items"]) {
  return items.map((item) => `${item.productTitle} x ${item.quantity}`).join("\n");
}

async function syncProductStocks(tx: DeliveryTransactionClient, productIds: string[]) {
  for (const productId of Array.from(new Set(productIds))) {
    const stock = tx.inventoryItem.count
      ? await tx.inventoryItem.count({
          where: {
            productId,
            status: InventoryStatus.AVAILABLE
          }
        })
      : (
          await tx.inventoryItem.findMany({
            where: {
              productId,
              status: InventoryStatus.AVAILABLE
            }
          })
        ).length;

    await tx.product.update({
      where: { id: productId },
      data: { stock }
    });
  }
}
