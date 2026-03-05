import React from "react";
import { Button } from "@/components/ui/button";
type Category = {
  category_id: number;
  category_name: string;
};

export default function CategoryFilters({
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}) {
  return (
    <div className="flex items-center space-x-3 space-x-reverse overflow-x-auto pb-4 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.category_id}
          variant={
            category.category_name === selectedCategory ? "default" : "outline"
          }
          className="rounded-full cursor-pointer flex-shrink-0"
          onClick={() => onSelectCategory(category.category_name)}
        >
          {category.category_name}
        </Button>
      ))}
    </div>
  );
}
