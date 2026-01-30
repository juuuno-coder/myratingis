"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Monitor, 
  Smartphone, 
  Maximize2, 
  ChevronLeft, 
  CheckCircle2, 
  X,
  ChefHat,
  Star,
  Eye,
  ExternalLink,
  ArrowLeft,
  AlertCircle
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
import { useAuth } from '@/lib/auth/AuthContext';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";

// --- Review Intro Component ---
function ReviewIntro({ onStart, project }: { onStart: () => void, project: any }) {
  return (
    <div className="absolute inset-x-0 bottom-0 top-0 z-50 bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/dark-texture-bg.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000" />
      <main className="relative z-10 w-full max-w-lg mx-auto px-6 flex flex-col items-center text-center space-y-6 md:space-y-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-2">
          <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">Professional Evaluation Stage</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <img src="/logo-white.png" alt="제 평가는요?" className="h-10 md:h-20 w-auto object-contain" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
             <p className="text-sm md:text-xl text-white font-bold break-keep">당신은 오늘, 이 창작물의 운명을 결정할<br />전문 심사위원으로 초대되었습니다.</p>
             <p className="text-[10px] md:text-xs text-white/40 font-medium max-w-[280px] md:max-w-none mx-auto break-keep">냉철하고 객관적인 심미안으로 창작자의 성장을 위해<br />진정성 있는 최고의 평가를 남겨주시겠습니까?</p>
        </motion.div>
        <div className="w-full space-y-6 md:space-y-8 flex flex-col items-center">
           <motion.div onClick={onStart} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} className="relative w-72 h-72 md:w-64 md:h-64 cursor-pointer group">
             <img src="/review/cloche-cover.png" alt="Start Review" className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(255,165,0,0.3)] transition-all duration-500 group-hover:brightness-110" />
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/50 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/20">Click to Open</span>
             </div>
           </motion.div>
           {project && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-2">
                <h4 className="text-lg md:text-xl font-black text-white italic tracking-tighter uppercase max-w-2xl mx-auto px-4">{project.summary || project.description || "당신을 위해 준비된 미지의 과제"}</h4>
             </motion.div>
           )}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="w-full">
          <Button onClick={onStart} className="w-full h-16 md:h-20 bg-orange-600 hover:bg-orange-500 text-white text-lg md:text-2xl font-black rounded-none border-none bevel-cta">
            <ChefHat className="w-6 h-6 md:w-8 md:h-8" /> 평가 시작
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

type ViewerMode = 'desktop' | 'mobile';

