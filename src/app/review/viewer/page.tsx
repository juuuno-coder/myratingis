"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Monitor, 
  Smartphone, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  ChefHat,
  X,
  Star as StarIcon,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MichelinRating } from '@/components/MichelinRating';
import { FeedbackPoll } from '@/components/FeedbackPoll';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { MediaPreview } from '@/components/Review/MediaPreview';

type ViewerMode = 'desktop' | 'mobile';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  
  const [viewerMode, setViewerMode] = useState<ViewerMode>('desktop');
  const [panelWidth, setPanelWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Review State
  const [currentStep, setCurrentStep] = useState(0); 
  const [steps, setSteps] = useState<string[]>([]);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [proposalContent, setProposalContent] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!projectId) {
      router.push('/');
      return;
    }

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('Project')
          .select('*')
          .eq('project_id', Number(projectId))
          .single();

        if (error) throw error;
        setProject(data);
        
        // Generate Steps
        const newSteps: string[] = [];
        const auditConfig = data.custom_data?.audit_config;
        
        // 1. Michelin Ratings
        const categories = auditConfig?.categories || [];
        if (categories.length > 0) {
          categories.forEach((_: any, idx: number) => newSteps.push(`rating_${idx}`));
        } else {
          // Fallback if no categories
          newSteps.push('rating_0', 'rating_1', 'rating_2', 'rating_3', 'rating_4');
        }
        
        // 2. Sticker Voting
        newSteps.push('voting');
        
        // 3. Subjective Questions
        const questions = auditConfig?.questions || [];
        if (questions.length > 0) {
          newSteps.push('subjective');
        }
        
        // 4. Summary
        newSteps.push('summary');
        
        setSteps(newSteps);
      } catch (e) {
        console.error("Failed to load project", e);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 350 && newWidth < 800) setPanelWidth(newWidth);
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
    if (currentStep < steps.length - 1) {
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
      // For MyRatingIs, we can allow guest submissions or require login
      // Let's implement a simple submission for now
      const res = await fetch(`/api/projects/${projectId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal: proposalContent,
          custom_answers: customAnswers,
          // Individual scores are handled by MichelinRating component via auto-save usually,
          // but here we might want to consolidate. For now, following current pattern.
        })
      });

      if (!res.ok) throw new Error("Submission failed");
      
      setIsSubmitted(true);
      toast.success("평가가 제출되었습니다! 🎉");
    } catch (e) {
      console.error(e);
      toast.error("제출 중 오류가 발생했습니다.");
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const previewUrl = project?.primary_url || project?.preview_url || project?.url;
  const auditType = project?.custom_data?.audit_config?.type || 'link';
  const mediaData = project?.custom_data?.audit_config?.mediaA || previewUrl;

  const renderCurrentStep = () => {
    const stepType = steps[currentStep];
    
    if (stepType?.startsWith('rating_')) {
      const idx = parseInt(stepType.split('_')[1]);
      return <MichelinRating projectId={projectId!} activeCategoryIndex={idx} />;
    }

    if (stepType === 'voting') {
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-white">최종 판정</h3>
            <p className="text-sm text-white/40 font-medium">{project?.custom_data?.audit_config?.poll?.desc || "당신의 선택은 무엇입니까?"}</p>
          </div>
          <FeedbackPoll projectId={projectId!} />
        </div>
      );
    }

    if (stepType === 'subjective') {
      const questions = project?.custom_data?.audit_config?.questions || [];
      return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-white">심층 질문</h3>
            <p className="text-sm text-white/40 font-medium">프로젝트에 대한 당신의 세심한 의견을 남겨주세요.</p>
          </div>
          <div className="space-y-8">
            {questions.map((q: string, i: number) => (
              <div key={i} className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-orange-500 font-black">Q{i+1}</span>
                  <label className="text-white font-bold">{q}</label>
                </div>
                <textarea 
                  value={customAnswers[q] || ""}
                  onChange={e => setCustomAnswers({ ...customAnswers, [q]: e.target.value })}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-white focus:border-orange-500 outline-none resize-none transition-all"
                  placeholder="의견을 입력해 주세요..."
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (stepType === 'summary') {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-8 py-10 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-orange-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_20px_40px_rgba(234,88,12,0.3)]">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-white">평가 완료</h3>
            <p className="text-white/40 font-medium">모든 진단 항목을 확인했습니다.<br />지금 제출하여 창작자에게 의견을 전달하시겠습니까?</p>
          </div>
          <div className="w-full p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 font-black uppercase">평가 항목</span>
              <span className="text-orange-500 font-black">완료</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 font-black uppercase">스티커 판정</span>
              <span className="text-orange-500 font-black">완료</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <main className="h-screen w-full bg-[#050505] flex flex-col md:flex-row overflow-hidden">
      {/* Left Area: Project Preview */}
      <div className="flex-1 relative flex flex-col min-w-0 h-full border-r border-white/5">
        {/* Top Header for Control */}
        <div className="h-14 bg-[#0a0a0a] border-b border-white/5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex gap-1.5 opacity-40">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
             </div>
             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Live Diagnostic Preview</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                <button onClick={() => setViewerMode('desktop')} className={cn("p-2 rounded-md transition-all", viewerMode === 'desktop' ? "bg-white/10 text-white" : "text-white/20")}><Monitor size={14} /></button>
                <button onClick={() => setViewerMode('mobile')} className={cn("p-2 rounded-md transition-all", viewerMode === 'mobile' ? "bg-white/10 text-white" : "text-white/20")}><Smartphone size={14} /></button>
             </div>
             <Button variant="ghost" size="sm" className="h-8 px-3 text-white/40 hover:text-white rounded-lg gap-2 text-[10px] font-black" onClick={() => window.open(previewUrl || '', '_blank')}><Maximize2 size={12} /> OPEN IN NEW TAB</Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#050505] flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
          <div className={cn(
            "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_40px_100px_rgba(0,0,0,0.5)] bg-black relative",
            viewerMode === 'mobile' ? "w-[375px] h-[812px] rounded-[3rem] border-[12px] border-white/10" : "w-full h-full rounded-2xl"
          )}>
            <MediaPreview type={auditType as any} data={mediaData} />
          </div>
        </div>
      </div>

      {/* Right Area: Evaluation Panel */}
      <div 
        className="fixed bottom-0 right-0 top-0 md:relative z-20 bg-[#0a0a0a] flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.5)] h-[60vh] md:h-full w-full"
        style={{ width: (typeof window !== 'undefined' && window.innerWidth > 768) ? panelWidth : '100%' }}
      >
        {/* Resize Handle */}
        <div 
          onMouseDown={() => setIsResizing(true)} 
          className="hidden md:flex absolute top-0 left-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500/50 transition-colors group items-center justify-center" 
        >
          <div className="w-[1px] h-20 bg-white/10 group-hover:bg-orange-500 transition-colors" />
        </div>

        {/* Panel Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full mb-3 inline-block">Evaluation Step {currentStep + 1}</span>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter">제 평가는요?</h3>
          </div>
          <button onClick={() => router.back()} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div
               key={currentStep}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="h-full"
             >
               {renderCurrentStep()}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Panel Footer */}
        <div className="p-6 md:p-8 border-t border-white/5 flex gap-4 shrink-0 bg-[#0a0a0a]">
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={handlePrevStep} 
              className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 text-white/60 hover:text-white transition-all font-bold"
            >
              <ChevronLeft />
            </Button>
          )}
          <Button 
            onClick={handleNextStep}
            className="flex-1 h-16 rounded-[1.5rem] bg-orange-600 hover:bg-orange-500 text-white font-black text-lg transition-all hover:scale-[1.02] shadow-xl"
          >
            {currentStep < steps.length - 1 ? "다음 항목으로" : "진단 제출하기"}
          </Button>
        </div>
      </div>

      {/* Completion Modal */}
      {isSubmitted && (
         <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-[3rem] p-10 md:p-16 max-w-lg w-full text-center space-y-8 shadow-[0_40px_100px_rgba(255,165,0,0.1)]"
            >
              <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white leading-tight">진단이 성공적으로<br />제출되었습니다</h3>
                <p className="text-white/40 font-medium leading-relaxed">당신의 냉철한 피드백이 창작자에게 전달되었습니다.<br />수고하셨습니다, 셰프.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <Button onClick={() => router.push('/')} className="h-14 rounded-2xl bg-white text-black font-black">홈으로</Button>
                 <Button variant="outline" className="h-14 rounded-2xl border-white/10 text-white font-black hover:bg-white/5">이력 확인</Button>
              </div>
            </motion.div>
         </div>
      )}
    </main>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#050505] flex items-center justify-center text-orange-500 font-black animate-pulse uppercase tracking-[0.2em] text-sm">Initializing Viewer System...</div>}>
      <ViewerContent />
    </Suspense>
  );
}
