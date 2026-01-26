"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Monitor, 
  Smartphone, 
  Maximize2, 
  ChevronLeft, 
  CheckCircle2, 
  X,
  Star as StarIcon,
  ChefHat,
  Star,
  Eye,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { MediaPreview } from '@/components/Review/MediaPreview';
import { MyRatingIsHeader } from '@/components/MyRatingIsHeader';
import { MichelinRating, MichelinRatingRef } from '@/components/MichelinRating';
import { FeedbackPoll, FeedbackPollRef } from '@/components/FeedbackPoll';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
import { AlertCircle } from 'lucide-react';

// --- Review Intro Component (Overlay) ---
// --- Review Intro Component (Overlay) ---
function ReviewIntro({ onStart, project }: { onStart: () => void, project: any }) {
  return (
    <div className="absolute inset-x-0 bottom-0 top-0 z-50 bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/dark-texture-bg.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000" />

      <main className="relative z-10 w-full max-w-lg mx-auto px-6 flex flex-col items-center text-center space-y-6 md:space-y-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img 
            src="/logo-white.png" 
            alt="제 평가는요?" 
            className="h-10 md:h-20 w-auto object-contain"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
        >
          <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
            Professional Evaluation Stage
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
             <p className="text-sm md:text-xl text-white font-bold leading-relaxed break-keep">
                당신은 오늘, 이 창작물의 운명을 결정할<br />
                전문 심사위원으로 초대되었습니다.
             </p>
             <p className="text-[10px] md:text-xs text-white/40 font-medium leading-relaxed max-w-[280px] md:max-w-none mx-auto break-keep">
                냉철하고 객관적인 심미안으로 창작자의 성장을 위해<br />
                진정성 있는 최고의 평가를 남겨주시겠습니까?
             </p>
        </motion.div>

        {/* Project Context & Cloche */}
        <div className="w-full space-y-6 md:space-y-8 flex flex-col items-center">
           <motion.div
             onClick={onStart}
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             whileHover={{ scale: 1.05 }}
             transition={{ duration: 1, delay: 0.4, type: "spring" }}
             className="relative w-72 h-72 md:w-64 md:h-64 cursor-pointer group"
           >
             <img 
               src="/review/cloche-cover.png" 
               alt="Start Review" 
               className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(255,165,0,0.3)] transition-all duration-500 group-hover:brightness-110"
             />
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-black/50 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/20">Click to Open</span>
             </div>
           </motion.div>

           {/* Project Identity */}
           {project && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.6 }}
               className="space-y-2 md:space-y-3"
             >
                <h4 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">
                  {project.title}
                </h4>
             </motion.div>
           )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="w-full"
        >
          <Button
            onClick={onStart}
            className="w-full h-16 md:h-20 bg-orange-600 hover:bg-orange-500 text-white text-lg md:text-2xl font-black shadow-[0_20px_60px_-15px_rgba(234,88,12,0.6)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 bevel-cta border-none rounded-none"
          >
            <ChefHat className="w-6 h-6 md:w-8 md:h-8" />
            평가 시작
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

