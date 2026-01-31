"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase/client"; // Firebase
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "firebase/firestore"; // Firestore methods
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
  ChevronRight,
  Printer,
  FileText,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown
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

import { useAuth } from "@/lib/auth/AuthContext";

// Pre-map labels for fast lookup
const ALL_LABELS: Record<string, string> = {};
[...GENRE_CATEGORIES, ...FIELD_CATEGORIES].forEach(c => {
    ALL_LABELS[c.id] = c.label;
});

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth(); // Auth Info
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const handleDownloadCSV = () => {
    if (!ratings || ratings.length === 0) return toast.error("다운로드할 데이터가 없습니다.");

    // CSV Header
    const headers = ["User", "Job", "Score", "Date", "Review Details"];
    
    // CSV Rows
    const rows = ratings.map(r => {
       const name = r.user_nickname || r.username || "Anonymous";
       const job = r.user_job || r.expertise?.[0] || "";
       const score = r.score || 0;
       const date = new Date(r.created_at).toLocaleDateString();
       const proposal = (r.proposal || "").replace(/"/g, '""'); // Escape quotes
       const answers = Object.entries(r.custom_answers || {})
           .map(([q, a]) => `${q}: ${a}`)
           .join(" | ")
           .replace(/"/g, '""');

       return `"${name}","${job}","${score}","${date}","Proposal: ${proposal} / Answers: ${answers}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${project?.title || 'project'}_evaluation_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
      window.print();
  };

  // ... (useEffect fetchData same as before) ...

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
        
        // --- View Count Increment (Report Page Visit) ---
        const viewKey = `viewed_${projectId}`;
        if (typeof window !== 'undefined' && !sessionStorage.getItem(viewKey)) {
             try {
                // Async update
                updateDoc(projectRef, { 
                    views: increment(1),
                    views_count: increment(1),
                    view_count: increment(1)
                });
                sessionStorage.setItem(viewKey, 'true');
                // Optimistic Update
                projectData.views = (projectData.views || 0) + 1;
                projectData.views_count = (projectData.views_count || 0) + 1;
             } catch(e) { console.warn("View increment failed", e); }
        }
        // ------------------------------------------------

        // --- View Count Correction (Only for '와요' project, Min 135) ---
        if (projectData.title?.includes("와요") && (projectData.views || 0) < 135) {
            try {
                // Async update
                updateDoc(projectRef, { 
                    views: 135,
                    views_count: 135,
                    view_count: 135
                });
                projectData.views = 135; 
                projectData.views_count = 135;
            } catch(e) { console.warn("Failed to update view count", e); }
        }
        // ----------------------------------------------------------------
        
        // Safe Parse custom_data
        if (typeof projectData.custom_data === 'string') {
            try { projectData.custom_data = JSON.parse(projectData.custom_data); } 
            catch (e) { console.error("Failed to parse custom_data", e); projectData.custom_data = {}; }
        }
        setProject(projectData);

        // 2. Fetch Evaluations from Firestore
        const evalsRef = collection(db, "evaluations");
        const q = query(evalsRef, where("projectId", "==", projectId));
        const querySnapshot = await getDocs(q);

        let fetchedRatings = querySnapshot.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                created_at: data.createdAt?.toDate ? data.createdAt.toDate() : (new Date(data.createdAt) || new Date()),
                user_id: data.user_uid,
                score: data.score
            };
        });

        // 3. Fetch latest user profiles to show up-to-date info (e.g. if job was "Unset" but now "Planner")
        const uniqueUserIds = [...new Set(fetchedRatings.map((r: any) => r.user_uid).filter(Boolean))];
        
        if (uniqueUserIds.length > 0) {
            try {
                // Fetch users in parallel
                const userDocs = await Promise.all(
                    uniqueUserIds.map(uid => getDoc(doc(db, "users", uid as string)))
                );
                
                const userMap: Record<string, any> = {};
                userDocs.forEach(snap => {
                    if (snap.exists()) {
                        userMap[snap.id] = snap.data();
                    }
                });

                // Merge latest info into ratings
                fetchedRatings = fetchedRatings.map((r: any) => {
                    const latestUser = r.user_uid ? userMap[r.user_uid] : null;
                    if (latestUser) {
                        return {
                            ...r,
                            user_nickname: latestUser.nickname || latestUser.displayName || r.user_nickname,
                            user_job: latestUser.job || latestUser.occupation || (latestUser.expertise && latestUser.expertise.length > 0 ? latestUser.expertise[0] : r.user_job),
                            expertise: latestUser.expertise || r.expertise || [],
                            occupation: latestUser.occupation || r.occupation,
                            age_group: latestUser.age_group || r.age_group,
                            gender: latestUser.gender || r.gender,
                        };
                    }
                    return r;
                });
                
                console.log(`[ReportPage] Synced latest profiles for ${uniqueUserIds.length} users.`);
            } catch (userErr) {
                console.warn("Failed to sync latest user profiles", userErr);
                // Continue with original ratings if sync fails
            }
        }

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

  // Share Handler
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("리포트 링크가 복사되었습니다!");
  };

  const reportStats = useMemo(() => {
    if (!project) return null;

    // --- Access Control Logic ---
    // --- Access Control Logic ---
    const isOwner = user?.uid === project.user_id;
    // Check 'result_visibility' in custom_data (Default to public if undefined)
    const resultVisibility = project.custom_data?.result_visibility || 'public';
    const isResultPublic = resultVisibility === 'public';

    // Check if current user has participated
    const myRating = ratings.find(r => r.user_uid === user?.uid); 
    
    // Determine which ratings to show
    let targetRatings = ratings;
    let accessDenied = false;
    let isPersonalView = false;

    if (!isResultPublic && !isOwner) {
        if (myRating) {
            // Evaluator viewing Private Report -> Show ONLY their rating (Personal View)
            targetRatings = [myRating];
            isPersonalView = true;
        } else {
            // Unauthorized (Private Report, Not Owner, Not Evaluated)
            accessDenied = true;
        }
    }

    if (accessDenied) return { accessDenied: true };

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
      // 1. Calculate Average
      const sum = targetRatings.reduce((acc, curr) => {
          let val = 0;
          if (curr.scores?.[cat.id] !== undefined) val = curr.scores[cat.id];
          else if (curr[cat.id] !== undefined) val = curr[cat.id];
          
          if (val === 0 && curr.scores) {
              const values = Object.values(curr.scores);
              // Assuming values are numbers, try to grab by index
              if (values[index] !== undefined && typeof values[index] === 'number') {
                  val = values[index] as number;
              }
          }
          return acc + val;
      }, 0);

      const avg = targetRatings.length > 0 ? (sum / targetRatings.length).toFixed(1) : 0;
      
      // 2. Calculate My Score (if exists)
      let myVal = 0;
      if (myRating) {
          if (myRating.scores?.[cat.id] !== undefined) myVal = myRating.scores[cat.id];
          else if (myRating[cat.id] !== undefined) myVal = myRating[cat.id];
          if (myVal === 0 && myRating.scores) {
               const values = Object.values(myRating.scores);
               if (values[index] !== undefined && typeof values[index] === 'number') {
                   myVal = values[index] as number;
               }
          }
      }

      return {
        subject: cat.label,
        value: Number(avg),
        myValue: Number(myVal),
        fullMark: 5
      };
    });

    const stickerOptions = auditConfig?.poll?.options || [
        { id: 'poll_1', label: '당장 계약하시죠! 탐나는 결과물', color: '#10b981' },
        { id: 'poll_2', label: '좋긴 한데... 한 끗이 아쉽네요', color: '#f59e0b' },
        { id: 'poll_3', label: '기획부터 다시! 싹 갈아엎읍시다', color: '#ef4444' },
    ];
    
    const polls: Record<string, number> = {};
    const NORMALIZE_VOTE: Record<string, string> = {
        'launch': 'poll_1',
        'invest': 'poll_2',
        'develop': 'poll_3',
        'so-good': 'poll_1',
        'good': 'poll_2',
        'bad': 'poll_3'
    };

    targetRatings.forEach(r => {
      if (r.vote_type) {
        const v = r.vote_type;
        const normalized = NORMALIZE_VOTE[v] || v;
        polls[normalized] = (polls[normalized] || 0) + 1;
        if (normalized !== v) polls[v] = (polls[v] || 0) + 1;
      }
    });

    // Determine My Vote
    let myVoteId: string | null = null;
    if (myRating && myRating.vote_type) {
        myVoteId = NORMALIZE_VOTE[myRating.vote_type] || myRating.vote_type;
    }

    const barData = stickerOptions.map((opt: any, index: number) => {
      let count = polls[opt.id] || 0;
      if (count === 0 && polls[opt.label]) count = polls[opt.label];
      if (count === 0) {
          const genericId = `poll_${index + 1}`;
          if (polls[genericId]) count = polls[genericId];
      }
      
      // Check if this option matches my vote logic (simple ID or label match)
      const isMyChoice = (myVoteId === opt.id) || (myVoteId === opt.label) || (myVoteId === `poll_${index + 1}`);

      return {
        name: opt.label,
        value: count,
        color: opt.color || '#f59e0b',
        isMyChoice
      };
    });

    // Calculate Overall Average from all radar values
    const totalSum = radarData.reduce((acc: number, curr: any) => acc + curr.value, 0);
    const overallAvg = radarData.length > 0 ? (totalSum / radarData.length).toFixed(1) : "0.0";

    // Calculate Distributions
    const expertiseDistribution: Record<string, number> = {};
    const occupationDistribution: Record<string, number> = {};

    targetRatings.forEach(r => {
        const job = r.user_job || r.occupation || (r.expertise && r.expertise.length > 0 ? r.expertise[0] : null) || '미설정';
        expertiseDistribution[job] = (expertiseDistribution[job] || 0) + 1;
        if (r.user_job) occupationDistribution[r.user_job] = (occupationDistribution[r.user_job] || 0) + 1;
    });

    // Sort Ratings: My Rating Top
    const sortedRatings = [...targetRatings].sort((a, b) => {
        if (myRating && a.id === myRating.id) return -1;
        if (myRating && b.id === myRating.id) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const isComparisonAvailable = isResultPublic && !!myRating && targetRatings.length > 1;

    return { 
      radarData, 
      barData, 
      stickerOptions, 
      overallAvg, 
      participantCount: targetRatings.length,
      totalParticipantCount: ratings.length,
      categories,
      expertiseDistribution,
      occupationDistribution,
      accessDenied,
      isPersonalView,
      sortedRatings,
      isComparisonAvailable,
      isOwner,
      isResultPublic
    };
  }, [project, ratings, user]);
  
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTableRatings = useMemo(() => {
    if (!reportStats?.sortedRatings) return [];
    const data = [...reportStats.sortedRatings];
    if (sortConfig) {
      data.sort((a, b) => {
        let aValue: any = '', bValue: any = '';
        switch (sortConfig.key) {
           case 'no': // Sort by Date as a proxy for sequential ID
             aValue = new Date(a.created_at).getTime();
             bValue = new Date(b.created_at).getTime();
             break; 
           case 'info':
             aValue = a.user_nickname || 'Z'; 
             bValue = b.user_nickname || 'Z';
             break;
           case 'score':
             aValue = a.score || 0;
             bValue = b.score || 0;
             break;
           case 'specialty':
             const getExp = (r: any) => (r.expertise && r.expertise.length > 0 ? r.expertise.join('') : (r.user_job || ''));
             aValue = getExp(a);
             bValue = getExp(b);
             break;
           case 'date':
             aValue = new Date(a.created_at).getTime();
             bValue = new Date(b.created_at).getTime();
             break;
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [reportStats, sortConfig]);

  const currentTableData = sortedTableRatings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-white rounded-full animate-spin" /></div>;
  if (!project) return null;

  if (reportStats?.accessDenied) {
      return (
          <div className="min-h-screen bg-[#050505] text-white font-pretendard flex flex-col">
              <MyRatingIsHeader />
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-6 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Rocket className="w-8 h-8 text-white/20" /> {/* Should be Lock icon really, using Rocket as placeholder or import Lock */}
                  </div>
                  <h1 className="text-3xl font-black">비공개 리포트입니다</h1>
                  <p className="text-white/40 max-w-sm leading-relaxed">
                      이 프로젝트의 평가 결과는 비공개로 설정되어 있습니다.<br/>
                      프로젝트 소유자이거나, 평가에 참여한 경우에만<br/>본인의 결과를 확인할 수 있습니다.
                  </p>
                  <Button onClick={() => router.push(`/review/viewer?projectId=${projectId}`)} className="h-14 px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 font-bold text-white uppercase tracking-widest mt-4">
                      평가 참여하기
                  </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-pretendard">
      <MyRatingIsHeader />

      <main className="max-w-7xl mx-auto px-6 pt-40 pb-24 space-y-20">
         {/* Hero Title */}
         <section className="text-center space-y-6 relative">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-center">
               <div className="px-4 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <ChefHat size={14} /> 
                   {reportStats?.isPersonalView 
                      ? "Personal Evaluation Report" 
                      : (!reportStats?.isResultPublic && reportStats?.isOwner 
                          ? "🔒 Private Report (Owner Access)" 
                          : "Evaluation Final Report")}
               </div>
            </motion.div>
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-7xl font-black tracking-tighter">
               {project?.title} <span className="text-white/20">평가 결과</span>
            </motion.h1>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-6">
                <p className="text-lg text-white/40 max-w-2xl mx-auto font-medium break-keep">
                   {reportStats?.isPersonalView ? (
                       <>이 프로젝트는 의뢰자가 평가 결과를 <span className="text-orange-500 font-bold">비공개</span>로 설정하였습니다.<br/>따라서 셰프님께서 작성하신 <span className="text-white font-bold">본인의 평가 기록만 확인</span>하실 수 있습니다.</>
                   ) : (!reportStats?.isResultPublic && reportStats?.isOwner ? (
                       <>비공개로 설정된 리포트입니다.<br/>
                       <span className="text-orange-500 font-bold">프로젝트 소유자 권한</span>으로 전체 결과를 열람하고 있습니다.</>
                   ) : (
                       <>누적 {reportStats?.totalParticipantCount}명의 전문가 시선으로 분석된<br/>미슐랭 5성 프로젝트 리포트입니다.</>
                   ))}
                </p>
                <style>{`
                    @media print {
                        @page { margin: 1cm; }
                        body { background: white !important; color: black !important; }
                        .no-print, header, footer, button { display: none !important; }
                        .print-break-inside { break-inside: avoid; }
                    }
                `}</style>
                <div className="flex flex-wrap justify-center gap-3">
                    <Button onClick={handleShare} variant="outline" className="rounded-full border-white/10 hover:bg-white/10 text-white/60 hover:text-white gap-2 h-10 px-6 no-print">
                        <Share2 size={14} /> 리포트 공유하기
                    </Button>
                    
                    {reportStats?.isOwner && (
                        <>
                            <Button onClick={handleDownloadCSV} variant="outline" className="rounded-full border-white/10 hover:bg-white/10 text-white/60 hover:text-white gap-2 h-10 px-6 no-print">
                                <FileText size={14} /> CSV 저장
                            </Button>
                            <Button onClick={handlePrint} variant="outline" className="rounded-full border-white/10 hover:bg-white/10 text-white/60 hover:text-white gap-2 h-10 px-6 no-print">
                                <Printer size={14} /> PDF 저장
                            </Button>
                        </>
                    )}
                </div>
            </motion.div>
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
                        name="전체 평균"
                        dataKey="value"
                        stroke="#ea580c"
                        fill="#ea580c"
                        fillOpacity={0.4}
                      />
                      {reportStats?.isComparisonAvailable && (
                        <Radar
                          name="내 점수"
                          dataKey="myValue"
                          stroke="#818cf8"
                          fill="#818cf8"
                          fillOpacity={0.4}
                        />
                      )}
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ fontWeight: 'bold' }}
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
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" /> 스티커 투표 현황
               </h3>
               <div className="grid grid-cols-1 gap-4">
                  {reportStats?.barData.map((d: any, i: number) => (
                    <div key={i} className={cn(
                        "relative p-5 rounded-2xl border transition-all flex items-center justify-between group overflow-hidden",
                        d.isMyChoice 
                            ? "bg-white/10 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]" 
                            : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                    )}>
                       {d.isMyChoice && (
                           <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500 text-white text-[9px] font-black uppercase rounded-bl-xl z-20 shadow-lg">You Voted</div>
                       )}
                       
                       <div className="flex items-center gap-4 z-10 mr-4">
                           {/* Sticker Circle */}
                           <div 
                             className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-black text-lg shadow-lg"
                             style={{ backgroundColor: d.color, color: 'rgba(0,0,0,0.4)', textShadow: '0 1px 0 rgba(255,255,255,0.2)' }}
                           >
                              {i+1}
                           </div>
                           
                           <div className="flex flex-col min-w-0">
                              <span className={cn("text-sm font-bold leading-tight break-keep", d.isMyChoice ? "text-white" : "text-white/60")}>
                                  {d.name}
                              </span>
                           </div>
                       </div>

                       <div className="flex flex-col items-end z-10 shrink-0">
                          <span className="text-2xl font-black">{d.value}</span>
                          <span className="text-[10px] font-bold text-white/30 uppercase">Votes</span>
                       </div>
                       
                       {/* Background Fill for Progress visualization */}
                       <div 
                         className="absolute inset-y-0 left-0 bg-white/5 z-0 transition-all duration-1000" 
                         style={{ width: `${(d.value / (reportStats?.totalParticipantCount || 1)) * 100}%` }} 
                       />
                    </div>
                  ))}
               </div>
            </motion.div>

            {/* Expert Participation by Field */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white/5 border border-white/5 p-10 rounded-[3rem] space-y-8 lg:col-span-2">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> 분야별 전문가 참여 현황
                  </h3>
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">참여 분석</div>
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
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">분야 전문가</span>
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
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">최신순</span>
            </div>
            <div className="overflow-x-auto rounded-[2.5rem] border border-white/5 bg-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th onClick={() => handleSort('no')} className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest w-20 cursor-pointer hover:text-white/60 transition-colors select-none group">
                                <div className="flex items-center">No.{sortConfig?.key === 'no' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-20 group-hover:opacity-50"/>}</div>
                            </th>
                            <th onClick={() => handleSort('info')} className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest cursor-pointer hover:text-white/60 transition-colors select-none group">
                                <div className="flex items-center">참여자 정보{sortConfig?.key === 'info' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-20 group-hover:opacity-50"/>}</div>
                            </th>
                            <th onClick={() => handleSort('specialty')} className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest cursor-pointer hover:text-white/60 transition-colors select-none group">
                                <div className="flex items-center">전문분야{sortConfig?.key === 'specialty' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-20 group-hover:opacity-50"/>}</div>
                            </th>
                            <th onClick={() => handleSort('score')} className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest cursor-pointer hover:text-white/60 transition-colors select-none group">
                                <div className="flex items-center">평가 결과{sortConfig?.key === 'score' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-20 group-hover:opacity-50"/>}</div>
                            </th>
                            <th onClick={() => handleSort('date')} className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right text-xs cursor-pointer hover:text-white/60 transition-colors select-none group">
                                <div className="flex items-center justify-end">일시{sortConfig?.key === 'date' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-20 group-hover:opacity-50"/>}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                         {currentTableData && currentTableData.length > 0 ? (
                          currentTableData.map((r, i) => {
                            const isMyReview = r.user_uid === user?.uid;
                            const displayNo = (currentPage - 1) * itemsPerPage + i + 1;
                            const demographics = [r.age_group, r.gender, (r.occupation || r.user_job)].filter(Boolean).join(' · ');

                            return (
                              <tr key={i} className={cn(
                                  "border-b border-white/5 transition-colors", 
                                  isMyReview ? "bg-indigo-500/10 hover:bg-indigo-500/20" : "hover:bg-white/[0.02]"
                              )}>
                                  <td className={cn("px-8 py-6 text-sm font-black", isMyReview ? "text-indigo-400" : "text-white/20")}>
                                      {isMyReview ? "ME" : displayNo.toString().padStart(2, '0')}
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-3">
                                              <div className={cn(
                                                  "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border uppercase tracking-tighter shrink-0",
                                                  r.user_id 
                                                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                                                    : "bg-white/5 text-white/40 border-white/10"
                                              )}>
                                                  {isMyReview ? "ME" : (r.user_id ? "Pro" : "G")}
                                              </div>
                                              <span className={cn("text-sm font-bold", isMyReview ? "text-indigo-300" : "text-white/90")}>
                                                  {isMyReview ? (r.user_nickname || "나의 평가") : (r.user_nickname || r.username || (r.user_id ? '익명의 전문가' : '비회원 게스트'))}
                                              </span>
                                          </div>
                                          {demographics && (
                                              <div className="pl-11 text-[11px] font-medium text-white/40">
                                                  {demographics}
                                              </div>
                                          )}
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      {r.expertise && r.expertise.length > 0 ? (
                                           <div className="flex flex-wrap gap-1">
                                               {r.expertise.map((exp: string, idx: number) => (
                                                   <span key={idx} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20">
                                                       {exp}
                                                   </span>
                                               ))}
                                           </div>
                                      ) : (
                                          <span className="text-white/20 text-[10px]">-</span>
                                      )}
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-3">
                                           <span className={cn("font-black text-lg leading-none", isMyReview ? "text-indigo-400" : "text-orange-500")}>
                                               {r.score ? r.score.toFixed(1) : '-'}
                                           </span>
                                           {r.vote_type && (
                                               <span className="text-[11px] font-bold text-white/50 pl-3 border-l border-white/10 line-clamp-1">
                                                   {reportStats?.stickerOptions?.find((o: any) => o.id === r.vote_type || o.label === r.vote_type)?.label || r.vote_type}
                                               </span>
                                           )}
                                      </div>
                                  </td>
                                  <td className="px-8 py-6 text-xs text-white/20 font-medium text-right font-mono">
                                      {new Date(r.created_at).toLocaleDateString()}
                                  </td>
                              </tr>
                            );
                          })
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-break-inside">
                {reportStats?.sortedRatings && reportStats.sortedRatings.length > 0 ? (
                  reportStats.sortedRatings
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((r, i) => {
                    const hasCustomAnswers = r.custom_answers && Object.keys(r.custom_answers).length > 0;
                    const hasProposal = !!r.proposal;
                    const hasAnyFeedback = hasCustomAnswers || hasProposal;

                    return (
                      <motion.div 
                        key={i} 
                        initial={{ y: 20, opacity: 0 }} 
                        whileInView={{ y: 0, opacity: 1 }} 
                        viewport={{ once: true }}
                        className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all flex flex-col gap-8 h-full break-inside-avoid"
                      >
                         {/* ... (keep existing card content same as before, just copying structure for context match if needed, but since we are replacing the block container, we need to provide full content or use precise targeting) */}
                         <div className="flex items-center justify-between shrink-0">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-white/40 border border-white/10 uppercase tracking-tighter shadow-sm">
                                     {(r.user_nickname || r.username || 'A').substring(0, 1)}
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-sm font-black text-white/90">{r.user_nickname || r.username || 'Anonymous Expert'}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {r.user_job && (
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-[9px] font-bold text-emerald-400 rounded border border-emerald-500/10 uppercase tracking-tighter">
                                                {r.user_job}
                                            </span>
                                        )}
                                        {!r.user_job && (r.expertise || []).map((exp: string, idx: number) => (
                                            <span key={idx} className="px-2 py-0.5 bg-white/5 text-[9px] font-bold text-white/40 rounded border border-white/10">
                                                #{ALL_LABELS[exp] || exp}
                                            </span>
                                        ))}
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
             
             {/* Pagination Controls */}
             {reportStats?.sortedRatings && reportStats.sortedRatings.length > itemsPerPage && (
                <div className="flex justify-center gap-2 mt-12 no-print">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
                    >
                        <ArrowLeft size={16} />
                    </Button>
                    {Array.from({ length: Math.ceil(reportStats.sortedRatings.length / itemsPerPage) }, (_, i) => i + 1).map(p => (
                        <button 
                            key={p} 
                            onClick={() => setCurrentPage(p)}
                            className={cn(
                                "w-10 h-10 rounded-full font-bold text-sm transition-all",
                                currentPage === p 
                                    ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {p}
                        </button>
                    ))}
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={currentPage === Math.ceil(reportStats.sortedRatings.length / itemsPerPage)}
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(reportStats.sortedRatings.length / itemsPerPage), p + 1))}
                        className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
             )}
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
