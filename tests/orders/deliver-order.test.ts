import { InventoryStatus, OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { deliverOrderWithClient } from "../../src/lib/orders/deliver-order";

type InventoryRow = {
  id: string;
  productId: string;
  secret: string;
  status: InventoryStatus;
  orderId: string | null;
};

type MockOrder = {
  id: string;
  orderNo: string;
  status: OrderStatus;
  deliveryItems: unknown;
  deliverySummary: string | null;
  items: Array<{ productId: string; productTitle: string; quantity: number }>;
};

function makeClient(options: { unlockBeforeDeliveryUpdate?: boolean } = {}) {
  const state = {
    products: [{ id: "product-1", stock: 2 }],
    inventory: [
      { id: "inv-1", productId: "product-1", secret: "CARD-1", status: InventoryStatus.LOCKED, orderId: "order-1" },
      { id: "inv-2", productId: "product-1", secret: "CARD-2", status: InventoryStatus.LOCKED, orderId: "order-1" },
      { id: "inv-3", productId: "product-1", secret: "CARD-3", status: InventoryStatus.AVAILABLE, orderId: null }
    ] as InventoryRow[],
    order: {
      id: "order-1",
      orderNo: "DJ202606130101010001",
      status: OrderStatus.PAID,
      deliveryItems: null as unknown,
      deliverySummary: null as string | null,
      items: [{ productId: "product-1", productTitle: "Test Product", quantity: 2 }]
    } as MockOrder
  };

  const tx = {
    order: {
      findUnique: async () => state.order,
      updateMany: async ({
        where,
        data
      }: {
        where: { id: string; status?: OrderStatus };
        data: Partial<MockOrder>;
      }) => {
        if (state.order.id !== where.id || (where.status && state.order.status !== where.status)) {
          return { count: 0 };
        }

        state.order = { ...state.order, ...data };
        return { count: 1 };
      }
    },
    inventoryItem: {
      findMany: async ({ where }: { where: { orderId?: string; productId?: string; status?: InventoryStatus } }) =>
        state.inventory.filter((item) => {
          return (
            (where.orderId === undefined || item.orderId === where.orderId) &&
            (where.productId === undefined || item.productId === where.productId) &&
            (where.status === undefined || item.status === where.status)
          );
        }),
      updateMany: async ({
        where,
        data
      }: {
        where: { id: { in: string[] }; status?: InventoryStatus };
        data: Partial<InventoryRow>;
      }) => {
        let count = 0;

        if (options.unlockBeforeDeliveryUpdate) {
          state.inventory[1].status = InventoryStatus.AVAILABLE;
        }

        for (const item of state.inventory) {
          if (where.id.in.includes(item.id) && (!where.status || item.status === where.status)) {
            Object.assign(item, data);
            count += 1;
          }
        }

        return { count };
      },
      count: async ({ where }: { where: { productId: string; status: InventoryStatus } }) => {
        return state.inventory.filter((item) => item.productId === where.productId && item.status === where.status)
          .length;
      }
    },
    product: {
      update: async ({ where, data }: { where: { id: string }; data: { stock: number } }) => {
        const product = state.products.find((candidate) => candidate.id === where.id);

        if (product) {
          product.stock = data.stock;
        }
      }
    }
  };

  return {
    state,
    client: {
      $transaction: async <T>(callback: (transactionClient: typeof tx) => Promise<T>) => callback(tx)
    }
  };
}

describe("deliverOrder", () => {
  it("delivers locked inventory for a paid order", async () => {
    const { client, state } = makeClient();

    const result = await deliverOrderWithClient(client, "DJ202606130101010001");

    expect(result.items).toEqual([
      { productTitle: "Test Product", secret: "CARD-1" },
      { productTitle: "Test Product", secret: "CARD-2" }
    ]);
    expect(state.inventory.filter((item) => item.status === InventoryStatus.DELIVERED)).toHaveLength(2);
    expect(state.order.status).toBe(OrderStatus.DELIVERED);
    expect(state.products[0].stock).toBe(1);
  });

  it("returns existing delivery without delivering extra inventory", async () => {
    const { client, state } = makeClient();

    const first = await deliverOrderWithClient(client, "DJ202606130101010001");
    const second = await deliverOrderWithClient(client, "DJ202606130101010001");

    expect(second).toEqual(first);
    expect(state.inventory.filter((item) => item.status === InventoryStatus.DELIVERED)).toHaveLength(2);
    expect(state.inventory.find((item) => item.id === "inv-3")?.status).toBe(InventoryStatus.AVAILABLE);
  });

  it("fails clearly when locked inventory is insufficient", async () => {
    const { client, state } = makeClient();
    state.inventory[1].status = InventoryStatus.AVAILABLE;
    state.inventory[1].orderId = null;

    await expect(deliverOrderWithClient(client, "DJ202606130101010001")).rejects.toThrow(
      "Insufficient locked inventory for order"
    );
  });

  it("fails if locked inventory changes before the delivery update completes", async () => {
    const { client } = makeClient({ unlockBeforeDeliveryUpdate: true });

    await expect(deliverOrderWithClient(client, "DJ202606130101010001")).rejects.toThrow(
      "Inventory delivery race detected"
    );
  });
});
