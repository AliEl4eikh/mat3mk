"use client";

import { useState, useEffect, useMemo } from "react";
import MenuSearchBar from "@/components/MenuSearchBar";
import CategoryFilters from "@/components/CategoryFilters";
import EnhancedProductCard from "@/components/productCard";

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_path: string | null;
  categories: string[];
  isOffer?: boolean;
  discounted_price?: number;
  discount_percentage?: number;
  discount_amount?: number;
  original_price?: number;
  average_rating?: number | string;
};

type Category = {
  category_id: number;
  category_name: string;
};

type Offer = {
  dish_id: number;
  discounted_price: number;
  discount_percentage: number;
  discount_amount: number;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCategory = (value: unknown): value is Category => {
  if (!isObject(value)) return false;
  return (
    typeof value.category_id === "number" &&
    typeof value.category_name === "string"
  );
};

const isOffer = (value: unknown): value is Offer => {
  if (!isObject(value)) return false;
  return (
    typeof value.dish_id === "number" &&
    typeof value.discounted_price === "number" &&
    typeof value.discount_percentage === "number" &&
    typeof value.discount_amount === "number"
  );
};

const parseCategoryNames = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (isObject(item) && typeof item.category_name === "string") {
        return item.category_name;
      }
      return null;
    })
    .filter((categoryName): categoryName is string => categoryName !== null);
};

const parseDish = (value: unknown): Dish | null => {
  if (!isObject(value)) return null;

  if (
    typeof value.id !== "number" ||
    typeof value.name !== "string" ||
    typeof value.price !== "number"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    description: typeof value.description === "string" ? value.description : "",
    price: value.price,
    image_path:
      typeof value.image_path === "string" || value.image_path === null
        ? value.image_path
        : null,
    categories: parseCategoryNames(value.categories),
    isOffer: typeof value.isOffer === "boolean" ? value.isOffer : false,
    discounted_price:
      typeof value.discounted_price === "number"
        ? value.discounted_price
        : undefined,
    discount_percentage:
      typeof value.discount_percentage === "number"
        ? value.discount_percentage
        : undefined,
    discount_amount:
      typeof value.discount_amount === "number" ? value.discount_amount : undefined,
    original_price:
      typeof value.original_price === "number" ? value.original_price : undefined,
    average_rating:
      typeof value.average_rating === "number" ||
      typeof value.average_rating === "string"
        ? value.average_rating
        : undefined,
  };
};

export default function MenuPage() {
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [offerDishes, setOfferDishes] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const [dishesResponse, categoriesResponse, offersResponse] =
          await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/dishes`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`),
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/promotions/dishes-with-promotions`,
            ),
          ]);

        if (!dishesResponse.ok) throw new Error("فشل في جلب الأطباق");
        if (!categoriesResponse.ok) throw new Error("فشل في جلب التصنيفات");

        const dishesJson: unknown = await dishesResponse.json();
        const categoriesJson: unknown = await categoriesResponse.json();

        let offersJson: unknown = [];
        if (offersResponse.ok) {
          offersJson = await offersResponse.json();
        }

        if (!Array.isArray(dishesJson)) {
          throw new Error("بيانات الأطباق غير صالحة");
        }
        if (!Array.isArray(categoriesJson)) {
          throw new Error("بيانات التصنيفات غير صالحة");
        }
        if (!Array.isArray(offersJson)) {
          throw new Error("بيانات العروض غير صالحة");
        }

        const parsedDishes = dishesJson
          .map(parseDish)
          .filter((dish): dish is Dish => dish !== null);
        if (parsedDishes.length !== dishesJson.length) {
          throw new Error("بيانات الأطباق تحتوي على عناصر غير صالحة");
        }

        const parsedCategories = categoriesJson.filter(isCategory);
        if (parsedCategories.length !== categoriesJson.length) {
          throw new Error("بيانات التصنيفات تحتوي على عناصر غير صالحة");
        }

        const parsedOffers = offersJson.filter(isOffer);
        if (parsedOffers.length !== offersJson.length) {
          throw new Error("بيانات العروض تحتوي على عناصر غير صالحة");
        }

        const offersMap = new Map<
          number,
          Pick<
            Dish,
            "discounted_price" | "discount_percentage" | "discount_amount"
          > & { isOffer: true }
        >();

        parsedOffers.forEach((offer) => {
          offersMap.set(offer.dish_id, {
            discounted_price: offer.discounted_price,
            discount_percentage: offer.discount_percentage,
            discount_amount: offer.discount_amount,
            isOffer: true,
          });
        });

        const dishesWithOffers: Dish[] = parsedDishes.map((dish) => {
          const offerData = offersMap.get(dish.id);
          if (offerData) {
            return {
              ...dish,
              ...offerData,
              original_price: dish.price,
            };
          }
          return dish;
        });

        setAllDishes(dishesWithOffers);
        setOfferDishes(parsedOffers);
        setCategories([
          { category_id: 0, category_name: "الكل" },
          ...parsedCategories,
        ]);
      } catch (err) {
        setError("فشل في تحميل قائمة الطعام. الرجاء المحاولة مرة أخرى.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const filteredDishes = useMemo(() => {
    let dishes = allDishes;

    if (selectedCategory !== "الكل") {
      dishes = dishes.filter((dish) =>
        dish.categories.includes(selectedCategory),
      );
    }

    if (searchQuery.trim() !== "") {
      dishes = dishes.filter((dish) =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return dishes;
  }, [allDishes, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-2xl text-primary">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold">قائمة الطعام</h1>
          <p className="text-lg text-gray-500">استكشف أشهى الأطباق لدينا</p>
          <MenuSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </header>

        <div className="mb-12">
          <CategoryFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {filteredDishes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDishes.map((dish) => (
              <EnhancedProductCard key={dish.id} dish={dish} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-2xl font-semibold mb-2">
              لا توجد أطباق تطابق بحثك
            </p>
            <p>حاول تغيير فلتر التصنيف أو تعديل كلمة البحث.</p>
          </div>
        )}
      </div>
    </div>
  );
}
