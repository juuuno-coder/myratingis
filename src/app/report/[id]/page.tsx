"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase/client"; // Firebase
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"; // Firestore methods
import { 
  ArrowLeft, 
  Users, 
  Star, 
  MessageSquare, 
  Share2,
  ChefHat,
  Trophy,
  Rocket,
  Download,
  ChevronRight
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MyRatingIsHeader } from '@/components/MyRatingIsHeader';
// Remove unused constants if not used elsewhere, or keep them.
import { GENRE_CATEGORIES, FIELD_CATEGORIES } from '@/lib/constants';

// Pre-map labels for fast lookup
const ALL_LABELS: Record<string, string> = {};
[...GENRE_CATEGORIES, ...FIELD_CATEGORIES].forEach(c => {
    ALL_LABELS[c.id] = c.label;
});

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
        
        // 1. Fetch Project from Firestore
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
             toast.error("프로젝트를 찾을 수 없습니다.");
             setLoading(false);
             return;
        }

        const projectData = projectSnap.data();
        
        // Safe Parse custom_data (if it's a string, though in Firestore it should be object)
        if (typeof projectData.custom_data === 'string') {
            try { projectData.custom_data = JSON.parse(projectData.custom_data); } 
            catch (e) { console.error("Failed to parse custom_data", e); projectData.custom_data = {}; }
        }
        setProject(projectData);

        // 2. Fetch Evaluations from Firestore
        const evalsRef = collection(db, "evaluations");
        const q = query(evalsRef, where("projectId", "==", projectId));
        const querySnapshot = await getDocs(q);

        const fetchedRatings = querySnapshot.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                created_at: data.createdAt?.toDate ? data.createdAt.toDate() : (new Date(data.createdAt) || new Date()), // Handle Timestamp
                user_id: data.user_uid, // Map for backward compatibility
                score: data.score
            };
        });

        console.log(`[ReportPage] Loaded ${fetchedRatings.length} evaluations.`);
        setRatings(fetchedRatings);

      } catch (err) {
        console.error("Fetch report error:", err);
        toast.error("데이터 로드 중 오류 발생");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const reportStats = useMemo(() => {
    if (!project) return null;

    const auditConfig = project.custom_data?.audit_config;
    // Default 6 categories fallback
    const categories = auditConfig?.categories || [
      { id: 'score_1', label: '기획력' },
      { id: 'score_2', label: '독창성' },
      { id: 'score_3', label: '심미성' },
      { id: 'score_4', label: '완성도' },
      { id: 'score_5', label: '상업성' },
      { id: 'score_6', label: '편의성' },
    ];

    // Client-side Calculation with Robust Fallback
    const radarData = categories.map((cat: any, index: number) => {
      const sum = ratings.reduce((acc, curr) => {
          let val = 0;
          // 1. Try exact match (scores.score_1)
          if (curr.scores?.[cat.id] !== undefined) val = curr.scores[cat.id];
          // 2. Try root level match (curr.score_1)
          else if (curr[cat.id] !== undefined) val = curr[cat.id];
          
          // 3. Fallback: Try matching by index if scores is an object (for mismatched IDs)
          if (val === 0 && curr.scores) {
              const values = Object.values(curr.scores);
              // Assuming values are numbers, try to grab by index
              if (values[index] !== undefined && typeof values[index] === 'number') {
                  val = values[index] as number;
              }
          }
          return acc + val;
      }, 0);

      const avg = ratings.length > 0 ? (sum / ratings.length).toFixed(1) : 0;
      return {
        subject: cat.label,
        value: Number(avg),
        fullMark: 5
      };
    });

    const stickerOptions = auditConfig?.poll?.options || [
        { id: 'poll_1', label: '당장 계약하시죠! 탐나는 결과물', color: '#10b981' },
        { id: 'poll_2', label: '좋긴 한데... 한 끗이 아쉽네요', color: '#f59e0b' },
        { id: 'poll_3', label: '기획부터 다시! 싹 갈아엎읍시다', color: '#ef4444' },
    ];
    
    const polls: Record<string, number> = {};
    ratings.forEach(r => {
      if (r.vote_type) {
        polls[r.vote_type] = (polls[r.vote_type] || 0) + 1;
      }
    });

    const barData = stickerOptions.map((opt: any, index: number) => {
      let count = polls[opt.id] || 0;
      
      // Fallback 1: Match by Label
      if (count === 0 && polls[opt.label]) {
          count = polls[opt.label];
      }
      
      // Fallback 2: Match by generic ID (poll_1, poll_2, etc.) based on index
      if (count === 0) {
          const genericId = `poll_${index + 1}`;
          if (polls[genericId]) count = polls[genericId];
      }

      return {
        name: opt.label,
        value: count,
        color: opt.color || '#f59e0b'
      };
    });

    // Calculate Overall Average from all radar values
    const totalSum = radarData.reduce((acc: number, curr: any) => acc + curr.value, 0);
    const overallAvg = radarData.length > 0 ? (totalSum / radarData.length).toFixed(1) : "0.0";

    // Calculate Distributions
    const expertiseDistribution: Record<string, number> = {};
    const occupationDistribution: Record<string, number> = {};

    ratings.forEach(r => {
        if (r.expertise && Array.isArray(r.expertise)) {
            r.expertise.forEach((e: string) => { expertiseDistribution[e] = (expertiseDistribution[e] || 0) + 1; });
        }
        if (r.occupation) {
            occupationDistribution[r.occupation] = (occupationDistribution[r.occupation] || 0) + 1;
        }
    });

    return { 
      radarData, 
      barData, 
      overallAvg, 
      participantCount: ratings.length,
      categories,
      expertiseDistribution,
      occupationDistribution
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
      <MyRatingIsHeader />

      <main className="max-w-7xl mx-auto px-6 pt-40 pb-24 space-y-20">
         {/* Hero Title */}
         <section className="text-center space-y-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-center">
               <div className="px-4 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ChefHat size={14} /> Evaluation Final Report
               </div>
            </motion.div>
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-7xl font-black tracking-tighter">
               {project?.title} <span className="text-white/20">평가 결과</span>
            </motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-white/40 max-w-2xl mx-auto font-medium">
               누적 {reportStats?.participantCount}명의 전문가 시선으로 분석된<br />미슐랭 5성 프로젝트 리포트입니다.
            </motion.p>
         </section>

         {/* Charts Grid */}
         <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Michelin Radar */}
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/5 border border-white/5 p-10 rounded-[3rem] space-y-8 flex flex-col">
               <h3 className="text-2xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-orange-600 rounded-full" /> 평점 평가 분석
               </h3>
               <div className="h-[400px] w-full min-h-[400px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={reportStats?.radarData}>
                      <PolarGrid stroke="#ffffff10" radialLines={false} gridType="polygon" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar
                        name="Avg Score"
                        dataKey="value"
                        stroke="#ea580c"
                        fill="#ea580c"
                        fillOpacity={0.6}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
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
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/5 border border-white/5 p-10 rounded-[3rem] space-y-8 flex flex-col">
               <h3 className="text-2xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" /> Sticker Decision Status
               </h3>
               <div className="h-[300px] w-full min-h-[300px] relative">
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

            {/* Expert Participation by Field */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white/5 border border-white/5 p-10 rounded-[3rem] space-y-8 lg:col-span-2">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> Expert Participation by Field
                  </h3>
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Participation Insight</div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="h-[250px] w-full min-h-[250px] relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(reportStats?.expertiseDistribution || {}).map(([id, count]) => ({
                           name: ALL_LABELS[id] || id,
                           value: count
                        }))}>
                           <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <Tooltip 
                               cursor={{ fill: 'transparent' }}
                               contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #ffffff10', borderRadius: '16px' }}
                               itemStyle={{ color: '#fff' }}
                           />
                           <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]}>
                              {(Object.entries(reportStats?.expertiseDistribution || {})).map((_, index) => (
                                 <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 content-center items-center h-full">
                     {Object.entries(reportStats?.expertiseDistribution || {}).map(([id, count], i) => (
                        <div key={i} className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-blue-500/50 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Field Specialist</span>
                              <span className="text-sm font-bold text-white/80">{ALL_LABELS[id] || id}</span>
                           </div>
                           <div className="h-8 w-px bg-white/10 mx-1" />
                           <span className="text-xl font-black text-blue-400">{count as any}</span>
                        </div>
                     ))}
                     {Object.keys(reportStats?.expertiseDistribution || {}).length === 0 && (
                        <div className="w-full p-8 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                           <p className="text-white/20 font-bold italic">참여 전문가의 전문 분야 통계가 아직 집계되지 않았습니다.</p>
                        </div>
                     )}
                  </div>
               </div>
            </motion.div>
         </section>

         {/* Summary Stats */}
         <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '참여 전문가', value: reportStats?.participantCount || 0, icon: Users, color: 'text-blue-400' },
              { label: '종합 평점', value: reportStats?.overallAvg || '0.0', icon: Star, color: 'text-orange-400' },
              { label: '최고 평가 항목', value: reportStats?.radarData ? [...reportStats.radarData].sort((a:any, b:any) => b.value - a.value)[0]?.subject : '-', icon: Trophy, color: 'text-amber-300' },
              { label: '바이럴 점수', value: 'TOP 5%', icon: Rocket, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i*0.1 }} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.08] transition-colors group">
                 <stat.icon className={cn("w-6 h-6 mb-4", stat.color)} />
                 <p className="text-white/30 text-[10px] font-black mb-1 uppercase tracking-widest">{stat.label}</p>
                 <h3 className="text-3xl font-black">{stat.value}</h3>
              </motion.div>
            ))}
         </section>

         {/* Detailed Evaluation Table */}
         <section className="space-y-10">
            <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-emerald-600 rounded-full" /> 평가 기록
                </h3>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Sorted by Date (Asc)</span>
            </div>
            <div className="overflow-x-auto rounded-[2.5rem] border border-white/5 bg-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest w-20">No.</th>
                            <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">참여자 정보</th>
                            <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">일시</th>
                            <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">평점 평가</th>
                            <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">전문분야</th>
                        </tr>
                    </thead>
                    <tbody>
                         {ratings.length > 0 ? (
                          [...ratings].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((r, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="px-8 py-6 text-sm font-black text-white/20">{(i+1).toString().padStart(2, '0')}</td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border uppercase tracking-tighter",
                                                r.user_id 
                                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                                                  : "bg-white/5 text-white/40 border-white/10"
                                            )}>
                                                {r.user_id ? "Pro" : "G"}
                                            </div>
                                            <span className="text-sm font-bold text-white/90">
                                                {r.username || (r.user_id ? '익명의 전문가' : '비회원 게스트')}
                                            </span>
                                            {r.age_group && (
                                                <span className="text-[10px] font-bold text-white/40 px-1.5 py-0.5 bg-white/5 rounded">
                                                    {r.age_group}
                                                </span>
                                            )}
                                            {r.gender && (
                                                <span className="text-[10px] font-bold text-white/40 px-1.5 py-0.5 bg-white/5 rounded">
                                                    {r.gender}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pl-11">
                                             {r.occupation ? (
                                                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-black rounded border border-green-500/20 uppercase tracking-tight">
                                                    {r.occupation}
                                                </span>
                                             ) : (
                                                <span className="px-2 py-0.5 bg-white/5 text-white/20 text-[9px] font-black rounded border border-white/10 uppercase tracking-tight">
                                                    직업 미입력
                                                </span>
                                             )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-sm text-white/40 font-medium">{new Date(r.created_at).toLocaleDateString()}</td>
                                <td className="px-8 py-6 text-center">
                                    <span className="text-orange-500 font-black text-lg">{r.score ? r.score.toFixed(1) : '-'}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-wrap gap-1">
                                        {r.expertise && r.expertise.length > 0 ? (
                                            r.expertise.map((exp: string, idx: number) => (
                                                <span key={idx} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black rounded border border-blue-500/20">
                                                    {ALL_LABELS[exp] || exp}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-white/20 text-[10px]">-</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-white/20 font-bold uppercase tracking-widest">접수된 내역이 없습니다.</td>
                          </tr>
                        )}
                    </tbody>
                </table>
            </div>
         </section>

         {/* Reviews List */}
         <section className="space-y-10">
            <h3 className="text-3xl font-black flex items-center gap-3">
               <MessageSquare className="text-orange-600" /> 상세 평가 의견 리포트
            </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ratings.length > 0 ? (
                  ratings.map((r, i) => {
                    const hasCustomAnswers = r.custom_answers && Object.keys(r.custom_answers).length > 0;
                    const hasProposal = !!r.proposal;
                    const hasAnyFeedback = hasCustomAnswers || hasProposal;

                    return (
                      <motion.div 
                        key={i} 
                        initial={{ y: 20, opacity: 0 }} 
                        whileInView={{ y: 0, opacity: 1 }} 
                        viewport={{ once: true }}
                        className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all flex flex-col gap-8 h-full"
                      >
                         <div className="flex items-center justify-between shrink-0">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-white/40 border border-white/10 uppercase tracking-tighter shadow-sm">
                                     {r.username ? r.username.substring(0, 1) : `E${i+1}`}
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-sm font-black text-white/90">{r.username || 'Anonymous Expert'}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {(r.expertise || []).map((exp: string, idx: number) => (
                                            <span key={idx} className="px-2 py-0.5 bg-white/5 text-[9px] font-bold text-white/40 rounded border border-white/10">
                                                #{ALL_LABELS[exp] || exp}
                                            </span>
                                        ))}
                                        {r.occupation && (
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-[9px] font-bold text-emerald-400 rounded border border-emerald-500/10 uppercase tracking-tighter">
                                                {r.occupation}
                                            </span>
                                        )}
                                    </div>
                                </div>
                             </div>
                             <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-orange-400 border border-orange-500/20 shadow-lg shrink-0">
                                AVG {r.score?.toFixed(1) || '0.0'}
                             </div>
                          </div>
                         
                         <div className="space-y-6 flex-1">
                            {/* Custom Answers */}
                            {hasCustomAnswers ? (
                                Object.entries(r.custom_answers || {}).map(([q, a], qIdx) => (
                                    <div key={qIdx} className="space-y-2 group/q">
                                       <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest px-2 py-0.5 bg-orange-500/5 rounded border border-orange-500/10">질문 {qIdx + 1}</span>
                                          <div className="h-px flex-1 bg-white/5" />
                                       </div>
                                       <p className="text-xs font-bold text-white/60 leading-relaxed italic group-hover/q:text-white/80 transition-colors">"{q}"</p>
                                       <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                                          <p className="text-sm font-medium text-white/90 leading-relaxed">{a as string}</p>
                                       </div>
                                    </div>
                                ))
                            ) : !hasProposal ? (
                                <div className="h-full flex flex-col items-center justify-center py-12 space-y-3 opacity-20">
                                   <MessageSquare size={32} />
                                   <p className="text-xs font-bold uppercase tracking-widest">No detailed comments provided</p>
                                </div>
                            ) : null}

                            {/* Final Proposal */}
                            {hasProposal && (
                                <div className="space-y-4 pt-4">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest px-2 py-0.5 bg-blue-400/5 rounded border border-blue-400/10">종합 평가 의견</span>
                                      <div className="h-px flex-1 bg-white/5" />
                                   </div>
                                   <div className="bg-gradient-to-br from-white/5 to-white/[0.02] p-6 rounded-[2rem] text-sm font-medium leading-relaxed italic text-orange-100 border border-white/10 shadow-inner">
                                     "{r.proposal}"
                                   </div>
                                </div>
                            )}
                         </div>

                         {/* Result Badge or Stats if any */}
                         <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-white/20">
                            <span>전문가 검증 레벨 A+</span>
                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                         </div>
                      </motion.div>
                    );
                  })
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
            <p className="text-xs font-black uppercase tracking-[0.4em]">MyRatingIs Evaluation System &copy; 2026</p>
         </div>
      </footer>
    </div>
  );
}