function ViewerContent() {
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId') || searchParams.get('projectid');
  
  const [viewerMode, setViewerMode] = useState<ViewerMode>('desktop');
  const [panelWidth, setPanelWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isLoginGuidanceOpen, setIsLoginGuidanceOpen] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(0); 
  const [michelinScores, setMichelinScores] = useState<Record<string, number>>({});
  const [pollSelection, setPollSelection] = useState<string | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  const michelinRef = useRef<MichelinRatingRef>(null);
  const pollRef = useRef<FeedbackPollRef>(null);
  
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false, title: "", description: "", onConfirm: () => {}
  });

  const steps = ['rating', 'voting', 'subjective', 'summary'];

  useEffect(() => {
    // Robust Guest ID generation
    const generateGuestId = () => {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
      }
      return 'g-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    };

    let gid: string | null = null;
    if (typeof window !== 'undefined') {
        try {
            gid = localStorage.getItem('guest_id');
            if (!gid) {
                gid = generateGuestId();
                localStorage.setItem('guest_id', gid);
            }
        } catch (e) {
            console.warn("[Viewer] LocalStorage access blocked. Using session-based fallback.");
            // Generate a temporary ID that persists during the current page session
            gid = (window as any)._temp_guest_id || generateGuestId();
            (window as any)._temp_guest_id = gid;
        }
    }
    
    setGuestId(gid);
    console.log("[Viewer] Current Guest ID:", gid);

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
        
        let parsedCustom = result.project.custom_data;
        if (typeof parsedCustom === 'string') {
            try { parsedCustom = JSON.parse(parsedCustom); } catch (e) { parsedCustom = {}; }
        }
        setProject({ ...result.project, custom_data: parsedCustom || {} });
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        console.error("Failed to load project", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleStartReview = () => {
    if (!isAuthenticated) {
        setIsLoginGuidanceOpen(true);
    } else {
        setShowIntro(false);
    }
  };

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

  const handleNextStep = () => {
    if (currentStep === 0) {
        if (!michelinRef.current?.isValid()) { toast.error("모든 항목을 평가해주세요."); return; }
        setCurrentStep(1); return;
    }
    if (currentStep === 1) {
        if (!pollRef.current?.isValid()) { toast.error("스티커를 선택해주세요."); return; }
        setCurrentStep(2); return;
    }
    if (currentStep === 2) {
        const qs = project?.custom_data?.audit_config?.questions || [];
        if (qs.some((q: string) => !customAnswers[q]?.trim()) && qs.length > 0) {
            toast.error("아직 작성하지 않은 의견이 있습니다."); return;
        }
        setConfirmModal({
            isOpen: true, title: "최종 평가를 제출하시겠습니까?", description: "작성하신 모든 내용이 기록됩니다.",
            onConfirm: () => { setConfirmModal(p => ({ ...p, isOpen: false })); handleFinalSubmit(); }
        });
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const headers = { 
        'Content-Type': 'application/json',
        ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
      };
      const scoreValues = Object.values(michelinScores);
      const avgScore = scoreValues.length > 0 ? Number((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(1)) : 0;
      
      const res = await fetch(`/api/projects/${projectId}/rating`, {
        method: 'POST', headers,
        body: JSON.stringify({ 
            ...michelinScores, 
            score: avgScore, 
            custom_answers: customAnswers, 
            guest_id: !session ? guestId : undefined 
        })
      });
      if (!res.ok) throw new Error("Rating failed");
      
      if (pollSelection) {
        await fetch(`/api/projects/${projectId}/vote`, {
           method: 'POST', headers,
           body: JSON.stringify({ voteType: pollSelection, guest_id: !session ? guestId : undefined })
        });
      }
      setIsSubmitted(true);
      setCurrentStep(steps.length - 1);
      toast.success("평가가 제출되었습니다! 🎉");
    } catch (e: any) {
      console.error("[Viewer] Final Submit Error:", e);
      toast.error("평가 등록 실패", {
          description: e.message || "잠시 후 다시 시도해주세요."
      });
    }
  };

  if (loading || authLoading) return <div className="h-screen bg-background flex flex-col items-center justify-center gap-4"><div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" /><p className="text-orange-600 font-black uppercase text-[10px] animate-pulse">Loading...</p></div>;
  if (!project) return <div className="h-screen bg-background flex flex-col items-center justify-center gap-6"><X size={40} /><h2 className="text-2xl font-black">NOT FOUND</h2><Button onClick={() => router.push('/')}>Go Home</Button></div>;

  const auditType = project.custom_data?.audit_config?.type || 'link';
  const mediaData = project.custom_data?.audit_config?.mediaA || project.site_url || '';
  const finalDisplayUrl = typeof mediaData === 'string' ? mediaData : (Array.isArray(mediaData) ? mediaData[0] : '');

  const renderCurrentStep = () => {
    const st = steps[currentStep];
    if (st === 'rating') return <div className="flex flex-col h-full"><div className="text-center space-y-3 mb-8 shrink-0"><div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-600/10 rounded-full"><span className="text-[10px] font-black text-orange-600">STAGE 01. STAR RATING</span></div><h3 className="text-2xl font-black">평점 평가</h3></div><div className="flex-1 overflow-y-auto pb-10"><MichelinRating ref={michelinRef} projectId={projectId!} guestId={guestId || undefined} onChange={setMichelinScores} /></div></div>;
    if (st === 'voting') return <div className="flex flex-col h-full"><div className="text-center space-y-3 mb-8 shrink-0"><div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/10 rounded-full"><span className="text-[10px] font-black text-indigo-600">STAGE 02. STICKER</span></div><h3 className="text-xl font-black">판정 투표</h3></div><div className="flex-1 overflow-y-auto pb-10"><FeedbackPoll ref={pollRef} projectId={projectId!} guestId={guestId || undefined} onChange={setPollSelection} /></div></div>;
    if (st === 'subjective') {
        const qs = project.custom_data?.audit_config?.questions || [];
        return <div className="flex flex-col h-full"><div className="text-center mb-8"><h3 className="text-2xl font-black">종합 의견</h3></div><div className="flex-1 space-y-10 overflow-y-auto pb-20">{qs.map((q: string, i: number) => (<div key={i} className="space-y-3"><label className="font-black">Q{i+1}. {q}</label><textarea value={customAnswers[q] || ""} onChange={e => setCustomAnswers({ ...customAnswers, [q]: e.target.value })} className="w-full h-32 bg-chef-panel rounded-2xl p-5" /></div>))}</div></div>;
    }
    if (st === 'summary') return <div className="flex flex-col items-center justify-center text-center space-y-8 h-full"><CheckCircle2 size={48} className="text-orange-600" /><h3 className="text-4xl font-black uppercase italic">{project.title}</h3><Button onClick={() => router.push('/projects')}>다른 프로젝트 둘러보기</Button></div>;
    return null;
  };

  return (
    <main className="h-screen w-full bg-background flex flex-col overflow-hidden relative">
      <MyRatingIsHeader />
      <div className="flex-1 flex flex-col md:flex-row mt-16 overflow-hidden relative">
        <AnimatePresence>{showIntro && <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50"><ReviewIntro onStart={handleStartReview} project={project} /></motion.div>}</AnimatePresence>
        <div className="hidden md:flex flex-col flex-1 relative min-w-0 h-full bg-[#0f0f0f]">
          <div className="h-16 bg-chef-card border-b flex items-center justify-between px-6">
            <div className="flex items-center gap-4"><button onClick={() => router.back()}><ArrowLeft size={16} /></button><div className="bg-chef-panel px-4 py-1.5 rounded-full text-[10px] truncate w-64 uppercase">{finalDisplayUrl}</div></div>
            <div className="flex gap-4"><Monitor className={cn("cursor-pointer", viewerMode === 'desktop' ? "text-orange-500" : "opacity-20")} onClick={() => setViewerMode('desktop')} /><Smartphone className={cn("cursor-pointer", viewerMode === 'mobile' ? "text-orange-500" : "opacity-20")} onClick={() => setViewerMode('mobile')} /><Button size="sm" onClick={() => window.open(finalDisplayUrl, '_blank')}><Maximize2 size={12} /> Open</Button></div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className={cn("transition-all shadow-2xl bg-white overflow-hidden", viewerMode === 'mobile' ? "w-[375px] h-[812px] rounded-[3rem] border-[12px] border-chef-border" : "w-full h-full rounded-xl")}><MediaPreview type={auditType as any} data={mediaData} /></div>
          </div>
        </div>
        <div className="fixed inset-0 md:relative z-20 bg-chef-card flex flex-col h-full w-full md:border-l" style={{ width: (typeof window !== 'undefined' && window.innerWidth > 768) ? panelWidth : '100%' }}>
          <div onMouseDown={() => setIsResizing(true)} className="hidden md:block absolute top-0 -left-1 bottom-0 w-2 cursor-col-resize z-30" />
          <div className="p-6 border-b">
              <h3 className="text-xl font-black uppercase italic flex items-center gap-2"><ChefHat className="text-orange-500" /> 제 평가는요?</h3>
              {currentStep < steps.length - 1 && <div className="mt-4 h-1 w-full bg-chef-panel rounded-full overflow-hidden"><div className="h-full bg-orange-600 transition-all" style={{ width: `${((currentStep+1)/3)*100}%` }} /></div>}
          </div>
          <div className="flex-1 overflow-hidden p-6 relative">{renderCurrentStep()}</div>
          {currentStep < steps.length - 1 && (
            <div className="p-6 border-t flex gap-4">
              {currentStep > 0 && <Button variant="outline" onClick={() => setCurrentStep(p => p - 1)}><ChevronLeft /></Button>}
              <Button onClick={handleNextStep} className="flex-1 bg-orange-600 text-white font-black">{currentStep < steps.length - 2 ? "다음 단계로" : "제출하기"}</Button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={confirmModal.isOpen} onOpenChange={o => setConfirmModal(p => ({ ...p, isOpen: o }))}><DialogContent className="max-w-md bg-chef-card rounded-3xl p-8"><DialogHeader><DialogTitle>{confirmModal.title}</DialogTitle><DialogDescription>{confirmModal.description}</DialogDescription></DialogHeader><DialogFooter className="mt-6"><Button variant="outline" onClick={() => setConfirmModal(p => ({ ...p, isOpen: false }))}>취소</Button><Button onClick={confirmModal.onConfirm} className="bg-orange-600 text-white">확인</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isLoginGuidanceOpen} onOpenChange={setIsLoginGuidanceOpen}>
        <DialogContent className="max-w-md bg-chef-card border-chef-border text-chef-text rounded-[2rem] p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <ChefHat className="text-orange-500" /> 평가 위원 로그인
            </DialogTitle>
            <DialogDescription className="text-chef-text opacity-60 font-medium">
              로그인하시면 평가 이력이 보관되며, 창작자에게 신뢰도를 줄 수 있는 배지가 표시됩니다. 물론 비회원으로 평가하실 수도 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
                variant="outline" 
                onClick={() => { setIsLoginGuidanceOpen(false); setShowIntro(false); }}
                className="flex-1 h-12 rounded-xl font-bold opacity-60 hover:opacity-100"
            >
                비회원으로 진행하기
            </Button>
            <Button 
                onClick={() => {
                    const returnTo = window.location.pathname + window.location.search;
                    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
                }}
                className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl"
            >
                로그인하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ViewerContent /></Suspense>;
}