type ViewerMode = 'desktop' | 'mobile';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Case-insensitive query param handling
  const projectId = searchParams.get('projectId') || searchParams.get('projectid');
  
  const [viewerMode, setViewerMode] = useState<ViewerMode>('desktop');
  const [panelWidth, setPanelWidth] = useState(600); // Default wider for better view
  const [isResizing, setIsResizing] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  
  // Review State
  const [currentStep, setCurrentStep] = useState(0); 
  // 1. Michelin (Quantitative), 2. Sticker (Poll), 3. Depth Questions (Subjective) -> Summary
  const steps = ['rating', 'voting', 'subjective', 'summary'];
  
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Refs for manual submission
  const michelinRef = React.useRef<MichelinRatingRef>(null);
  const pollRef = React.useRef<FeedbackPollRef>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      title: string;
      description: string;
      onConfirm: () => void;
  }>({
      isOpen: false,
      title: "",
      description: "",
      onConfirm: () => {},
  });

  useEffect(() => {
    const gid = typeof window !== 'undefined' ? (localStorage.getItem('guest_id') || crypto.randomUUID()) : null;
    if (gid && typeof window !== 'undefined') localStorage.setItem('guest_id', gid);
    setGuestId(gid);

    if (!projectId) {
      router.push('/');
      return;
    }

    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        const result = await response.json();

        if (!response.ok || !result.project) throw new Error(result.error || "Loading failed");
        
        const data = result.project;
        
        // Smart Data Normalization
        let parsedCustom = data.custom_data;
        if (typeof parsedCustom === 'string') {
            try { parsedCustom = JSON.parse(parsedCustom); } catch (e) { parsedCustom = {}; }
        }
        
        const normalizedProject = { 
          ...data, 
          custom_data: parsedCustom || {}
        };
        
        setProject(normalizedProject);
      } catch (e) {
        console.error("Failed to load project via API", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  const handleStartReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        toast.info("게스트 모드로 평가를 시작합니다.", {
            description: "로그인 후 참여하시면 포인트를 획득할 수 있습니다.",
            action: {
                label: "로그인/가입",
                onClick: () => router.push(`/login?returnPath=${encodeURIComponent(window.location.href)}`)
            }
        });
    }
    
    setShowIntro(false);
  };

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 350 && newWidth < 1000) setPanelWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizing]);

  const handleNextStep = async () => {
    // Stage 1: Michelin Rating Validation
    if (currentStep === 0) {
        if (!michelinRef.current?.isValid()) return;
        
        setConfirmModal({
            isOpen: true,
            title: "평가 점수를 확정하시겠습니까?",
            description: "설정한 모든 항목의 평점이 기록됩니다. 다음 단계로 넘어가시겠습니까?",
            onConfirm: async () => {
                const success = await michelinRef.current?.submit();
                if (success) {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    setCurrentStep(1);
                }
            }
        });
        return;
    }
    
    // Stage 2: Voting/Poll Validation
    if (currentStep === 1) {
        if (!pollRef.current?.isValid()) return;
        
        setConfirmModal({
            isOpen: true,
            title: "피드백 투표를 확정하시겠습니까?",
            description: "선택하신 옵션이 최종 결과에 반영됩니다. 다음 단계로 넘어가시겠습니까?",
            onConfirm: async () => {
                const success = await pollRef.current?.submit();
                if (success) {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    setCurrentStep(2);
                }
            }
        });
        return;
    }

    // Stage 3: Subjective Questions Validation
    if (currentStep === 2) {
        const questions = project?.custom_data?.audit_config?.questions || [];
        const allAnswered = questions.every((q: string) => customAnswers[q]?.trim().length > 0);
        
        if (!allAnswered && questions.length > 0) {
            toast.error("아직 작성하지 않은 의견이 있습니다.", {
                description: "작가를 위해 모든 질문에 답변을 남겨주세요!"
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: "최종 평가를 제출하시겠습니까?",
            description: "작성하신 모든 내용이 기록되며, 이후 수정이 불가능할 수 있습니다. 제출하시겠습니까?",
            onConfirm: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                handleFinalSubmit();
            }
        });
        return;
    }
    
    if (currentStep < steps.length - 2) { 
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleFinalSubmit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Step 3 Subjective answers submission
      // Note: MichelinRating component handles its own submission for scores. 
      // FeedbackPoll also handles its own.
      // We just need to submit the final proposal/answers if any.
      
      const res = await fetch(`/api/projects/${Number(projectId)}/rating`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          custom_answers: customAnswers,
          guest_id: !session ? guestId : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      
      setIsSubmitted(true);
      setCurrentStep(steps.length - 1); // Go to summary
      toast.success("평가가 제출되었습니다! 🎉");
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.message || "평가 등록에 실패했습니다.";
      toast.error(`평가 등록 실패: ${errorMsg}`);
    }
  };

  if (loading) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-orange-600 font-black uppercase tracking-widest text-[10px] animate-pulse">Loading Project Data...</p>
    </div>
  );

  if (!project) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
        <X size={40} />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-chef-text tracking-tighter italic">PROJECT NOT FOUND</h2>
        <p className="text-chef-text opacity-40 font-medium">프로젝트 정보를 불러올 수 없거나 삭제된 프로젝트입니다.</p>
      </div>
      <Button onClick={() => router.push('/')} variant="outline" className="rounded-full border-chef-border">홈으로 돌아가기</Button>
    </div>
  );

  // Ensure custom_data is an object
  const customData = typeof project?.custom_data === 'string' 
    ? JSON.parse(project.custom_data) 
    : (project?.custom_data || {});

  const auditType = customData?.audit_config?.type || 'link';
  
  // Robust Media Data Extraction
  const getMediaData = (proj: any) => {
    if (!proj) return null;
    const cData = typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data) : (proj.custom_data || {});
    const auditA = cData.audit_config?.mediaA;
    
    // If it's image or document, mediaA is likely the array/url we want
    if ((auditType === 'image' || auditType === 'document') && auditA) {
        return auditA;
    }
    
    // Fallback/Legacy: Extract first URL from content if none specified
    if (auditType === 'link' || auditType === 'video') {
       if (typeof auditA === 'string' && auditA.trim()) return auditA.trim();
       
       // Search in specialized fields
       if (proj.site_url) return proj.site_url;
       
       // Regex search as last resort
       const urlRegex = /(https?:\/\/[^\s]+)/gi;
       const content = `${proj.content_text || ''} ${proj.description || ''}`;
       const matches = content.match(urlRegex);
       return matches ? matches[0] : '';
    }

    return auditA || '';
  };

  const mediaData = getMediaData(project);
  const finalDisplayUrl = typeof mediaData === 'string' ? mediaData : (Array.isArray(mediaData) ? mediaData[0] : '');

  const renderCurrentStep = () => {
    const stepType = steps[currentStep];
    
    // Step 1: All Ratings (Michelin)
    if (stepType === 'rating') {
      return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
           <div className="text-center space-y-3 mb-8 shrink-0">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/10 border border-orange-600/20">
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Stage 01. Star Rating</span>
             </div>
             <h3 className="text-3xl font-black text-chef-text tracking-tighter italic uppercase">정량적 항목 평가</h3>
             <p className="text-chef-text opacity-40 font-bold uppercase tracking-widest text-[10px]">각 지표별 슬라이더를 조절하여 점수를 매겨주세요</p>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
              <div className="bg-chef-panel/30 border border-chef-border rounded-[3rem] p-8 md:p-10 shadow-inner">
               <MichelinRating ref={michelinRef} projectId={projectId!} guestId={guestId || undefined} />
            </div>
           </div>
        </div>
      );
    }

    // Step 2: Voting (Sticker)
    if (stepType === 'voting') {
      return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center space-y-3 mb-8 shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-600/20">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Stage 02. Sticker Decision</span>
            </div>
            <h3 className="text-3xl font-black text-chef-text tracking-tighter italic uppercase">최종 판정 투표</h3>
            <p className="text-sm text-chef-text opacity-50 font-black tracking-tight leading-snug max-w-sm mx-auto">{project?.custom_data?.audit_config?.poll?.desc || "이 프로젝트에 대한 당신의 최종 선택은?"}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            <div className="bg-chef-panel/30 border border-chef-border rounded-[3rem] p-8 md:p-10 shadow-inner">
               <FeedbackPoll ref={pollRef} projectId={projectId!} guestId={guestId || undefined} />
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Subjective (Questions)
    if (stepType === 'subjective') {
      const questions = project?.custom_data?.audit_config?.questions || [];
      return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center space-y-3 mb-8 shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/10 border border-emerald-600/20">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Stage 03. Depth Feedback</span>
            </div>
            <h3 className="text-3xl font-black text-chef-text tracking-tighter italic uppercase">심층 의견 기록</h3>
            <p className="text-sm text-chef-text opacity-40 font-black tracking-widest uppercase">작가를 위해 더 날카롭고 따뜻한 조언을 남겨주세요.</p>
          </div>
          
          <div className="flex-1 space-y-10 overflow-y-auto px-1 py-4 no-scrollbar pb-20">
            {questions.length > 0 ? questions.map((q: string, i: number) => (
              <div key={i} className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-orange-500 font-black">Q{i+1}</span>
                  <label className="text-chef-text font-black uppercase tracking-tight">{q}</label>
                </div>
                <textarea 
                  value={customAnswers[q] || ""}
                  onChange={e => setCustomAnswers({ ...customAnswers, [q]: e.target.value })}
                  className="w-full h-32 bg-chef-panel border border-chef-border rounded-[1.5rem] p-5 text-chef-text focus:border-orange-500 outline-none resize-none transition-all placeholder:text-chef-text/10"
                  placeholder="의견을 입력해 주세요..."
                />
              </div>
            )) : (
                <div className="text-center text-chef-text opacity-30 py-10">등록된 추가 질문이 없습니다.<br />다음 단계로 이동하여 제출해주세요.</div>
            )}
          </div>
        </div>
      );
    }

    // Step 4: Summary (Completion)
    if (stepType === 'summary') {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-8 py-20 animate-in zoom-in-95 duration-700 h-full">
          <div className="relative">
            <div className="w-24 h-24 bg-orange-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_20px_40px_rgba(234,88,12,0.3)] animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse border-4 border-chef-card">
               <Star size={20} fill="currentColor" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-4xl font-black text-chef-text uppercase tracking-tighter italic">Evaluation Complete</h3>
            <p className="text-chef-text opacity-60 font-bold leading-relaxed max-w-sm mx-auto">
              당신의 날카로운 시선과 정성스러운 조언이<br />
              창작자에게 가장 맛있는 성장의 밑거름이 될 것입니다.
            </p>
          </div>
          
          <div className="pt-8 w-full max-w-xs space-y-3">
             <Button onClick={() => router.push('/projects')} className="w-full h-16 rounded-2xl bevel-cta bg-orange-600 text-white text-lg font-black hover:bg-orange-700 shadow-xl transition-all hover:scale-105">
                다른 요리 둘러보기
             </Button>
             <button onClick={() => router.push('/')} className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-widest hover:opacity-100 transition-opacity">Return to Studio</button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <main className="h-screen w-full bg-background flex flex-col overflow-hidden transition-colors duration-500 relative">
      <MyRatingIsHeader />
      
      <div className="flex-1 flex flex-col md:flex-row mt-16 overflow-hidden relative">
        {/* Intro Overlay */}
        <AnimatePresence>
          {showIntro && (
            <motion.div 
              initial={{ opacity: 1 }} 
              exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }} 
              className="absolute inset-0 z-50"
            >
              <ReviewIntro onStart={handleStartReview} project={project} />
            </motion.div>
          )}
        </AnimatePresence>

      {/* Left Area: Project Preview (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col flex-1 relative min-w-0 h-full border-r border-chef-border bg-[#0f0f0f]">
        {/* Top Header for Control */}
        <div className="h-16 bg-chef-card border-b border-chef-border px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex gap-1.5 ">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
             </div>
             {/* Address Bar Mockup */}
             <div className="hidden lg:flex items-center bg-chef-panel/80 px-4 py-1.5 rounded-full border border-chef-border w-96 truncate ml-4 shadow-inner">
                <span className="text-[10px] font-black text-chef-text opacity-40 truncate uppercase tracking-tight">{finalDisplayUrl || "preparing dish..."}</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex bg-chef-panel p-1 rounded-sm border border-chef-border scale-90">
                <button onClick={() => setViewerMode('desktop')} title="Desktop View" className={cn("p-2 rounded-sm transition-all", viewerMode === 'desktop' ? "bg-chef-text text-chef-bg shadow-lg" : "text-chef-text opacity-20")}><Monitor size={14} /></button>
                <button onClick={() => setViewerMode('mobile')} title="Mobile View" className={cn("p-2 rounded-sm transition-all", viewerMode === 'mobile' ? "bg-chef-text text-chef-bg shadow-lg" : "text-chef-text opacity-20")}><Smartphone size={14} /></button>
             </div>
             <Button 
               variant="outline" 
               size="sm" 
               className="h-9 px-4 text-white border-none bg-orange-600 hover:bg-orange-700 rounded-sm gap-2 text-[10px] font-black tracking-widest uppercase shadow-lg transition-all active:scale-95" 
               onClick={() => window.open(finalDisplayUrl || '', '_blank')}
             >
               <Maximize2 size={12} /> Open Dish
             </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-neutral-900 flex items-center justify-center p-2 md:p-4 overflow-hidden relative transition-colors">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 z-0 opacity-10 bg-[url('/grid-pattern.svg')] pointer-events-none" />
          
          <div className={cn(
            "transition-all duration-700 ease-in-out shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-white relative z-10 overflow-hidden",
            viewerMode === 'mobile' ? "w-[375px] h-[812px] rounded-[3rem] border-[12px] border-chef-border" : "w-full h-full rounded-xl border border-white/10"
          )}>
            <MediaPreview type={auditType as any} data={mediaData} />
          </div>
        </div>
      </div>

      {/* Right Area: Evaluation Panel */}
      <div 
        className="fixed inset-0 md:relative z-20 bg-chef-card flex flex-col h-full w-full md:border-l border-chef-border transition-colors duration-500"
        style={{ width: (typeof window !== 'undefined' && window.innerWidth > 768) ? panelWidth : '100%', minWidth: (typeof window !== 'undefined' && window.innerWidth > 768) ? '400px' : 'auto' }}
      >
        {/* Resize Handle (Draggable Bar) */}
        <div 
          onMouseDown={() => setIsResizing(true)} 
          className="hidden md:flex absolute top-0 -left-3 bottom-0 w-6 cursor-col-resize group items-center justify-center z-30 touch-none" 
        >
          {/* Visual Bar */}
          <div className="w-[4px] h-32 bg-chef-border group-hover:bg-orange-500 transition-all rounded-full flex flex-col items-center justify-center gap-1.5 shadow-sm group-active:scale-x-150">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-chef-card opacity-30" />
             ))}
          </div>
          {/* Tooltip hint */}
          <div className="absolute left-8 bg-chef-text text-chef-bg text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-widest">Resize Panel</div>
        </div>

        {/* Panel Header */}
        <div className="border-b border-chef-border shrink-0 bg-chef-card relative z-10">
          {/* Mobile Content Control Bar */}
          <div className="md:hidden flex items-center justify-between p-4 bg-chef-panel border-b border-chef-border">
             <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setIsMobileModalOpen(true)}
                  className="h-12 px-4 bg-orange-600 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 bevel-cta"
                >
                  <Eye size={16} /> 콘텐츠 보기
                </Button>
                <button 
                  onClick={() => window.open(finalDisplayUrl || '', '_blank')}
                  className="text-chef-text opacity-40 hover:opacity-100 transition-all flex items-center gap-1.5"
                >
                   <ExternalLink size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">새창</span>
                </button>
             </div>
             <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center text-chef-text opacity-20 hover:opacity-100 transition-all"><X size={20} /></button>
          </div>

          <div className="p-6 md:px-8 md:pt-8 md:pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-chef-text uppercase tracking-tighter italic flex items-center gap-2">
                 <ChefHat className="text-orange-500 w-6 h-6" /> 제 평가는요?
              </h3>
            </div>
            <button onClick={() => router.back()} className="hidden md:block text-chef-text opacity-20 hover:opacity-100 transition-all"><X size={20} /></button>
          </div>
          
          {/* Progress Indicator */}
          {currentStep < steps.length - 1 && (
            <div className="px-6 md:px-8 pb-4">
              <div className="flex gap-1.5 h-1 w-full bg-chef-panel rounded-full overflow-hidden">
                {[0, 1, 2].map((s) => (
                  <div 
                    key={s} 
                    className={cn(
                      "flex-1 transition-all duration-500 rounded-full",
                      currentStep === s ? "bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.5)]" : 
                      currentStep > s ? "bg-chef-text opacity-40" : "bg-chef-text opacity-5"
                    )} 
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-widest">Process Progress</span>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{currentStep + 1} / 3</span>
              </div>
            </div>
          )}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden p-6 md:p-10 custom-scrollbar relative">
           <AnimatePresence mode="wait">
             <motion.div
               key={currentStep}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.4, ease: "easeOut" }}
               className="h-full scroll-smooth"
             >
               {renderCurrentStep()}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Panel Footer - Hide on Summary step */}
        {currentStep < steps.length - 1 && (
          <div className="p-6 md:p-8 border-t border-chef-border flex gap-4 shrink-0 bg-chef-card relative z-10">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={handlePrevStep} 
                className="h-14 px-6 rounded-2xl bevel-sm border-chef-border bg-chef-panel text-chef-text opacity-50 hover:opacity-100 transition-all font-black"
              >
                <ChevronLeft />
              </Button>
            )}
            <Button 
              onClick={handleNextStep}
              className="flex-1 h-14 rounded-2xl bevel-cta bg-orange-600 hover:bg-orange-700 text-white font-black text-lg transition-all hover:scale-[1.02] shadow-xl uppercase tracking-widest shadow-orange-600/20"
            >
              {currentStep < steps.length - 2 ? "다음 단계로" : "평가 제출하기"}
            </Button>
          </div>
        )}
        </div>
      </div>
      {/* Confirmation Modal */}
      <Dialog open={confirmModal.isOpen} onOpenChange={(open) => setConfirmModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md bg-chef-card border-chef-border p-8 rounded-[2.5rem]">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-600 mb-2">
              <AlertCircle size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-chef-text">{confirmModal.title}</DialogTitle>
            <DialogDescription className="text-chef-text opacity-50 font-bold leading-relaxed">
              {confirmModal.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-3 sm:justify-end">
            <Button 
                variant="outline" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="h-14 rounded-2xl border-chef-border font-black text-chef-text uppercase tracking-widest px-8"
            >
              취소
            </Button>
            <Button 
                onClick={confirmModal.onConfirm}
                className="h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest px-8 shadow-lg shadow-orange-600/20"
            >
              확인 및 다음으로
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Content Modal */}
      <AnimatePresence>
        {isMobileModalOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] bg-black md:hidden pointer-events-auto"
          >
             <div className="relative h-full w-full flex flex-col">
                <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/10 bg-chef-card">
                   <div className="flex items-center gap-2">
                      <Eye className="text-orange-500 w-4 h-4" />
                      <span className="text-[10px] font-black text-chef-text opacity-40 uppercase tracking-widest italic">Content View</span>
                   </div>
                   <button 
                     onClick={() => setIsMobileModalOpen(false)}
                     className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-95 transition-transform"
                   >
                     <X size={20} />
                   </button>
                </div>
                <div className="flex-1 overflow-hidden bg-white">
                   <MediaPreview type={auditType as any} data={mediaData} />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-background flex flex-col items-center justify-center text-orange-600 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Initializing Viewer System...</div>}>
      <ViewerContent />
    </Suspense>
  );
}
