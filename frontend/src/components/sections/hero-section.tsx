"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import Navigation from "./navigation";
import DishSearch from "@/components/dish-search";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroSection() {
  const [isSearchActive, setIsSearchActive] = useState(false);

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-dark-shade">
      <Navigation />

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <Image
          src="/hero-bg.jpg"
          alt="طعام شهي"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* --- Content container --- */}
      <motion.div
        className="container relative z-20 mx-auto px-4 text-center text-white flex flex-col items-center"
        animate={{ y: isSearchActive ? "-25vh" : 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          اطلب طعامك المفضل
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-neutral/90">
          أسرع خدمة توصيل طعام في مدينتك
        </p>

        {/* Search Bar Container */}
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 mb-8">
          <DishSearch setIsSearchActive={setIsSearchActive} />
        </div>

        <AnimatePresence>
          {!isSearchActive && (
            <motion.div
              className="flex flex-col md:flex-row gap-4 justify-center"
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8"
              >
                اطلب الآن
              </Button>
              <Link href="/menu">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10 text-lg px-8"
                >
                  تصفح القائمة
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
