"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCamera, 
  faCheck, 
  faPlus,
  faTrash,
  faStar,
  faGift,
  faCoins,
  faCalculator
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { uploadImage } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Sparkles, Info, Globe, Link } from "lucide-react";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { supabase } from "@/lib/supabase/client";
const STICKER_PRESETS: Record<string, any[]> = {
    professional: [
      { id: 'pr1', label: '당장 런칭하시죠!\n기대되는 결과물!', desc: '시장에 즉시 내놓아도 손색없을 만큼\n압도적인 퀄리티와 가치를 증명한 프로젝트', image_url: '/review/a1.jpeg' },
      { id: 'pr2', label: '좋긴 한데...\n한 끗이 아쉽네요', desc: '기획의 방향은 훌륭하나, 사용자 경험(UX)이나\n디테일한 마감에서 보완이 필요한 상태', image_url: '/review/a2.jpeg' },
      { id: 'pr3', label: '기획부터 다시!\n싹 갈아엎읍시다', desc: '컨셉의 정체성이 모호하거나 핵심 기능에 대한\n전면적인 재검토가 필요한 프로젝트', image_url: '/review/a3.jpeg' }
    ],
  michelin: [
    { id: 'mi1', label: '3스타급 완성도!\n완벽한 미식 경험', desc: '예술성과 상업성을 모두 잡은,\n누구나 소유하고 싶어 할 만큼 가치가 뛰어난 프로젝트', image_url: '/review/a1.jpeg' },
    { id: 'mi2', label: '훌륭한 요리,\n하지만 향신료가 부족함', desc: '기본기는 탄탄하지만 이 프로젝트만의\n확실한 개성(Kick)을 더 보여줄 필요가 있는 상태', image_url: '/review/a2.jpeg' },
    { id: 'mi3', label: '재료 선택부터\n다시 고민해야 할 맛', desc: '타겟과 목적이 불분명하여 근본적인\n기획 의도부터 다시 정립해야 하는 프로젝트', image_url: '/review/a3.jpeg' }
  ],
  mz: [
    { id: 'mz1', label: '폼 미쳤다!\n그대로 입사하세요', desc: '더 이상 설명이 필요 없는 압승!\n즉각적인 실행이 가능한 수준의 고퀄리티', image_url: '/review/a1.jpeg' },
    { id: 'mz2', label: '예쁜데 뭔가...\n묘하게 2% 부족함', desc: '비주얼은 좋으나 사용성이나 실용성 측면에서\n한 단계 업그레이드가 필요한 단계', image_url: '/review/a2.jpeg' },
    { id: 'mz3', label: '길을 잃었습니다...\nGPS 재탐색 필요', desc: '무엇을 말하려는지 잘 모르겠어요.\n핵심 기능과 타겟을 다시 정의해 보세요.', image_url: '/review/a3.jpeg' }
  ]
};

