import { z } from "zod";
import { paymentFormSchema } from "./paymentFormSchema";

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export type Coupon = {
  id: number;
  code: string;
  discount_value: number;
  min_order: number;
  user_max_uses: number | null;
  max_uses: number;
  current_uses: number;
  is_expired?: boolean;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isCoupon = (value: unknown): value is Coupon => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    typeof value.code === "string" &&
    typeof value.discount_value === "number" &&
    typeof value.min_order === "number" &&
    (typeof value.user_max_uses === "number" || value.user_max_uses === null) &&
    typeof value.max_uses === "number" &&
    typeof value.current_uses === "number" &&
    (!("is_expired" in value) || typeof value.is_expired === "boolean")
  );
};

export const isCouponArray = (value: unknown): value is Coupon[] =>
  Array.isArray(value) && value.every(isCoupon);
