"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { Button } from "@/components/ui/button";
import { ChefHat, Rocket, Sparkles, Star } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center pt-[60px]">
      {isAuthenticated && <MyRatingIsHeader />}
      {/* Background Texture / Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/dark-texture-bg.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      {/* Floating Elements (Aceternity UI Style) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000" />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center space-y-12">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
        >
          <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-orange-400 fill-orange-400" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
            Professional Evaluation Stage
          </span>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="pt-2 md:pt-4"
        >
          <img 
            src="/myratingis-logo.png" 
            alt="제 평가는요?" 
            className="h-12 md:h-16 lg:h-20 w-auto object-contain brightness-0 invert"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm md:text-lg lg:text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed px-4 break-keep"
        >
          잠재고객과 전문평가위원이 여러분의 프로젝트를 솔직하게 평가합니다.<br />
          공정하면서도 냉정한 평가는 성장의 자산이 됩니다.
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
          className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-4"
        >
          <Button
            onClick={() => router.push("/project/upload")}
            className="w-full h-14 md:h-16 bg-orange-600 hover:bg-orange-500 text-white text-lg md:text-xl font-black shadow-[0_20px_40px_-15px_rgba(234,88,12,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 bevel-cta border-none rounded-none"
          >
            <ChefHat className="w-5 h-5 md:w-6 md:h-6" />
            평가 의뢰하기
          </Button>
          <Button
            onClick={() => router.push("/projects")}
            className="w-full h-14 md:h-16 bg-white hover:bg-gray-100 text-gray-900 text-lg md:text-xl font-black shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 bevel-cta border-none rounded-none"
          >
            <Star className="w-5 h-5 md:w-6 md:h-6" />
            평가 참여하기
          </Button>
        </motion.div>

        {/* Secondary Discovery Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 pt-8"
        >
          <Link href="/about/features" className="hover:text-orange-500 transition-colors">Platform Features</Link>
          <Link href="/faq" className="hover:text-orange-500 transition-colors">User Support & FAQ</Link>
        </motion.div>


      </main>

      {/* Footer Hint */}

    </div>
  );
}
