"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Users, 
  Star, 
  MessageSquare, 
  Share2,
  ChefHat,
  Trophy,
  Rocket,
  Download
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Project
        const { data: projectData, error: pError } = await supabase
          .from('Project')
          .select('*')
          .eq('project_id', Number(projectId))
          .single();
        
        if (pError) throw pError;
        setProject(projectData);

        // 2. Fetch All Ratings
        const { data: ratingData } = await (supabase
          .from('ProjectRating') as any)
          .select('*')
          .eq('project_id', Number(projectId));
        
        setRatings(ratingData || []);

      } catch (err) {
        console.error("Fetch report error:", err);
        toast.error("리포트 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const reportStats = useMemo(() => {
    if (!project || !ratings) return null;

    const auditConfig = project.custom_data?.audit_config;
    const categories = auditConfig?.categories || [];

    // Radar Data
    const radarData = categories.map((cat: any) => {
      const sum = ratings.reduce((acc, curr) => acc + (curr[cat.id] || 0), 0);
      const avg = ratings.length > 0 ? (sum / ratings.length).toFixed(1) : 0;
      return {
        subject: cat.label,
        value: Number(avg),
        fullMark: 5
      };
    });

    // Sticker Poll Aggregation
    const stickerOptions = auditConfig?.poll?.options || [];
    const polls: Record<string, number> = {};
    ratings.forEach(r => {
      if (r.vote_type) {
        polls[r.vote_type] = (polls[r.vote_type] || 0) + 1;
      }
    });

    const barData = stickerOptions.map((opt: any) => ({
      name: opt.label,
      value: polls[opt.id] || 0,
      color: opt.color || '#f59e0b'
    }));

    // Overall Avg
    const totalSum = radarData.reduce((acc: number, curr: any) => acc + curr.value, 0);
    const overallAvg = radarData.length > 0 ? (totalSum / radarData.length).toFixed(1) : "0.0";

    return { 
      radarData, 
      barData, 
      overallAvg, 
      participantCount: ratings.length,
      categories 
    };
  }, [project, ratings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6" />
          <p className="font-black text-xl animate-pulse tracking-widest uppercase text-white/40">Analyzing Results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-pretendard">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               <span className="text-sm font-bold uppercase tracking-widest">Back</span>
            </button>
            <div className="flex items-center gap-3">
               <Button variant="outline" className="h-10 rounded-xl border-white/10 bg-white/5 text-xs font-black gap-2">
                  <Download className="w-3 h-3" /> 스토리 이미지 생성
               </Button>
               <Button className="h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black gap-2">
                  <Share2 className="w-3 h-3" /> 리포트 공유
               </Button>
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 space-y-20">
         {/* Hero Title */}
         <section className="text-center space-y-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-center">
               <div className="px-4 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ChefHat size={14} /> Diagnostic Final Report
               </div>
            </motion.div>
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-7xl font-black tracking-tighter">
               {project?.title} <span className="text-white/20">진단 결과</span>
            </motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-white/40 max-w-2xl mx-auto font-medium">
               누적 {reportStats?.participantCount}명의 전문가 시선으로 분석된<br />미슐랭 5성 프로젝트 리포트입니다.
            </motion.p>
         </section>

         {/* Summary Stats */}
         <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '참여 전문가', value: reportStats?.participantCount, icon: Users, color: 'text-blue-400' },
              { label: '종합 미슐랭 지수', value: reportStats?.overallAvg, icon: Star, color: 'text-orange-400' },
              { label: '최고 평가 항목', value: reportStats?.radarData.sort((a:any, b:any) => b.value - a.value)[0]?.subject || '-', icon: Trophy, color: 'text-amber-300' },
              { label: '바이럴 점수', value: 'TOP 5%', icon: Rocket, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i*0.1 }} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.08] transition-colors group">
                 <stat.icon className={cn("w-6 h-6 mb-4", stat.color)} />
                 <p className="text-white/30 text-[10px] font-black mb-1 uppercase tracking-widest">{stat.label}</p>
                 <h3 className="text-3xl font-black">{stat.value}</h3>
              </motion.div>
            ))}
         </section>

         {/* Charts Grid */}
         <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Michelin Radar */}
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/5 border border-white/5 p-10 rounded-[3rem] space-y-8">
               <h3 className="text-2xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-orange-600 rounded-full" /> Michelin Radar Analysis
               </h3>
               <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={reportStats?.radarData}>
                      <PolarGrid stroke="#ffffff10" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar
                        name="Avg Score"
                        dataKey="value"
                        stroke="#ea580c"
                        fill="#ea580c"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {reportStats?.radarData.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-xs font-bold text-white/40">{d.subject}</span>
                       <span className="text-lg font-black text-orange-500">{d.value}</span>
                    </div>
                  ))}
               </div>
            </motion.div>

            {/* Sticker Decisions */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/5 border border-white/5 p-10 rounded-[3rem] space-y-8">
               <h3 className="text-2xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" /> Sticker Decision Status
               </h3>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportStats?.barData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip 
                         cursor={{ fill: 'transparent' }}
                         contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #ffffff10', borderRadius: '16px' }}
                         itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                         {reportStats?.barData.map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="space-y-3">
                  {reportStats?.barData.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                       <span className="text-sm font-bold text-white/60 flex-1">{d.name}</span>
                       <span className="text-lg font-black">{d.value} 득표</span>
                    </div>
                  ))}
               </div>
            </motion.div>
         </section>

         {/* Reviews List */}
         <section className="space-y-10">
            <h3 className="text-3xl font-black flex items-center gap-3">
               <MessageSquare className="text-orange-600" /> 종합 의견 리포트
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {ratings.length > 0 ? (
                 ratings.map((r, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ y: 20, opacity: 0 }} 
                    whileInView={{ y: 0, opacity: 1 }} 
                    viewport={{ once: true }}
                    className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all space-y-6"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-white/40 border border-white/10 uppercase tracking-tighter">
                              EXP {i+1}
                           </div>
                           <h4 className="text-sm font-black">Anonymous Expert</h4>
                        </div>
                        <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-orange-400 border border-orange-500/20">
                           AVG {r.score?.toFixed(1) || '0.0'}
                        </div>
                     </div>
                     
                     {/* Custom Answers */}
                     {Object.entries(r.custom_answers || {}).map(([q, a], qIdx) => (
                        <div key={qIdx} className="space-y-2">
                           <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Question {qIdx + 1}</p>
                           <p className="text-xs font-bold text-white/60 leading-relaxed italic">"{q}"</p>
                           <p className="text-sm font-medium text-white/90 pl-4 border-l border-orange-500/30">{a as string}</p>
                        </div>
                     ))}

                     {/* Final Proposal */}
                     {r.proposal && (
                        <div className="space-y-2 pt-4 border-t border-white/5">
                           <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Comprehensive Opinion</p>
                           <div className="bg-white/5 p-6 rounded-2xl text-sm font-medium leading-relaxed italic text-orange-200">
                             "{r.proposal}"
                           </div>
                        </div>
                     )}
                  </motion.div>
                 ))
               ) : (
                 <div className="col-span-full py-20 text-center text-white/20">
                    <MessageSquare size={48} className="mx-auto mb-4" />
                    <p className="font-bold">아직 수집된 의견이 없습니다.</p>
                 </div>
               )}
            </div>
         </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 px-6 text-center text-white/20">
         <div className="flex flex-col items-center gap-6">
            <ChefHat size={32} />
            <p className="text-xs font-black uppercase tracking-[0.4em]">TestMe Diagnostic System &copy; 2026</p>
         </div>
      </footer>
    </div>
  );
}
