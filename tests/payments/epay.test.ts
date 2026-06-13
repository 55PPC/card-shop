import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  buildEpaySubmitFields,
  createLinkString,
  signEpayParams,
  verifyEpayNotify
} from "../../src/lib/payments/epay";

describe("EPay helpers", () => {
  it("signs request parameters by sorted key order", () => {
    const signature = signEpayParams(
      { money: "9.00", name: "Test", out_trade_no: "DJ1", pid: "1000" },
      "secret"
    );

    expect(createLinkString({ name: "Test", pid: "1000", out_trade_no: "DJ1", money: "9.00" }))
      .toBe("money=9.00&name=Test&out_trade_no=DJ1&pid=1000");
    expect(signature).toBe("ab3c5f0616450731b22ff04566f091c4");
  });

  it("verifies notify signatures while ignoring sign metadata and empty values", () => {
    const params = {
      pid: "1000",
      trade_no: "EPAY123",
      out_trade_no: "DJ1",
      type: "alipay",
      name: "Test",
      money: "9.00",
      trade_status: "TRADE_SUCCESS",
      sign_type: "MD5",
      ignored_empty: ""
    };

    const sign = signEpayParams(params, "secret");

    expect(verifyEpayNotify({ ...params, sign }, "secret")).toBe(true);
  });

  it("rejects invalid notify signatures", () => {
    expect(
      verifyEpayNotify(
        {
          pid: "1000",
          out_trade_no: "DJ1",
          money: "9.00",
          trade_status: "TRADE_SUCCESS",
          sign: "not-a-valid-signature"
        },
        "secret"
      )
    ).toBe(false);
  });

  it("builds submit fields with fixed two-decimal money", () => {
    const fields = buildEpaySubmitFields(
      {
        orderNo: "DJ1",
        total: new Prisma.Decimal("9.00"),
        items: [{ productTitle: "Test Product" }]
      },
      { pid: "1000", key: "secret", type: "alipay", sitename: "Card Shop" },
      { notifyUrl: "https://example.com/notify", returnUrl: "https://example.com/return" }
    );

    expect(fields.money).toBe("9.00");
    expect(fields.name).toBe("Test Product");
    expect(fields.sign_type).toBe("MD5");
    expect(fields.sign).toBe(signEpayParams({ ...fields, sign: undefined, sign_type: undefined }, "secret"));
  });
});
