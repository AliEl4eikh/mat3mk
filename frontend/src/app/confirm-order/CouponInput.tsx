"use client";

import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  CheckCircle2,
  Loader2,
  Package,
  Tag,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isCouponArray, type Coupon, type PaymentFormValues } from "./types";

type CouponInputProps = {
  form: UseFormReturn<PaymentFormValues>;
  validateCoupon: (code: string) => Promise<void>;
  isValidatingCoupon: boolean;
  couponData: Coupon[] | null;
  couponError: string | null;
  discountAmount: number;
};

export default function CouponInput({
  form,
  validateCoupon,
  isValidatingCoupon,
  couponData,
  couponError,
  discountAmount,
}: CouponInputProps) {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [showCoupons, setShowCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string>("");

  useEffect(() => {
    void fetchAvailableCoupons();
  }, []);

  const fetchAvailableCoupons = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coupons/active`,
      );
      if (response.ok) {
        const data: unknown = await response.json();
        if (isCouponArray(data)) {
          setAvailableCoupons(data);
        }
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCopyCode = (code: string): void => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    form.setValue("couponCode", code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const formatCouponDescription = (coupon: Coupon): string => {
    if (coupon.code === "SAVE20") {
      return "خصم 20% على جميع الطلبات";
    } else if (coupon.code === "WELCOME10") {
      return "خصم 10% للعملاء الجدد";
    }
    return `خصم ${coupon.discount_value}%`;
  };

  return (
    <>
      <div>
        <div className="bg-white rounded-t-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-800">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <span>كود الخصم</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              أدخل كود الخصم إذا كان لديك
            </CardDescription>
          </CardHeader>
        </div>
      </div>
      <CardContent>
        <div className="p-8">
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="couponCode"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="أدخل كود الخصم"
                      className="h-12 text-lg border-2 focus:border-purple-500 transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <Button
              type="button"
              onClick={() => validateCoupon(form.getValues("couponCode") ?? "")}
              className="h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isValidatingCoupon}
            >
              {isValidatingCoupon ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "تطبيق"
              )}
            </Button>
          </div>

          {/* Available Coupons Section */}
          {availableCoupons.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowCoupons(!showCoupons)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
              >
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">الكوبونات المتاحة</span>
                {showCoupons ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showCoupons && (
                <div className="mt-3 max-h-48 overflow-y-auto border rounded-lg bg-gray-50">
                  {loadingCoupons ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {availableCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="p-4 hover:bg-white transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-purple-600 text-lg">
                                  {coupon.code}
                                </span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  {coupon.discount_value}% خصم
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatCouponDescription(coupon)}
                              </p>
                              {coupon.min_order > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  الحد الأدنى للطلب: {coupon.min_order} جنيه
                                </p>
                              )}
                              {coupon.user_max_uses && (
                                <p className="text-xs text-gray-500">
                                  يمكن استخدامه {coupon.user_max_uses}{" "}
                                  {coupon.user_max_uses === 1 ? "مرة" : "مرات"}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(coupon.code)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                              title="نسخ الكود"
                            >
                              {copiedCode === coupon.code ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isValidatingCoupon && (
            <div className="mt-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              <p className="text-gray-600 mt-2">جاري التحقق من الكوبون...</p>
            </div>
          )}

          {couponError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{couponError}</AlertDescription>
            </Alert>
          )}

          {couponData && couponData.length > 0 && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                تم تطبيق الخصم بنجاح! وفرت {discountAmount} جنيه
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </>
  );
}