export default function ProjectUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, userProfile, loading: authLoading, isAdmin } = useAuth();
  
  // 1. Move ALL Hooks to the top (Before any early returns)
  const [rewardType, setRewardType] = useState<'none' | 'point' | 'coupon'>('none');
  const [rewardAmount, setRewardAmount] = useState(500);
  const [recipientCount, setRecipientCount] = useState(10);
  const [distributeMethod, setDistributeMethod] = useState<'fcfs' | 'author'>('fcfs');
  const [auditStep, setAuditStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');
  const [auditDeadline, setAuditDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [auditType, setAuditType] = useState<'link' | 'image' | 'video' | 'document'>('link');
  const [mediaData, setMediaData] = useState<string | string[]>("");
  const [customCategories, setCustomCategories] = useState<any[]>([
    { id: 'm1', label: '기획력', desc: '탄탄한 논리와 명확한 문제 해결 전략' },
    { id: 'm2', label: '독창성', desc: '기존의 틀을 깨는 신선하고 개성 있는 시도' },
    { id: 'm3', label: '심미성', desc: '눈을 사로잡는 세련된 디자인과 레이아웃' },
    { id: 'm4', label: '완성도', desc: '작은 디테일까지 놓치지 않은 집요한 마감' },
    { id: 'm5', label: '상업성', desc: '시장의 니즈를 꿰뚫는 가치와 비즈니스 가능성' }
  ]);
  const [selectedPreset, setSelectedPreset] = useState<'professional' | 'michelin' | 'mz'>('professional');
  const [pollOptions, setPollOptions] = useState<any[]>([]);
  const [pollDesc, setPollDesc] = useState("현업 마스터의 냉정한 피드백");
  const [auditQuestions, setAuditQuestions] = useState<string[]>([
    "이 프로젝트의 가장 큰 장점은 무엇인가요?",
    "이 프로젝트에서 가장 시급하게 보완해야할 점은 무엇인가요?",
    "발전을 위해 조언해 주실 부분이 있다면 자유롭게 말씀해 주세요."
  ]);

  const mode = searchParams.get('mode') || 'audit'; 

  // 2. Auth Guard Effects
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("평가 의뢰를 위해 로그인이 필요합니다.");
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [authLoading, user, router]);

  // 3. Early Return ONLY AFTER Hook Initializations
  // 4. Initialization Logic
  useEffect(() => {
    if (!pollOptions.length) {
       setPollOptions(STICKER_PRESETS.professional);
    }
  }, []);

  // [New] Edit Mode Data Fetching
  const editId = searchParams.get('edit');
  useEffect(() => {
    if (editId) {
      const fetchProject = async () => {
        const { data, error } = await supabase
          .from('Project')
          .select('*')
          .eq('project_id', Number(editId))
          .single();
        
        if (!error && data) {
          const p = data as any;
          setTitle(p.title || "");
          setSummary(p.summary || "");
          setVisibility(p.visibility as any || 'public');
          if (p.audit_deadline) setAuditDeadline(p.audit_deadline.split('T')[0]);
          
          const config = p.custom_data?.audit_config;
          if (config) {
            setAuditType(config.type || 'link');
            setMediaData(config.mediaA || "");
            if (config.categories) setCustomCategories(config.categories);
            if (config.poll) {
                setPollDesc(config.poll.desc || "");
                setPollOptions(config.poll.options || []);
            }
            if (config.questions) setAuditQuestions(config.questions);
          }
        }
      };
      fetchProject();
    }
  }, [editId]);

  useEffect(() => {
    if (auditType === 'link' && typeof mediaData === 'string' && mediaData.includes('.')) {
      const timer = setTimeout(async () => {
        setIsLoadingPreview(true);
        try {
          const urlToFetch = mediaData.startsWith('http') ? mediaData : `https://${mediaData}`;
          const response = await fetch(`/api/og-preview?url=${encodeURIComponent(urlToFetch)}`);
          if (response.ok) {
            const data = await response.json();
            setLinkPreview(data.title || data.image ? data : null);
          } else {
            setLinkPreview(null);
          }
        } catch (e) {
          console.error("OG Preview Error", e);
          setLinkPreview(null);
        } finally {
          setIsLoadingPreview(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setLinkPreview(null);
    }
  }, [mediaData, auditType]);

  // No early return here anymore to ensure all hooks are called every render.

  const handlePresetChange = (preset: 'professional' | 'michelin' | 'mz') => {
    setSelectedPreset(preset);
    setPollOptions(STICKER_PRESETS[preset]);
    const desc = preset === 'professional' ? "[몰입형] 현업 전문가의 리얼한 반응" 
               : preset === 'michelin' ? "[미슐랭형] 미식 가이드 컨셉" 
               : "[MZ·위트형] 직관적이고 가벼운 반응";
    setPollDesc(desc);
  };


  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("제목을 입력해주세요.");
    if (customCategories.length < 3) return toast.error("평가 항목은 최소 3개 이상이어야 합니다.");
    if (pollOptions.length < 2) return toast.error("스티커 항목은 최소 2개 이상이어야 합니다.");
    if (auditQuestions.length < 1) return toast.error("종합 의견 질문은 최소 1개 이상이어야 합니다.");

    setIsSubmitting(true);
    try {
      if (!session) {
        toast.error("로그인이 필요합니다.");
        router.push("/login?returnTo=/project/upload");
        return;
      }

      const token = session.access_token;

      const projectData = {
        title,
        summary: summary || title,
        content_text: summary || title,
        description: summary || title,
        category_id: 1,
        thumbnail_url: linkPreview?.image || undefined, // [Feature] Use captured link image as thumbnail
        visibility: visibility,
        audit_deadline: auditDeadline,
        is_growth_requested: true,
        custom_data: {
          is_feedback_requested: true,
          audit_config: {
             type: auditType,
             mediaA: mediaData,
             categories: customCategories,
             poll: { desc: pollDesc, options: pollOptions },
             questions: auditQuestions,
             reward: {
               type: rewardType,
               amount: rewardAmount,
               count: recipientCount,
               method: distributeMethod
             }
          }
        }
      };

      const res = await fetch(editId ? `/api/projects/${editId}` : "/api/projects", {
        method: editId ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(projectData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "등록 실패");
      
      toast.success(editId ? "수정이 완료되었습니다!" : "평가 의뢰가 성공적으로 등록되었습니다!");
      router.push(`/project/share/${editId || data.project.project_id}`);
    } catch (error: any) {
      toast.error(error.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center gap-4 border-l-4 border-orange-500 pl-4 py-1">
          <h3 className="text-3xl font-black text-chef-text tracking-tighter uppercase italic">평가 의뢰 정보</h3>
        </div>

        {/* Informational Banner for Creators */}
        <div className="bg-orange-500/5 border border-orange-500/10 p-10 rounded-sm space-y-6 bevel-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000 -mr-4 -mt-4">
              <Sparkles size={120} />
           </div>
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center bevel-sm">
                 <Sparkles size={20} />
              </div>
              <h4 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em] italic">Creator Tip: 비회원 참여 및 데이터 통합</h4>
           </div>
           <p className="text-xs text-chef-text opacity-80 leading-relaxed font-bold max-w-2xl relative z-10">
              제 평가는요? 시스템은 <span className="text-orange-500">비회원 참여</span>를 공식 지원합니다. 
              가입하지 않은 팀원이나 커스터머에게도 링크 하나로 평가를 요청하세요. 
              참여자가 추후 가입할 경우, 이전에 남긴 모든 소중한 피드백이 해당 계정으로 자동 통합되어 안전하게 관리됩니다.
           </p>
        </div>
        
        <div className="space-y-6">
          <div className="chef-black-panel p-1 rounded-sm border border-chef-border/30 hover:border-orange-500/50 transition-colors shadow-sm">
            <input 
              placeholder="평가받을 제목 (예: 커피 배달 매칭 MVP)" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full h-20 bg-chef-panel border-none text-2xl font-black text-chef-text px-10 placeholder:text-chef-text/20 outline-none chef-input-high-v rounded-sm"
            />
          </div>
          <div className="chef-black-panel p-1 rounded-sm border border-chef-border/30 hover:border-orange-500/50 transition-colors shadow-sm">
            <input 
              placeholder="한 줄 설명 (예: 바쁜 직원을 위한 가장 빠른 커피 배달)" 
              value={summary} 
              onChange={e => setSummary(e.target.value)} 
              className="w-full h-14 bg-chef-panel border-none text-sm font-bold text-chef-text opacity-70 px-10 placeholder:text-chef-text/20 outline-none chef-input-high-v rounded-sm"
            />
          </div>
        </div>
        
        <div className="flex gap-4">
             <button 
               onClick={() => setVisibility('public')}
               className={cn(
                  "flex-1 h-16 rounded-sm bevel-cta border transition-all flex flex-col items-center justify-center gap-2",
                  visibility === 'public' 
                     ? "bg-orange-500/10 border-orange-500 text-orange-500" 
                     : "bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100"
               )}
             >
                <Globe size={20} />
                <div className="flex flex-col items-center">
                   <span className="text-xs font-black uppercase tracking-widest">전체 공개</span>
                   <span className="text-[9px] font-bold opacity-70">누구나 검색하고 평가 가능</span>
                </div>
             </button>
             <button 
               onClick={() => setVisibility('unlisted')}
               className={cn(
                  "flex-1 h-16 rounded-sm bevel-cta border transition-all flex flex-col items-center justify-center gap-2",
                  visibility === 'unlisted' 
                     ? "bg-indigo-500/10 border-indigo-500 text-indigo-500" 
                     : "bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100"
               )}
             >
                <Link size={20} />
                <div className="flex flex-col items-center">
                   <span className="text-xs font-black uppercase tracking-widest">링크 일부 공개</span>
                   <span className="text-[9px] font-bold opacity-70">링크를 가진 사람만 평가 가능</span>
                </div>
             </button>
        </div>
      </section>

      <section className="bevel-border bevel-section p-8 md:p-12 space-y-10">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-black text-chef-text flex items-center gap-3 italic">
             <FontAwesomeIcon icon={faCamera} className="text-orange-500" /> 대상 미디어 및 마감 기한
          </h4>
          <div className="relative">
             <Label className="text-[10px] font-black text-chef-text opacity-30 uppercase absolute -top-4 right-0 tracking-widest">평가 마감일</Label>
             <input type="date" value={auditDeadline} onChange={e => setAuditDeadline(e.target.value)} className="bg-white/5 text-chef-text border border-chef-border px-4 py-2 text-xs font-black bevel-cta outline-none focus:border-orange-500 transition-all cursor-pointer chef-input-high-v" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {(['link', 'image', 'video', 'document'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => {
                setAuditType(t);
                setMediaData(t === 'image' || t === 'document' ? [] : "");
              }} 
              className={cn(
                "h-14 font-black text-xs uppercase tracking-widest transition-all bevel-cta border border-chef-border",
                auditType === t ? "bg-chef-text text-chef-bg" : "bg-chef-bg text-chef-text opacity-40 hover:opacity-100"
              )}
            >
              {t === 'link' ? "웹 링크" : t === 'image' ? "이미지" : t === 'video' ? "유튜브" : "문서(PDF/HWP/DOC)"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {auditType === 'image' || auditType === 'document' ? (
             <div className="flex flex-col gap-4 p-6 bg-chef-panel bevel-section border border-chef-border min-h-[160px]">
               <div className="flex flex-wrap gap-4">
                 {Array.isArray(mediaData) && mediaData.map((file, i) => (
                   <div key={i} className="relative group">
                     {auditType === 'image' ? (
                        <div className="w-24 h-24 bevel-sm overflow-hidden relative">
                           <img src={file} className="w-full h-full object-cover" />
                        </div>
                     ) : (
                        <div className="w-32 h-32 bevel-sm bg-chef-card border border-chef-border flex flex-col items-center justify-center p-2 text-center">
                           <div className="text-2xl mb-1">📄</div>
                           <span className="text-[10px] font-black text-chef-text opacity-50 truncate w-full px-1">
                              {(file?.split('/')?.pop()?.split('?')?.[0]) || "document.pdf"}
                           </span>
                        </div>
                     )}
                     <button 
                       onClick={() => setMediaData((mediaData as string[]).filter((_, j) => j !== i))} 
                       className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                     >
                       <FontAwesomeIcon icon={faTrash} size="xs" />
                     </button>
                   </div>
                 ))}
                 <label className="w-24 h-24 bevel-sm border-2 border-dashed border-chef-border flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-chef-text opacity-20 hover:opacity-100">
                   <FontAwesomeIcon icon={faPlus} className="mb-2" />
                   <span className="text-[8px] font-black uppercase">{auditType === 'image' ? '이미지' : '파일'} 추가</span>
                   <input 
                     type="file" 
                     multiple 
                     accept={auditType === 'image' ? "image/*" : ".pdf,.hwp,.doc,.docx"} 
                     className="hidden" 
                     onChange={async e => {
                       if (e.target.files) {
                         toast.info("파일 업로드 중...", { id: 'uploading' });
                         try {
                           const urls = await Promise.all(Array.from(e.target.files).map(f => uploadImage(f)));
                           setMediaData([...(Array.isArray(mediaData) ? mediaData : []), ...urls]);
                           toast.success("업로드 완료!", { id: 'uploading' });
                         } catch (err) {
                           toast.error("업로드 실패", { id: 'uploading' });
                         }
                       }
                     }} 
                   />
                 </label>
               </div>
               {auditType === 'document' && (
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-2">* PDF, HWP, DOC 파일만 지원합니다.</p>
               )}
             </div>
          ) : (
            <div className="space-y-4">
              <div className="chef-black-panel p-1 rounded-sm border-none shadow-sm">
                <input 
                  value={typeof mediaData === 'string' ? mediaData : ''} 
                  onChange={e => setMediaData(e.target.value)} 
                  placeholder={auditType === 'link' ? "wayo.co.kr" : "YouTube 영상 주소..."} 
                  className="w-full h-16 bg-chef-panel border-none text-chef-text font-black px-8 text-lg bevel-sm placeholder:text-chef-text/30 outline-none transition-colors chef-input-high-v rounded-sm"
                />
              </div>
              
              {linkPreview && (
                 <div className="chef-black-panel bevel-section p-6 border border-chef-border space-y-4 animate-in fade-in slide-in-from-top-2">
                   <div className="flex gap-6 items-center">
                     {linkPreview.image && <img src={linkPreview.image} className="w-24 h-24 object-cover bevel-sm shrink-0 border border-chef-border" />}
                     <div className="space-y-1">
                        <h5 className="text-xl font-black text-chef-text leading-tight">{linkPreview.title || "링크 미리보기"}</h5>
                        <p className="text-xs font-black text-chef-text opacity-40 line-clamp-2 uppercase tracking-wide">{linkPreview.description || "설명이 없습니다."}</p>
                     </div>
                   </div>
                 </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => setAuditStep(2)} 
          className="h-16 px-12 bg-orange-600 hover:bg-orange-700 text-white text-lg font-black transition-all hover:scale-105 bevel-section shadow-[0_20px_40px_rgba(234,88,12,0.2)]"
        >
          다음 단계로 <FontAwesomeIcon icon={faCheck} className="ml-3" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-chef-border pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500 text-white flex items-center justify-center text-2xl bevel-section">🎯</div>
            <div>
              <h3 className="text-2xl font-black text-chef-text tracking-tighter uppercase italic">1. 미슐랭 평가 설정</h3>
              <p className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-[0.3em] mt-0.5">평가 기준 설정</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-chef-text opacity-20">{customCategories.length}/10</span>
            <Button variant="outline" onClick={() => setCustomCategories([...customCategories, { id: `cat-${Date.now()}`, label: "", desc: "" }])} disabled={customCategories.length >= 10} className="bevel-sm border-chef-border h-10 font-black text-chef-text bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[10px] tracking-widest px-4 uppercase transition-all">
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> 항목 추가
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customCategories.map((cat, idx) => (
            <div key={idx} className="chef-black-panel bevel-section p-10 border border-chef-border/50 relative group hover:border-orange-500 transition-all bg-chef-card shadow-lg">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-chef-panel text-chef-text opacity-20 flex items-center justify-center bevel-sm shrink-0 font-black text-xs">
                   0{idx+1}
                </div>
                <div className="flex-1 space-y-1">
                  <input value={cat.label} onChange={e => {
                    const next = [...customCategories];
                    next[idx].label = e.target.value;
                    setCustomCategories(next);
                  }} className="font-black text-chef-text outline-none w-full bg-transparent text-xl placeholder:text-chef-text/10 chef-input-high-v" placeholder="평가 항목명" />
                  <input value={cat.desc} onChange={e => {
                    const next = [...customCategories];
                    next[idx].desc = e.target.value;
                    setCustomCategories(next);
                  }} className="text-[10px] text-chef-text opacity-40 outline-none w-full bg-transparent font-black uppercase tracking-widest chef-input-high-v placeholder:text-chef-text/5" placeholder="가이드라인 입력..." />
                </div>
              </div>
              {customCategories.length > 3 && (
                <button onClick={() => setCustomCategories(customCategories.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-chef-text hover:text-red-500 transition-all">
                  <FontAwesomeIcon icon={faTrash} size="xs" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-between items-center pt-8">
        <Button variant="ghost" onClick={() => setAuditStep(1)} className="h-14 px-8 font-black text-chef-text opacity-40 hover:opacity-100 uppercase tracking-widest text-xs transition-opacity">이전 단계</Button>
        <Button onClick={() => setAuditStep(3)} className="h-20 px-16 bg-chef-text text-chef-bg hover:opacity-90 text-lg font-black bevel-cta transition-transform hover:scale-105 shadow-2xl uppercase tracking-widest border border-chef-border/20">
            다음: 스티커 투표 설정 <FontAwesomeIcon icon={faPlus} className="ml-3" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-chef-border pb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 text-white flex items-center justify-center text-2xl bevel-section">📊</div>
            <div>
              <h3 className="text-2xl font-black text-chef-text tracking-tighter uppercase italic">2. 스티커 투표 설정</h3>
              <p className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-[0.3em] mt-0.5">스티커 투표 옵션</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-auto">
            {/* Preset Selector */}
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-chef-text opacity-40 uppercase tracking-widest text-right">프리셋 선택</span>
                <div className="flex bg-chef-panel p-1 bevel-sm gap-1 self-end">
                  <button onClick={() => handlePresetChange('professional')} className={cn("px-4 py-2 text-[10px] font-black uppercase transition-all", selectedPreset === 'professional' ? "bg-chef-text text-chef-bg shadow-lg" : "text-chef-text opacity-40 hover:opacity-100")}>전문가 (Professional)</button>
                  <button onClick={() => handlePresetChange('michelin')} className={cn("px-4 py-2 text-[10px] font-black uppercase transition-all", selectedPreset === 'michelin' ? "bg-chef-text text-chef-bg shadow-lg" : "text-chef-text opacity-40 hover:opacity-100")}>미슐랭 (Michelin)</button>
                  <button onClick={() => handlePresetChange('mz')} className={cn("px-4 py-2 text-[10px] font-black uppercase transition-all", selectedPreset === 'mz' ? "bg-chef-text text-chef-bg shadow-lg" : "text-chef-text opacity-40 hover:opacity-100")}>MZ세대 (MZ)</button>
                </div>
            </div>
            
            <div className="flex items-center gap-4 justify-end">
              <span className="text-xs font-black text-chef-text opacity-20">{pollOptions.length}/6</span>
              <Button onClick={() => setPollOptions([...pollOptions, { id: `p-${Date.now()}`, label: "", desc: "", image_url: "" }])} disabled={pollOptions.length >= 6} className="bevel-sm h-10 bg-chef-panel text-chef-text border border-chef-border hover:bg-black/5 dark:hover:bg-white/5 font-black text-[10px] uppercase tracking-widest transition-all"><FontAwesomeIcon icon={faPlus} className="mr-2" /> 항목 추가</Button>
            </div>
          </div>
        </div>

        <div className="chef-frame-container">
          <div className="chef-frame-header">스티커 메뉴</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="chef-menu-card group">
                {/* 상단 이미지 영역 */}
                <div className="relative group/img">
                  <label 
                    htmlFor={`sticker-upload-${idx}`}
                    className="w-full aspect-[4/3] bg-chef-panel border-b border-chef-border flex items-center justify-center cursor-pointer overflow-hidden relative"
                  >
                    {opt.image_url ? (
                      <img src={opt.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                    ) : (
                      <FontAwesomeIcon icon={faCamera} className="text-chef-text opacity-10 text-3xl" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                      <span className="text-[10px] text-white font-black uppercase tracking-widest border border-white/20 px-4 py-2">이미지 선택</span>
                    </div>
                  </label>
                  <input 
                    id={`sticker-upload-${idx}`}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const toastId = toast.loading(`${idx + 1}번 스티커 이미지 업로드 중...`);
                        try {
                          const url = await uploadImage(file);
                          const next = [...pollOptions];
                          next[idx].image_url = url;
                          setPollOptions(next);
                          toast.success("업로드 완료!", { id: toastId });
                        } catch (err: any) {
                          console.error("Sticker upload error:", err);
                          toast.error("업로드 실패: " + (err.message || "알 수 없는 오류"), { id: toastId });
                        }
                      }
                    }} 
                  />
                </div>

                {/* 하단 90% 블랙 불투명 영역 */}
                <div className="chef-menu-bottom min-h-[160px] py-6 px-4">
                  <textarea 
                    value={opt.label} 
                    onChange={e => {
                      const next = [...pollOptions];
                      next[idx].label = e.target.value;
                      setPollOptions(next);
                    }} 
                    className="w-full font-black text-chef-text outline-none bg-transparent text-center text-lg placeholder:text-chef-text/10 mb-2 resize-none h-16 chef-input-high-v overflow-hidden whitespace-pre-wrap leading-tight" 
                    placeholder="메뉴 명칭" 
                    rows={2}
                  />
                  <div className="chef-line-detail" />
                  <textarea 
                    value={opt.desc} 
                    onChange={e => {
                      const next = [...pollOptions];
                      next[idx].desc = e.target.value;
                      setPollOptions(next);
                    }} 
                    className="w-full text-[10px] text-chef-text opacity-40 bg-transparent resize-none outline-none font-black uppercase tracking-widest text-center h-20 placeholder:text-chef-text/5 chef-input-high-v whitespace-pre-wrap leading-relaxed" 
                    placeholder="메뉴 설명 입력..." 
                    rows={3} 
                  />
                </div>

                {/* 삭제 버튼 */}
                {pollOptions.length > 2 && (
                  <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-white/10">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center pt-10 border-t border-chef-border">
        <Button variant="ghost" onClick={() => setAuditStep(2)} className="h-14 px-8 font-black text-chef-text opacity-50 hover:opacity-100 uppercase tracking-widest text-xs transition-opacity">이전 단계</Button>
        <Button onClick={() => setAuditStep(4)} className="h-16 px-16 bg-chef-text text-chef-bg hover:opacity-90 text-lg font-black bevel-cta transition-transform hover:scale-105 shadow-2xl uppercase tracking-widest">다음: 심층 질문 설정 <FontAwesomeIcon icon={faPlus} className="ml-3" /></Button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-l-4 border-orange-500 pl-4">
           <h3 className="text-3xl font-black text-chef-text tracking-tighter uppercase italic">3. 심층 질문지 구성</h3>
        </div>
        <p className="text-sm text-chef-text opacity-40 font-bold max-w-2xl">
          평가자들에게 더 자세히 묻고 싶은 질문을 던지세요. 
          답변은 텍스트 형태로 수집되며, 프로젝트 개선의 핵심 인사이트가 됩니다.
        </p>
        <div className="space-y-4">
          {auditQuestions.map((q, idx) => (
            <div key={idx} className="flex flex-col gap-3 group p-8 bg-chef-panel bevel-section border border-chef-border relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] italic">심층 질문 {idx+1}</span>
                {auditQuestions.length > 1 && (
                  <button onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))} className="text-chef-text opacity-20 hover:text-red-400 hover:opacity-100 transition-all p-1">
                    <FontAwesomeIcon icon={faTrash} size="sm" />
                  </button>
                )}
              </div>
              <textarea 
                value={q} 
                onChange={e => {
                   const next = [...auditQuestions];
                   next[idx] = e.target.value;
                   setAuditQuestions(next);
                }} 
                className="w-full min-h-[100px] bg-white/5 border border-chef-border focus:border-orange-500 text-chef-text font-black text-lg p-6 bevel-cta placeholder:text-chef-text/5 outline-none transition-all chef-input-high-v resize-none leading-relaxed" 
                placeholder="창작자에게 묻고 싶은 질문을 입력하세요." 
                rows={3}
              />
            </div>
          ))}
          <Button variant="ghost" onClick={() => setAuditQuestions([...auditQuestions, ""])} disabled={auditQuestions.length >= 6} className="w-full h-16 bevel-cta border border-dashed border-chef-border text-chef-text opacity-20 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 font-black uppercase tracking-widest transition-all">
            <FontAwesomeIcon icon={faPlus} className="mr-3" /> 새 질문 추가하기 (최대 6개)
          </Button>
        </div>
      </section>

      <div className="flex justify-between items-center pt-10 border-t border-chef-border">
        <Button variant="ghost" onClick={() => setAuditStep(3)} className="h-14 px-8 font-black text-chef-text opacity-80 hover:opacity-100 uppercase tracking-widest text-xs transition-opacity">이전 단계</Button>
        <Button onClick={() => {
           if (isAdmin) {
             setAuditStep(5);
           } else {
             handleSubmit();
           }
        }} disabled={isSubmitting} className="h-20 px-16 bevel-cta bg-orange-600 hover:bg-orange-700 text-white text-xl font-black flex items-center gap-5 transition-all hover:scale-105 shadow-[0_10px_40px_rgba(234,88,12,0.4)]">
          {isSubmitting ? "의뢰 게시 중..." : (isAdmin ? <><FontAwesomeIcon icon={faPlus} className="w-5 h-5" /> 계속 : 보약 설정</> : <><ChefHat className="w-6 h-6" /> 평가 의뢰 게시하기</>)}
        </Button>
      </div>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12">
      <section className="space-y-10">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4 border-l-4 border-orange-500 pl-4 py-1">
              <h3 className="text-3xl font-black text-chef-text tracking-tighter uppercase italic">4. 보약(보상/약속) 설정</h3>
           </div>
           <div className="px-4 py-1.5 bg-chef-panel border border-chef-border text-[10px] font-black text-orange-500 uppercase tracking-widest rounded-full animate-pulse">
              관리자 전용 베타
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
           <div className="space-y-8">
              <div className="space-y-4">
                 <Label className="text-xs font-black text-chef-text opacity-30 uppercase tracking-[0.2em]">보상 종류 선택</Label>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setRewardType('point')}
                      className={cn(
                        "p-8 bevel-sm border-2 transition-all flex flex-col items-center gap-4",
                        rewardType === 'point' ? "border-orange-500 bg-orange-500/5 text-orange-500" : "border-chef-border bg-chef-card opacity-40 hover:opacity-100"
                      )}
                    >
                       <FontAwesomeIcon icon={faCoins} size="2xl" />
                       <span className="font-black text-xs uppercase tracking-widest">포인트 보상</span>
                    </button>
                    <button 
                      onClick={() => setRewardType('coupon')}
                      className={cn(
                        "p-8 bevel-sm border-2 transition-all flex flex-col items-center gap-4",
                        rewardType === 'coupon' ? "border-orange-500 bg-orange-500/5 text-orange-500" : "border-chef-border bg-chef-card opacity-40 hover:opacity-100"
                      )}
                    >
                       <FontAwesomeIcon icon={faGift} size="2xl" />
                       <span className="font-black text-xs uppercase tracking-widest">기프티콘 샵</span>
                    </button>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-xs font-black text-chef-text opacity-30 uppercase tracking-[0.2em]">인당 보상 금액 (P)</Label>
                    <input type="number" value={rewardAmount} onChange={e => setRewardAmount(Number(e.target.value))} className="w-full h-14 bg-chef-panel border border-chef-border text-chef-text font-black px-6 outline-none focus:border-orange-500 bevel-sm" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-black text-chef-text opacity-30 uppercase tracking-[0.2em]">모집 인원 (명)</Label>
                    <input type="number" value={recipientCount} onChange={e => setRecipientCount(Number(e.target.value))} className="w-full h-14 bg-chef-panel border border-chef-border text-chef-text font-black px-6 outline-none focus:border-orange-500 bevel-sm" />
                 </div>
              </div>
           </div>

           <div className="bg-chef-card border-none bevel-section p-10 space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 -mr-10 -mt-10 group-hover:rotate-12 transition-transform duration-1000">
                 <FontAwesomeIcon icon={faCalculator} size="10x" />
              </div>
              <h4 className="text-xl font-black text-chef-text italic uppercase flex items-center gap-3">
                 <FontAwesomeIcon icon={faCoins} className="text-orange-500" /> 실시간 청구 내역
              </h4>
              <div className="space-y-4 border-y border-chef-border py-6">
                 <div className="flex justify-between text-chef-text font-bold">
                    <span className="opacity-40">보상 원금</span>
                    <span>{(rewardAmount * recipientCount).toLocaleString()} P</span>
                 </div>
                 <div className="flex justify-between text-chef-text font-bold">
                    <span className="opacity-40">플랫폼 수수료 (10%)</span>
                    <span className="text-orange-500">+{(rewardAmount * recipientCount * 0.1).toLocaleString()} P</span>
                 </div>
                 <div className="flex justify-between text-chef-text font-bold">
                    <span className="opacity-40">부가가치세 (10%)</span>
                    <span className="text-orange-500">+{(rewardAmount * recipientCount * 1.1 * 0.1).toLocaleString()} P</span>
                 </div>
              </div>
              <div className="flex justify-between items-end">
                 <span className="text-xs font-black text-chef-text opacity-40 uppercase tracking-widest">최종 합계</span>
                 <span className="text-4xl font-black italic text-chef-text tracking-tighter">{(rewardAmount * recipientCount * 1.21).toLocaleString()} P</span>
              </div>
           </div>
        </div>
      </section>

      <div className="flex justify-between items-center pt-10 border-t border-chef-border">
        <Button variant="ghost" onClick={() => setAuditStep(4)} className="h-14 px-8 font-black text-chef-text opacity-80 hover:opacity-100 uppercase tracking-widest text-xs transition-opacity">이전 단계</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="h-20 px-16 bevel-cta bg-orange-600 hover:bg-orange-700 text-white text-xl font-black flex items-center gap-5 transition-all hover:scale-105 shadow-[0_10px_40px_rgba(234,88,12,0.4)]">
          {isSubmitting ? "의뢰 게시 중..." : <><ChefHat className="w-6 h-6" /> 보약 담아 의뢰 게시하기</>}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen chef-bg-page selection:bg-orange-500/30">
      {authLoading ? (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="flex flex-col items-center gap-6">
               <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(249,115,22,0.3)]" />
               <p className="text-sm font-black text-chef-text opacity-30 uppercase tracking-[0.3em] animate-pulse">Initializing Lab...</p>
            </div>
        </div>
      ) : (
        <>
          {/* Dynamic Stepper Header */}
          <div className="fixed top-16 left-0 right-0 z-40 chef-header-dark border-b border-chef-border">
             <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                   <span className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-[0.4em]">평가 의뢰 연구소</span>
                </div>
                <div className="flex items-center gap-3">
                   {[1, 2, 3, 4, ...(isAdmin ? [5] : [])].map(s => (
                     <div key={s} className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-1 transition-all duration-500 bevel-cta", 
                          auditStep >= s ? "bg-orange-500 shadow-[0_0_10px_#f97316]" : "bg-chef-text opacity-10"
                        )} />
                        {s < (isAdmin ? 5 : 4) && <div className="text-[6px] text-chef-text opacity-5 font-black">/</div>}
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="pt-40 pb-32">
            <main className="max-w-4xl mx-auto px-6">
              <AnimatePresence mode="wait">
                {auditStep === 1 ? renderStep1() : auditStep === 2 ? renderStep2() : auditStep === 3 ? renderStep3() : auditStep === 4 ? renderStep4() : renderStep5()}
              </AnimatePresence>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
