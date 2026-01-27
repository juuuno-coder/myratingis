"use client";

import React from "react";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { motion } from "framer-motion";
import { 
  Zap, 
  ChefHat, 
  Star, 
  Target, 
  BarChart3, 
  Share2, 
  Layers, 
  Fingerprint,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function FeaturesPage() {
  const router = useRouter();

  const features = [
    {
      id: "expert-audit",
      icon: Star,
      title: "Expert Audit Report",
      tag: "Professional Grade",
      desc: "전문가의 시각으로 프로젝트를 정밀 분석합니다. 기획력, 독창성, 심미성 등 6가지 핵심 지표를 통해 당신의 작업물이 가진 진정한 가치를 정량화하여 제공합니다.",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      id: "guest-flow",
      icon: ChefHat,
      title: "Seamless Guest Flow",
      tag: "Zero Barrier",
      desc: "평가 참여의 허들을 완전히 제거했습니다. 링크를 받은 누구나 가입 절차 없이 즉시 평가를 시작할 수 있으며, 고유의 식별 기술을 통해 중복 참여를 방지합니다.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      id: "data-merging",
      icon: Fingerprint,
      title: "Smart Data Merging",
      tag: "Continuity",
      desc: "비회원 시절의 모든 활동 데이터는 소중히 보관됩니다. 추후 가입하거나 로그인하는 즉시, 과거의 평가 기록들이 새 계정으로 자동 통합되어 나만의 인사이트 자산이 됩니다.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      id: "sticker-poll",
      icon: Target,
      title: "Interactive Sticker Poll",
      tag: "Real Reaction",
      desc: "단순한 별점을 넘어선 직관적인 반응 수집 도구입니다. 커스텀 스티커를 통해 프로젝트에 대한 시장의 즉각적이고 리얼한 반응을 한눈에 확인할 수 있습니다.",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    }
  ];

  return (
    <div className="min-h-screen chef-bg-page selection:bg-orange-500/30">
      <main className="pt-40 pb-32">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 mb-32">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-chef-panel border border-chef-border rounded-lg"
                >
                   <Zap className="text-orange-500 w-4 h-4" />
                   <span className="text-[10px] font-black text-chef-text uppercase tracking-widest italic">서비스 비전</span>
                </motion.div>
                
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="text-5xl md:text-7xl font-black text-chef-text tracking-tighter italic uppercase leading-[1.1]"
                >
                  평가의 <br/> <span className="text-orange-500">새로운 기준</span>
                </motion.h1>

                <motion.p 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                   className="text-xl text-chef-text opacity-50 font-medium max-w-lg leading-relaxed"
                >
                  제 평가는요?는 크리에이터의 성장을 위한 마침표를 찍습니다. 
                  단순한 피드백을 넘어, 데이터 기반의 정밀 분석과 
                  매끄러운 사용자 경험을 결합한 혁신적인 평가 솔루션입니다.
                </motion.p>

                   transition={{ delay: 0.3 }}
                   className="flex gap-4 pt-4"
                >
                   <Button onClick={() => router.push('/project/upload')} className="h-16 px-10 min-w-[320px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xl shadow-2xl shadow-orange-600/20 gap-3 group">
                      의뢰 시작하기 <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                   </Button>
                </motion.div>
              </div>

                transition={{ duration: 1, delay: 0.4, type: "spring" }}
                className="relative aspect-square md:aspect-auto md:h-[600px] rounded-[4rem] overflow-hidden shadow-2xl border border-chef-border/10"
              >
                 <Image 
                   src="/review/a1.jpeg" 
                   alt="Feature Hero" 
                   fill
                   priority
                   className="object-cover brightness-75 contrast-125" 
                   sizes="(max-width: 768px) 100vw, 50vw"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-chef-bg via-transparent to-transparent" />
              </motion.div>
           </div>
        </div>

        {/* Feature Grid Section */}
        <div className="bg-chef-panel/30 py-32 border-y border-chef-border/10">
           <div className="max-w-6xl mx-auto px-6">
              <div className="mb-20 space-y-4">
                 <h2 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] italic">Full Feature Set</h2>
                 <p className="text-4xl md:text-5xl font-black text-chef-text tracking-tighter italic uppercase">혁신적인 기능으로 <br/> 가치를 증명합니다</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {features.map((f, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
                     className="bg-chef-card bevel-sm p-10 space-y-6 hover:shadow-2xl transition-all hover:scale-[1.02] border border-chef-border/10"
                   >
                      <div className={`w-14 h-14 ${f.bgColor} ${f.color} rounded-2xl flex items-center justify-center`}>
                         <f.icon className="w-7 h-7" />
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <span className="text-[10px] font-black text-orange-500 opacity-60 uppercase tracking-widest">{f.tag}</span>
                            <h3 className="text-2xl font-black text-chef-text tracking-tight uppercase italic">{f.title}</h3>
                         </div>
                         <p className="text-sm text-chef-text opacity-40 font-bold leading-relaxed">
                            {f.desc}
                         </p>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto px-6 mt-40">
           <div className="text-center space-y-10">
              <h2 className="text-5xl md:text-7xl font-black text-chef-text tracking-tighter italic uppercase leading-none">
                Start Proving <br/> Your <span className="text-orange-500">Value</span> Today
              </h2>
              <p className="text-xl text-chef-text opacity-40 font-medium max-w-xl mx-auto">
                더 이상 수동적인 업로드에 그치지 마세요. 
                전문가의 진단과 리얼한 시장 반응을 통해 다음 단계로 도약하세요.
              </p>
              <div className="flex justify-center pt-8">
                 <Button onClick={() => router.push('/signup')} className="h-20 px-16 rounded-[2.5rem] bg-chef-text text-chef-bg hover:opacity-90 font-black text-2xl shadow-4xl gap-6 transition-all hover:scale-105 active:scale-95">
                   무료로 시작하기 <ChevronRight size={32} />
                 </Button>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
