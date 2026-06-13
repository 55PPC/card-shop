import { z } from "zod";

const idSchema = z.string().min(1).max(128);
const emailSchema = z.string().email().max(255);
const optionalText = z.string().trim().max(500).optional().nullable();

export const priceQuoteSchema = z.object({
  productId: idSchema,
  quantity: z.coerce.number().int().min(1).max(100),
  couponCode: z.string().trim().max(64).optional().nullable()
});

export const createOrderSchema = priceQuoteSchema.extend({
  email: emailSchema,
  queryPassword: z.string().min(4).max(100),
  paymentChannelCode: z.string().trim().min(1).max(64).optional().default("manual")
});

export const orderSearchSchema = z
  .object({
    orderNo: z.string().trim().max(64).optional(),
    email: emailSchema.optional(),
    queryPassword: z.string().min(4).max(100)
  })
  .refine((value) => Boolean(value.orderNo || value.email), {
    message: "Order number or email is required",
    path: ["orderNo"]
  });

export const supportMessageSchema = z.object({
  name: optionalText,
  contact: optionalText,
  email: z.string().email().max(255).optional().nullable(),
  message: z.string().trim().min(1).max(2000),
  source: z.string().trim().max(255).optional().nullable()
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6).max(100)
});

export type PriceQuoteInput = z.infer<typeof priceQuoteSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type OrderSearchRequest = z.infer<typeof orderSearchSchema>;
export type SupportMessageRequest = z.infer<typeof supportMessageSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
