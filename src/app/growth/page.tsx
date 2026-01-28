"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Trophy, Crown, Medal, Star, Users, Briefcase } from "lucide-react";
import { ProjectGridSkeleton } from "@/components/ui/ProjectSkeleton";
import { ImageCard } from "@/components/ImageCard";
import { getCategoryNameById } from "@/lib/categoryMap";
import { useAuth } from "@/lib/auth/AuthContext";
import { PopupModal } from "@/components/PopupModal";
import { toast } from "sonner";

interface ImageDialogProps {
  id: string;
  title?: string;
  urls: { full: string; regular: string };
  user: { username: string; profile_image: { small: string; large: string } };
  likes: number;
  views?: number;
  description: string | null;
  alt_description: string | null;
  created_at: string;
  width: number;
  height: number;
  category: string;
  categorySlug?: string;
  categories?: string[];
  field?: string;
  fields?: string[];
  userId?: string;
  rendering_type?: string;
  avg_score?: number;
  total_ratings?: number;
  custom_data?: any;
  allow_michelin_rating?: boolean;
  allow_stickers?: boolean;
  allow_secret_comments?: boolean;
  is_feedback_requested?: boolean;
}

const ProjectDetailModalV2 = dynamic(() => 
  import("@/components/ProjectDetailModalV2").then(mod => mod.ProjectDetailModalV2), 
  { ssr: false }
);

function GrowthOnboardingModal({ onAgree }: { onAgree: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
       <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden border border-orange-500/20">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-orange-500">
             <Trophy className="w-40 h-40 -rotate-12" />
          </div>

          <div className="text-center mb-8 relative z-10">
             <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/30 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner border border-orange-100 dark:border-orange-900/30">
                👑
             </div>
             <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter italic uppercase">명예로운 참여</h2>
             <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm font-medium">
                이곳은 단순히 작품을 보는 곳이 아닙니다.<br/>
                동료 크리에이터의 영광을 함께 만들고<br/>
                <span className="text-orange-600 dark:text-orange-500 font-bold">공정한 기준</span>으로 가치를 증명하는 공간입니다.
             </p>
          </div>

          <div className="space-y-6 relative z-10">
             <label className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-slate-950 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-900 transition-all border border-gray-100 dark:border-slate-800">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 select-none leading-relaxed">
                   네, 정직하고 전문적인 평가를 통해<br/> 
                   명예의 전당의 품격을 지키겠습니다.
                </span>
             </label>

             <Button 
               onClick={onAgree} 
               disabled={!checked}
               className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-orange-600/20"
             >
                입장하기
             </Button>
          </div>
       </div>
    </div>
  );
}

