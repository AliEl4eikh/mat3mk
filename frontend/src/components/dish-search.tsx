import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { debounce } from "lodash";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";

const FilterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4h18M7 12h10m-9 8h8"
    />
  </svg>
);

const ClearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-gray-300"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default function DishSearch({ onSearchActive }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [sortBy, setSortBy] = useState("relevance");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (filterCategory !== "all") {
      const category = categories.find(
        (c) => c.category_id === parseInt(filterCategory),
      );
      filters.push({
        type: "category",
        value: category?.category_name || filterCategory,
      });
    }
    if (minPrice)
      filters.push({ type: "minPrice", value: `من ${minPrice} جنيه` });
    if (maxPrice)
      filters.push({ type: "maxPrice", value: `إلى ${maxPrice} جنيه` });
    if (sortBy !== "relevance") {
      const sortLabels = {
        price_asc: "السعر: الأقل أولاً",
        price_desc: "السعر: الأعلى أولاً",
        name_asc: "الاسم (أ-ي)",
        name_desc: "الاسم (ي-أ)",
      };
      filters.push({ type: "sort", value: sortLabels[sortBy] });
    }
    return filters;
  }, [filterCategory, minPrice, maxPrice, sortBy, categories]);

  const hasActiveFilters = activeFilters.length > 0;

  const isSearchActive = useMemo(
    () => query.length > 0 || isFilterVisible || hasActiveFilters,
    [query, isFilterVisible, hasActiveFilters],
  );

  useEffect(() => {
    if (onSearchActive) onSearchActive(isSearchActive);
  }, [isSearchActive, onSearchActive]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoryError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/categories`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setCategoryError("فشل في تحميل التصنيفات");
        console.error("Error fetching categories:", err);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        if (!query && !hasActiveFilters) {
          setIsFilterVisible(false);
          setResults([]);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, hasActiveFilters]);

  const fetchDishes = useMemo(
    () =>
      debounce(async (q, sort, categoryId, minP, maxP) => {
        const areFiltersActive = q || categoryId !== "all" || minP || maxP;

        if (!areFiltersActive) {
          setResults([]);
          setError(null);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const params = new URLSearchParams();
          if (q) params.append("q", q.trim());
          if (sort !== "relevance") params.append("sortBy", sort);
          if (categoryId !== "all")
            params.append("filterByCategory", categoryId);
          if (minP && !isNaN(minP)) params.append("minPrice", minP);
          if (maxP && !isNaN(maxP)) params.append("maxPrice", maxP);

          const response = await fetch(
            `http://localhost:5000/api/dishes?${params.toString()}`,
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setResults(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Search error:", err);
          setError("حدث خطأ أثناء البحث. حاول مرة أخرى.");
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    [],
  );

  useEffect(() => {
    fetchDishes(query, sortBy, filterCategory, minPrice, maxPrice);
    return () => fetchDishes.cancel();
  }, [query, sortBy, filterCategory, minPrice, maxPrice, fetchDishes]);

  const clearAllFilters = useCallback(() => {
    setQuery("");
    setSortBy("relevance");
    setFilterCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setResults([]);
    setError(null);
    setIsFilterVisible(false);
    inputRef.current?.focus();
  }, []);

  const clearSpecificFilter = useCallback((filterType) => {
    switch (filterType) {
      case "category":
        setFilterCategory("all");
        break;
      case "minPrice":
        setMinPrice("");
        break;
      case "maxPrice":
        setMaxPrice("");
        break;
      case "sort":
        setSortBy("relevance");
        break;
      default:
        break;
    }
  }, []);

  const handlePriceChange = useCallback(
    (value, type) => {
      const numValue =
        value === "" ? "" : Math.max(0, parseFloat(value) || 0).toString();

      if (type === "min") {
        setMinPrice(numValue);
        if (
          maxPrice &&
          numValue &&
          parseFloat(maxPrice) < parseFloat(numValue)
        ) {
          setMaxPrice(numValue);
        }
      } else if (type === "max") {
        setMaxPrice(numValue);
        if (
          minPrice &&
          numValue &&
          parseFloat(minPrice) > parseFloat(numValue)
        ) {
          setMinPrice(numValue);
        }
      }
    },
    [minPrice, maxPrice],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        if (isFilterVisible) {
          setIsFilterVisible(false);
        } else if (query || hasActiveFilters) {
          clearAllFilters();
        }
      }
    },
    [isFilterVisible, query, hasActiveFilters, clearAllFilters],
  );

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchContainerRef}>
      {/* Search Input and Filter Button */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <div className="relative flex-grow">
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن طبقك المفضل هنا..."
            className="w-full px-4 py-3 border border-gray-400/50 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 pr-10 transition-all duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-300 transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="مسح البحث"
            >
              <ClearIcon />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsFilterVisible(!isFilterVisible)}
          className={`flex items-center space-x-2 space-x-reverse px-4 py-3 border rounded-md transition-all duration-200 ${
            isFilterVisible || hasActiveFilters
              ? "bg-orange-500/20 text-orange-300 border-orange-400/50 shadow-lg shadow-orange-500/10"
              : "bg-white/10 hover:bg-white/20 text-white border-gray-400/50 hover:border-gray-300/70"
          }`}
          aria-label="تصفية النتائج"
        >
          <FilterIcon />
          <span>تصفية</span>
          {hasActiveFilters && (
            <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1 animate-pulse">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && !isFilterVisible && (
        <div className="flex flex-wrap gap-2 mt-3">
          {activeFilters.map((filter, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-white/10 text-white text-xs rounded-full border border-white/20 backdrop-blur-sm"
            >
              {filter.value}
              <button
                type="button"
                onClick={() => clearSpecificFilter(filter.type)}
                className="mr-2 hover:text-red-300 transition-colors"
                aria-label={`إزالة فلتر ${filter.value}`}
              >
                <ClearIcon />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-orange-300 hover:text-orange-200 underline transition-colors px-2 py-1"
          >
            مسح جميع الفلاتر
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {isFilterVisible && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-gray-900/95 backdrop-blur-md border border-gray-600/50 rounded-xl shadow-2xl shadow-black/50 z-20 p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-lg">خيارات التصفية</h3>
            <button
              type="button"
              onClick={() => setIsFilterVisible(false)}
              className="text-gray-400 hover:text-white focus:outline-none transition-colors p-2 rounded-full hover:bg-white/10"
              aria-label="إغلاق التصفية"
            >
              <ClearIcon />
            </button>
          </div>

          <div className="space-y-5">
            {/* Sort By */}
            <div>
              <label
                htmlFor="sortBy"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                ترتيب حسب
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-white px-3 py-2.5 border border-gray-600/50 rounded-lg bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
              >
                <option value="relevance">الأكثر صلة</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="name_asc">الاسم (أ-ي)</option>
                <option value="name_desc">الاسم (ي-أ)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label
                htmlFor="filterCategory"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                تصفية حسب الفئة
              </label>
              <select
                id="filterCategory"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-white px-3 py-2.5 border border-gray-600/50 rounded-lg bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={categoriesLoading || categories.length === 0}
              >
                <option value="all">كل الفئات</option>
                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
              {categoriesLoading && (
                <p className="text-gray-400 text-xs mt-2 flex items-center">
                  <LoadingSpinner />
                  <span className="mr-2">جاري تحميل الفئات...</span>
                </p>
              )}
              {categoryError && (
                <p className="text-red-300 text-xs mt-2">{categoryError}</p>
              )}
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                نطاق السعر (جنيه)
              </label>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Input
                  type="number"
                  value={minPrice}
                  onChange={(e) => handlePriceChange(e.target.value, "min")}
                  placeholder="من"
                  min="0"
                  step="0.01"
                  className="w-full text-white px-3 py-2.5 border border-gray-600/50 rounded-lg bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                />
                <span className="text-gray-400 px-2 font-medium">-</span>
                <Input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => handlePriceChange(e.target.value, "max")}
                  placeholder="إلى"
                  min="0"
                  step="0.01"
                  className="w-full text-white px-3 py-2.5 border border-gray-600/50 rounded-lg bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                />
              </div>
              {minPrice &&
                maxPrice &&
                parseFloat(minPrice) > parseFloat(maxPrice) && (
                  <p className="text-yellow-300 text-xs mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    الحد الأدنى للسعر لا يمكن أن يكون أكبر من الحد الأقصى
                  </p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 space-x-reverse pt-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 px-4 py-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-sm"
              >
                إعادة تعيين جميع الفلاتر
              </button>
              <button
                type="button"
                onClick={() => setIsFilterVisible(false)}
                className="flex-1 px-4 py-2.5 bg-orange-600/80 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      {isSearchActive && (
        <div className="absolute top-full left-0 right-0 z-10 mt-3 max-h-80 overflow-y-auto bg-gray-900/95 backdrop-blur-md border border-gray-600/50 rounded-xl shadow-2xl shadow-black/50 animate-in slide-in-from-top-2 duration-200">
          {loading && (
            <div className="px-6 py-8 text-center text-gray-300 flex items-center justify-center">
              <LoadingSpinner />
              <span className="mr-3">جاري البحث...</span>
            </div>
          )}

          {error && (
            <div className="px-6 py-5 text-center text-red-300 bg-red-900/30 border-b border-red-800/50 backdrop-blur-sm">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            results.length === 0 &&
            (query || hasActiveFilters) && (
              <div className="px-6 py-8 text-center text-gray-300 space-y-3">
                <p className="text-lg">لا توجد نتائج مطابقة</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-orange-300 hover:text-orange-200 underline transition-colors px-3 py-1 rounded-md hover:bg-white/5"
                  >
                    مسح جميع الفلاتر والمحاولة مرة أخرى
                  </button>
                )}
              </div>
            )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="px-6 py-3 bg-gray-800/50 border-b border-gray-700/50 text-sm text-gray-300 backdrop-blur-sm">
                عثر على{" "}
                <span className="text-orange-300 font-medium">
                  {results.length}
                </span>{" "}
                نتائج
              </div>
              <ul>
                {results.map((dish) => (
                  <li key={dish.id}>
                    <Link
                      href={`/menu/${dish.id}`}
                      className="flex items-center px-6 py-4 hover:bg-gray-800/60 transition-all duration-200 focus:bg-gray-800/60 focus:outline-none border-b border-gray-800/30 last:border-b-0"
                      onClick={() => {
                        setIsFilterVisible(false);
                        setQuery("");
                      }}
                    >
                      <div className="h-14 w-14 relative flex-shrink-0 rounded-xl overflow-hidden bg-gray-700 shadow-lg">
                        <Image
                          src={
                            dish.image_path
                              ? `${process.env.NEXT_PUBLIC_API_URL}/${dish.image_path}`
                              : "/placeholder-dish.png"
                          }
                          alt={dish.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="mr-4 flex-1 min-w-0">
                        <p className="text-base text-gray-100 font-medium truncate">
                          {dish.name}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          <span className="text-orange-300 font-medium">
                            {dish.price} جنيه
                          </span>
                          {dish.category_name && (
                            <span className="mr-3 text-gray-500">
                              • {dish.category_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
