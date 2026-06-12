import { describe, expect, it } from "vitest";
import { deliverOrderWithClient } from "../../src/lib/orders/deliver-order";

type InventoryRow = {
  id: string;
  productId: string;
  secret: string;
  status: "AVAILABLE" | "LOCKED" | "DELIVERED";
  orderId: string | null;
};

function makeClient() {
  const state = {
    products: [{ id: "product-1", stock: 2 }],
    inventory: [
      { id: "inv-1", productId: "product-1", secret: "CARD-1", status: "LOCKED", orderId: "order-1" },
      { id: "inv-2", productId: "product-1", secret: "CARD-2", status: "LOCKED", orderId: "order-1" },
      { id: "inv-3", productId: "product-1", secret: "CARD-3", status: "AVAILABLE", orderId: null }
    ] as InventoryRow[],
    order: {
      id: "order-1",
      orderNo: "DJ202606130101010001",
      status: "PAID",
      deliveryItems: null as unknown,
      deliverySummary: null as string | null,
      items: [{ productId: "product-1", productTitle: "Test Product", quantity: 2 }]
    }
  };

  const tx = {
    order: {
      findUnique: async () => state.order,
      update: async ({ data }: { data: Partial<typeof state.order> }) => {
        state.order = { ...state.order, ...data };
        return state.order;
      }
    },
    inventoryItem: {
      findMany: async ({ where }: { where: { orderId?: string; status?: InventoryRow["status"] } }) =>
        state.inventory.filter((item) => {
          return (
            (where.orderId === undefined || item.orderId === where.orderId) &&
            (where.status === undefined || item.status === where.status)
          );
        }),
      updateMany: async ({ where, data }: { where: { id: { in: string[] } }; data: Partial<InventoryRow> }) => {
        for (const item of state.inventory) {
          if (where.id.in.includes(item.id)) {
            Object.assign(item, data);
          }
        }
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
    expect(state.inventory.filter((item) => item.status === "DELIVERED")).toHaveLength(2);
    expect(state.order.status).toBe("DELIVERED");
    expect(state.products[0].stock).toBe(1);
  });

  it("returns existing delivery without delivering extra inventory", async () => {
    const { client, state } = makeClient();

    const first = await deliverOrderWithClient(client, "DJ202606130101010001");
    const second = await deliverOrderWithClient(client, "DJ202606130101010001");

    expect(second).toEqual(first);
    expect(state.inventory.filter((item) => item.status === "DELIVERED")).toHaveLength(2);
    expect(state.inventory.find((item) => item.id === "inv-3")?.status).toBe("AVAILABLE");
  });

  it("fails clearly when locked inventory is insufficient", async () => {
    const { client, state } = makeClient();
    state.inventory[1].status = "AVAILABLE";
    state.inventory[1].orderId = null;

    await expect(deliverOrderWithClient(client, "DJ202606130101010001")).rejects.toThrow(
      "Insufficient locked inventory for order"
    );
  });
});
