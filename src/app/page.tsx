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

  console.log("[Home Page] Rendering...");

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center pt-[60px]">
      {/* Background Texture / Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/review/review-bg.jpeg')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      {/* Floating Elements (Aceternity UI Style) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000" />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center space-y-12">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
        >
          <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
            Culinary Class Wars Concept
          </span>
        </motion.div>

        {/* Title & Headline */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter"
          >
            제 평가는<span className="text-orange-500 italic">요?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-2xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            당신의 프로젝트/MVP를 미슐랭 스타급으로 진단해 보세요.<br />
            냉철한 시선과 집요한 디테일, 당신의 성장을 위한 마침표.
          </motion.p>
        </div>

        {/* Cloche Illustration Move */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, type: "spring" }}
          className="relative w-64 h-64 md:w-80 md:h-80"
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
          className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-lg mx-auto"
        >
          <Button
            onClick={() => router.push("/project/upload")}
            className="w-full h-20 rounded-[2.5rem] bg-orange-600 hover:bg-orange-500 text-white text-2xl font-black shadow-[0_20px_40px_-15px_rgba(234,88,12,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
          >
            <ChefHat className="w-8 h-8" />
            진단 의뢰하기
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/projects")}
            className="w-full h-20 rounded-[2.5rem] border-white/10 hover:bg-white/5 text-white/80 text-xl font-bold transition-all"
          >
            진단 참여하기
          </Button>
        </motion.div>

        {/* Floating Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-16">
          {[
            { 
              icon: <Star className="w-5 h-5 text-orange-400" />, 
              title: "미슐랭 5성 평가", 
              desc: "기획부터 독창성까지 방사형 차트로 완성도를 진단합니다." 
            },
            { 
              icon: <Sparkles className="w-5 h-5 text-indigo-400" />, 
              title: "스티커 투표", 
              desc: "직관적이고 위트 있는 스티커로 반응을 실시간 확인하세요." 
            },
            { 
              icon: <Rocket className="w-5 h-5 text-green-400" />, 
              title: "바이럴 리포트", 
              desc: "인스타그램 스토리용 요약 이미지를 즉시 생성해 드립니다." 
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/5 text-left space-y-3 hover:bg-white/10 transition-all cursor-default group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-black text-white">{feature.title}</h3>
              <p className="text-xs text-white/40 font-medium leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer Hint */}
      <footer className="relative z-10 py-12 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
        © 2026 MyRatingIs. All Rights Reserved.
      </footer>
    </div>
  );
}