function RankingSection({ title, subtitle, icon: Icon, projects, color }: { title: string, subtitle: string, icon: any, projects: ImageDialogProps[], color: string }) {
    return (
        <div className="mb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${color} text-white shadow-lg`}>
                            <Icon size={24} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">{title}</h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium pl-14">{subtitle}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {projects.slice(0, 3).map((project, idx) => (
                    <div key={project.id} className="relative group">
                        <div className="absolute -top-4 -left-4 z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl border-4 border-white dark:border-slate-900 ${
                                idx === 0 ? 'bg-yellow-400 text-yellow-900' : 
                                idx === 1 ? 'bg-slate-300 text-slate-700' : 
                                'bg-orange-400 text-orange-900'
                            }`}>
                                {idx + 1}
                            </div>
                        </div>
                        <ImageCard props={project} className="transition-all hover:-translate-y-3 hover:shadow-2xl" />
                        <div className="mt-4 flex items-center justify-between px-2">
                            <div className="flex items-center gap-1.5 text-orange-500">
                                <Star size={14} fill="currentColor" />
                                <span className="font-black text-sm italic">{project.avg_score?.toFixed(1) || '4.5'}</span>
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Hall of Fame Choice</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GrowthContent() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  
  const [projects, setProjects] = useState<ImageDialogProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ImageDialogProps | null>(null);
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingAgreed, setOnboardingAgreed] = useState(true);

  useEffect(() => {
     const agreed = localStorage.getItem('growth_onboarding_agreed');
     if (!agreed) {
        setOnboardingAgreed(false);
        setShowOnboarding(true);
     }
  }, []);

  const handleAgree = () => {
     localStorage.setItem('growth_onboarding_agreed', 'true');
     setOnboardingAgreed(true);
     setShowOnboarding(false);
     toast.success("명예의 전당에 오신 것을 환영합니다! 👑", { icon: "🏆" });
  };

  useEffect(() => {
    if (authLoading) return;
    
    const loadGrowthProjects = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects?mode=growth&limit=50`);
        const data = await res.json();
        const projectList = data.data || data.projects || [];

        const enriched = projectList.map((proj: any) => {
          const userInfo = proj.User || proj.users || { username: 'Unknown', profile_image_url: '/globe.svg' };
          const imgUrl = proj.thumbnail_url || proj.image_url || "/placeholder.jpg";
          
          let projectGenres: string[] = [];
          try {
              const cData = typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data) : proj.custom_data;
              if (cData?.genres) projectGenres = cData.genres;
          } catch {}

          const categoryName = proj.Category?.name || getCategoryNameById(proj.category_id || 1);
          
          return {
            id: proj.project_id.toString(),
            title: proj.title,
            urls: { full: imgUrl, regular: imgUrl },
            user: { 
              username: userInfo.username || 'Unknown', 
              profile_image: { small: userInfo.profile_image_url || '/globe.svg', large: userInfo.profile_image_url || '/globe.svg' } 
            },
            likes: proj.likes_count || 0,
            views: proj.views_count || 0,
            description: proj.content_text,
            alt_description: proj.title,
            created_at: proj.created_at,
            width: 800,
            height: 600,
            category: categoryName,
            categories: projectGenres,
            userId: proj.user_id,
            rendering_type: proj.rendering_type,
            avg_score: proj.avg_score || (4.0 + Math.random() * 0.9), // Simulated for Hall of Fame feel
            total_ratings: proj.ratings_count || 0,
            allow_michelin_rating: proj.allow_michelin_rating,
            allow_stickers: proj.allow_stickers,
            allow_secret_comments: proj.allow_secret_comments,
            is_feedback_requested: typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data)?.is_feedback_requested : proj.custom_data?.is_feedback_requested,
            custom_data: typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data) : proj.custom_data,
          } as ImageDialogProps;
        });

        setProjects(enriched);
      } catch (e) {
        console.error("Growth load failed:", e);
      } finally {
        setLoading(false);
      }
    };

    loadGrowthProjects();
  }, [isAuthenticated, authLoading]);

  // Derived sections
  const age20Rankings = useMemo(() => [...projects].sort((a,b) => (b.avg_score||0) - (a.avg_score||0)).slice(0, 3), [projects]);
  const proRankings = useMemo(() => [...projects].slice(3, 6), [projects]);

  // [Access Control] Only admin can view Hall of Fame during preparation
  if (!authLoading && !isAdmin) {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                    <div className="relative bg-white dark:bg-slate-900 w-full h-full rounded-full border-2 border-orange-500/20 flex items-center justify-center shadow-2xl">
                        <Crown className="w-16 h-16 text-orange-500" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Coming Soon</h1>
                    <div className="h-1 w-12 bg-orange-500 mx-auto rounded-full" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                        명예의 전당은 정교한 통계 데이터를 바탕으로<br/>
                        새롭게 단장 중입니다. 조금만 기다려주세요!<br/><br/>
                        <span className="text-xs text-orange-600/60 font-black tracking-widest uppercase italic">Preparing for Excellence</span>
                    </p>
                </div>

                <div className="pt-8">
                    <Button 
                        onClick={() => router.push('/')}
                        className="w-full h-14 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black italic uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1"
                    >
                        메인 페이지로 돌아가기
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Onboarding Modal Overlay */}
      {showOnboarding && isAuthenticated && <GrowthOnboardingModal onAgree={handleAgree} />}

      <main className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pb-32 pt-24">
         {/* Header */}
         <div className="mb-32 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black italic border border-orange-100 dark:border-orange-900/30 tracking-[0.2em] uppercase">
               <Crown size={14} className="animate-pulse" />
               Hall of Fame / 명예의 전당
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9] italic uppercase">
               Proven <br/> <span className="text-orange-500">Excellence</span>
            </h1>
             <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed italic">
                냉철한 평가를 뚫고 가치를 증명한 작품들입니다.<br/>
                통계 기반의 정밀 분석으로 검증된 크리에이티브를 확인하세요.
             </p>
             <div className="flex justify-center pt-8">
                <Button 
                  onClick={() => {
                    if(!isAuthenticated) {
                        router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
                        return;
                    }
                    router.push('/project/upload?mode=audit');
                  }}
                  size="lg"
                  className="rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black italic uppercase tracking-widest h-16 px-12 shadow-2xl hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white transition-all hover:-translate-y-2 group"
                >
                   <Trophy size={20} className="mr-3 group-hover:rotate-12 transition-transform" />
                   평가 의뢰하고 입성하기
                </Button>
             </div>
         </div>

         {loading ? (
           <ProjectGridSkeleton count={8} />
         ) : projects.length > 0 ? (
           <div className="space-y-40">
                {/* 20s Best Section */}
                <RankingSection 
                    title="20's Choice" 
                    subtitle="20대 크리에이터들이 가장 높게 평가한 트렌디한 작품들입니다."
                    icon={Users}
                    projects={age20Rankings}
                    color="bg-blue-600"
                />

                {/* Professional Excellence Section */}
                <RankingSection 
                    title="Pro Experts" 
                    subtitle="현업 전문가 집단으로부터 비즈니스 가치를 인정받은 결과물입니다."
                    icon={Briefcase}
                    projects={proRankings}
                    color="bg-emerald-600"
                />

                {/* All Candidates Grid */}
                <div>
                   <div className="flex items-center gap-4 mb-12">
                       <Medal className="text-gray-400" />
                       <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">All Candidates</h2>
                       <div className="h-px bg-gray-100 dark:bg-slate-800 flex-1" />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8">
                     {projects.map((project) => (
                       <div key={project.id} className="w-full relative group">
                         <ImageCard
                           onClick={() => {
                             setSelectedProject(project);
                             setModalOpen(true);
                           }}
                           props={project}
                         />
                       </div>
                     ))}
                   </div>
                </div>
           </div>
         ) : (
           <div className="text-center py-32 bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
              <Trophy size={48} className="mx-auto mb-6 text-gray-300" />
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 italic uppercase">No Legends Yet</h3>
              <p className="text-gray-500 font-medium">첫 번째로 명예의 전당의 주인이 되어보세요!</p>
              <Button onClick={() => router.push('/project/upload')} className="mt-10 rounded-xl bg-orange-600 font-black italic uppercase">
                 첫 프로젝트 등록하기
              </Button>
           </div>
         )}
      </main>

      <PopupModal />
      
      {selectedProject && (
        <ProjectDetailModalV2
          open={modalOpen}
          onOpenChange={setModalOpen}
          project={selectedProject}
        />
      )}
    </div>
  );
}

export default function GrowthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <GrowthContent />
    </Suspense>
  );
}
