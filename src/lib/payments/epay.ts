import { createHash } from "crypto";
import type { Order } from "@prisma/client";

type EpayParamValue = string | number | boolean | null | undefined;
export type EpayParams = Record<string, EpayParamValue>;

export type EpayChannelConfig = {
  pid: string;
  key: string;
  type?: string;
  sitename?: string;
};

export type EpaySubmitUrls = {
  notifyUrl: string;
  returnUrl: string;
};

const OMITTED_NOTIFY_KEYS = new Set(["sign", "sign_type"]);

function normalizeValue(value: EpayParamValue) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function signableEntries(params: EpayParams) {
  return Object.entries(params)
    .filter(([key, value]) => !OMITTED_NOTIFY_KEYS.has(key) && normalizeValue(value) !== "")
    .sort(([left], [right]) => left.localeCompare(right));
}

export function createLinkString(params: EpayParams) {
  return signableEntries(params)
    .map(([key, value]) => `${key}=${normalizeValue(value)}`)
    .join("&");
}

export function signEpayParams(params: EpayParams, key: string) {
  return createHash("md5").update(`${createLinkString(params)}${key}`).digest("hex");
}

export function verifyEpayNotify(params: EpayParams, key: string) {
  const providedSign = normalizeValue(params.sign);

  if (!providedSign) {
    return false;
  }

  return signEpayParams(params, key).toLowerCase() === providedSign.toLowerCase();
}

export function buildEpaySubmitFields(
  order: Pick<Order, "orderNo" | "total"> & { items?: Array<{ productTitle: string }> },
  channelConfig: EpayChannelConfig,
  urls: EpaySubmitUrls
) {
  const fields: EpayParams = {
    pid: channelConfig.pid,
    type: channelConfig.type ?? "alipay",
    out_trade_no: order.orderNo,
    notify_url: urls.notifyUrl,
    return_url: urls.returnUrl,
    name: order.items?.[0]?.productTitle ?? `Order ${order.orderNo}`,
    money: order.total.toString(),
    sitename: channelConfig.sitename ?? "Card Shop"
  };

  return {
    ...fields,
    sign: signEpayParams(fields, channelConfig.key),
    sign_type: "MD5"
  };
}
