import { InventoryStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { createOrderWithClient } from "../../src/lib/orders/create-order";

type MockClaimedInventory = Array<{ id: string }>;

function makeClient(claimedIds: string[]) {
  const state = {
    product: {
      id: "product-1",
      enabled: true,
      title: "Test Product",
      price: "9.00"
    },
    createdOrder: null as null | { id: string; orderNo: string; queryPasswordHash: string },
    stock: 3
  };

  const tx = {
    product: {
      findUnique: async () => state.product,
      update: async ({ data }: { data: { stock: number } }) => {
        state.stock = data.stock;
      }
    },
    order: {
      create: async ({ data }: { data: { orderNo: string; queryPasswordHash: string } }) => {
        state.createdOrder = {
          id: "order-1",
          orderNo: data.orderNo,
          queryPasswordHash: data.queryPasswordHash
        };

        return {
          id: "order-1",
          orderNo: data.orderNo,
          items: [{ productId: "product-1", productTitle: "Test Product", quantity: 2 }]
        };
      }
    },
    inventoryItem: {
      count: async ({ where }: { where: { status: InventoryStatus } }) => {
        return where.status === InventoryStatus.AVAILABLE ? state.stock - claimedIds.length : 0;
      }
    },
    $queryRaw: async <T = MockClaimedInventory>() => claimedIds.map((id) => ({ id })) as T
  };

  return {
    state,
    client: {
      $transaction: async <T>(callback: (transactionClient: typeof tx) => Promise<T>) => callback(tx)
    }
  };
}

describe("createOrder", () => {
  it("creates an order and locks inventory through the atomic claim query", async () => {
    const { client, state } = makeClient(["inv-1", "inv-2"]);

    const order = await createOrderWithClient(client, {
      productId: "product-1",
      quantity: 2,
      email: "buyer@example.com",
      queryPassword: "secret"
    });

    expect(order.orderNo).toMatch(/^DJ\d{18}$/);
    expect(state.createdOrder?.queryPasswordHash).not.toBe("secret");
    expect(state.stock).toBe(1);
  });

  it("fails clearly when the atomic claim cannot lock enough inventory", async () => {
    const { client } = makeClient(["inv-1"]);

    await expect(
      createOrderWithClient(client, {
        productId: "product-1",
        quantity: 2,
        email: "buyer@example.com",
        queryPassword: "secret"
      })
    ).rejects.toThrow("Insufficient inventory");
  });
});
