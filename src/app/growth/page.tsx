"use client";

import { Suspense, useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { ProjectGridSkeleton } from "@/components/ui/ProjectSkeleton";
import { ImageCard } from "@/components/ImageCard";
import { getCategoryNameById } from "@/lib/categoryMap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faLock } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { PopupModal } from "@/components/PopupModal";
import { MichelinRating } from "@/components/MichelinRating";
import { FeedbackPoll } from "@/components/FeedbackPoll";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <FontAwesomeIcon icon={faRocket} className="text-9xl -rotate-12" />
          </div>

          <div className="text-center mb-8 relative z-10">
             <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl shadow-sm border border-green-100">
                🌱
             </div>
             <h2 className="text-2xl font-black text-gray-900 mb-3">성장을 위한 약속</h2>
             <p className="text-gray-500 leading-relaxed text-sm">
               이곳은 더 나은 작품을 위해 용기 낸<br/>
               크리에이터들의 공간입니다.<br/><br/>
               <span className="font-bold text-gray-800">솔직하지만 따뜻한 피드백</span>으로<br/>
               서로의 성장을 돕겠다고 약속해 주세요.
             </p>
          </div>

          <div className="space-y-6 relative z-10">
             <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-sm font-bold text-gray-700 select-none">
                   네, 따뜻하고 건설적인 피드백으로<br/> 
                   동료 크리에이터의 성장을 응원하겠습니다.
                </span>
             </label>

             <Button 
               onClick={onAgree} 
               disabled={!checked}
               className="w-full h-12 rounded-xl text-lg font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200"
             >
                입장하기
             </Button>
          </div>
       </div>
    </div>
  );
}


function GrowthContent() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
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
     toast.success("환영합니다! 따뜻한 피드백을 부탁드려요. 🌿", { icon: "🤝" });
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

  // [Updated] 비로그인 시에도 상위 섹션은 노출하고 실제 기능부만 블로킹하는 부드러운 UX 적용
  const renderLoginGuard = () => (
    <div className="py-20 flex flex-col items-center justify-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 px-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md border border-gray-100 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
           <FontAwesomeIcon icon={faLock} className="text-gray-400 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">로그인이 필요합니다</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          성장하기 메뉴는 크리에이터들이 서로 피드백을 주고받는 프라이빗한 공간입니다.<br/>
          로그인하고 서로의 성장을 응원해주세요!
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={() => router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)} 
            className="bg-green-600 hover:bg-green-700 rounded-full px-8 h-12 font-bold"
          >
             로그인
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/signup')} 
            className="rounded-full px-8 h-12 font-bold border-gray-200"
          >
             회원가입
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Onboarding Modal Overlay */}
      {showOnboarding && isAuthenticated && <GrowthOnboardingModal onAgree={handleAgree} />}

      <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 pb-20 pt-24">
         {/* Header */}
         <div className="mb-20 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold border border-green-100 dark:border-green-900 mb-2">
               <FontAwesomeIcon icon={faRocket} />
               GROWTH CENTER
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
               서로의 성장을 위한 <br className="md:hidden" /> 피드백 공간
            </h1>
             <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 font-medium">
                더 나은 작품을 위해 용기 내어 피드백을 요청한 크리에이터들입니다. <br/>
                따뜻한 조언과 냉철한 평가로 성장을 도와주세요.
             </p>
             <div className="flex justify-center mb-16">
                <Button 
                  onClick={() => {
                    if(!isAuthenticated) {
                        router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
                        return;
                    }
                    router.push('/project/upload?mode=audit');
                  }}
                  size="lg"
                  className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-14 px-10 shadow-xl shadow-orange-600/30 transition-all hover:-translate-y-1 hover:scale-105"
                >
                   <Zap size={20} className="mr-2 fill-white" />
                   지금 바로 평가 의뢰하기
                </Button>
             </div>
         </div>


         {/* Grid */}
         {loading ? (
           <ProjectGridSkeleton count={8} />
         ) : projects.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-12 gap-x-6">
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
         ) : (
           <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">아직 피드백 요청이 없습니다</h3>
              <p className="text-gray-500">첫 번째로 용기 내어 피드백을 요청해보세요!</p>
              <Button onClick={() => router.push('/project/upload')} className="mt-6 rounded-full">
                 프로젝트 등록하기
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
