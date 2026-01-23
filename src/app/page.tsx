"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChefHat, Rocket, Sparkles, Star } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const router = useRouter();



  return (
    <div className="relative min-h-screen bg-background text-chef-text overflow-hidden flex flex-col items-center justify-center pt-[60px] transition-colors duration-500">
      {/* Background Texture / Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/dark-texture-bg.jpg')] bg-cover bg-center opacity-10 dark:opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>

      {/* Floating Elements (Aceternity UI Style) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chef-text/5 rounded-full blur-[100px] animate-pulse delay-1000" />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center space-y-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-4 md:pt-8"
        >
          <img 
            src="/myratingis-logo.png" 
            alt="제 평가는요?" 
            className="h-12 md:h-16 lg:h-20 w-auto object-contain"
          />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-chef-border bg-chef-card/50 backdrop-blur-md"
        >
          <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-orange-400 fill-orange-400" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
            Culinary Class Wars Concept
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm md:text-lg lg:text-xl text-chef-text opacity-60 font-medium max-w-2xl mx-auto leading-relaxed px-4"
        >
          당신의 프로젝트/MVP를 미슐랭 스타급으로 진단해 보세요.<br />
          냉철한 시선과 집요한 디테일, 당신의 성장을 위한 마침표.
        </motion.p>

        {/* Cloche Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, type: "spring" }}
          className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80"
        >
          <img 
            src="/review/cloche-cover.png" 
            alt="Cloche" 
            className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(255,165,0,0.3)]"
          />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto px-4"
        >
          <Button
            onClick={() => router.push("/project/upload")}
            className="w-full h-14 md:h-16 rounded-[2rem] bg-orange-600 hover:bg-orange-500 text-white text-lg md:text-xl font-black shadow-[0_20px_40px_-15px_rgba(234,88,12,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <ChefHat className="w-5 h-5 md:w-6 md:h-6" />
            진단 의뢰하기
          </Button>
          <Button
            onClick={() => router.push("/projects")}
            className="w-full h-14 md:h-16 rounded-[2rem] bg-chef-text text-chef-bg hover:opacity-90 text-lg md:text-xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5 md:w-6 md:h-6" />
            진단 참여하기
          </Button>
        </motion.div>


      </main>

      {/* Footer Hint */}
      <footer className="relative z-10 py-12 text-chef-text opacity-20 text-[10px] font-black uppercase tracking-[0.3em]">
        © 2026 MyRatingIs. All Rights Reserved.
      </footer>
    </div>
  );
}
