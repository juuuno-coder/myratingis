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
  faStar
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { uploadImage } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat } from "lucide-react";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { supabase } from "@/lib/supabase/client";

import { OnboardingModal } from "@/components/OnboardingModal"; // Import 추가

export default function ProjectUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading: authLoading } = useAuth(); // loading, userProfile 받아오기
  
  const mode = searchParams.get('mode') || 'audit'; 
  
  const [auditStep, setAuditStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false); // 온보딩 상태 추가

  useEffect(() => {
    // 로딩이 끝났고, 유저는 있는데 프로필이 없으면 온보딩 실행
    if (!authLoading && user && !userProfile) {
      setShowOnboarding(true);
    }
  }, [authLoading, user, userProfile]);

  // --- State ---
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [auditDeadline, setAuditDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [auditType, setAuditType] = useState<'link' | 'image' | 'video'>('link');
  const [mediaData, setMediaData] = useState<string | string[]>(auditType === 'image' ? [] : "");
  const [linkPreview, setLinkPreview] = useState<{title?: string, description?: string, image?: string} | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  const [customCategories, setCustomCategories] = useState<any[]>([
    { id: 'm1', label: '기획력', desc: '탄탄한 논리와 명확한 문제 해결 전략' },
    { id: 'm2', label: '독창성', desc: '기존의 틀을 깨는 신선하고 개성 있는 시도' },
    { id: 'm3', label: '심미성', desc: '눈을 사로잡는 세련된 디자인과 레이아웃' },
    { id: 'm4', label: '완성도', desc: '작은 디테일까지 놓치지 않은 집요한 마감' },
    { id: 'm5', label: '상업성', desc: '시장의 니즈를 꿰뚫는 가치와 비즈니스 가능성' }
  ]);

  const STICKER_PRESETS: Record<string, any[]> = {
    professional: [
      { id: 'pr1', label: '당장 계약하시죠!\n탐나는 결과물', desc: '시장에 즉시 내놓아도 손색없을 만큼\n압도적인 퀄리티와 가치를 증명한 프로젝트', image_url: '/review/a1.jpeg' },
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

  const [selectedPreset, setSelectedPreset] = useState<'professional' | 'michelin' | 'mz'>('professional');
  const [pollOptions, setPollOptions] = useState<any[]>(STICKER_PRESETS.professional);
  const [pollDesc, setPollDesc] = useState("[몰입형] 현업 전문가의 리얼한 반응");
  const [auditQuestions, setAuditQuestions] = useState<string[]>(["이 프로젝트의 가장 큰 장점은 무엇인가요?"]);

  // --- Handlers ---
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("로그인이 필요합니다.");
        router.push("/login?returnTo=/project/upload");
        return;
      }

      const projectData = {
        title,
        summary: summary || title,
        content_text: summary || title,
        description: summary || title,
        category_id: 1,
        visibility: 'public',
        audit_deadline: auditDeadline,
        is_growth_requested: true,
        custom_data: {
          is_feedback_requested: true,
          audit_config: {
             type: auditType,
             mediaA: mediaData,
             categories: customCategories,
             poll: { desc: pollDesc, options: pollOptions },
             questions: auditQuestions
          }
        }
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(projectData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "등록 실패");
      
      toast.success("평가 의뢰가 성공적으로 등록되었습니다!");
      router.push(`/project/share/${data.project.project_id}`);
    } catch (error: any) {
      toast.error(error.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Steps ---
  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center gap-4 border-l-4 border-orange-500 pl-4 py-1">
          <h3 className="text-3xl font-black text-chef-text tracking-tighter uppercase italic">? 제 평가는요? 의뢰 정보</h3>
        </div>
        
        <div className="space-y-4">
          <div className="chef-black-panel p-1 rounded-sm border-none shadow-sm">
            <input 
              placeholder="진단받을 제목 (예: 커피 배달 매칭 MVP)" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full h-16 bg-chef-panel border-none text-xl font-black text-chef-text px-8 placeholder:text-chef-text/30 outline-none chef-input-high-v rounded-sm"
            />
          </div>
          <div className="chef-black-panel p-1 rounded-sm border-none shadow-sm">
            <input 
              placeholder="한 줄 설명 (예: 바쁜 직원을 위한 가장 빠른 커피 배달)" 
              value={summary} 
              onChange={e => setSummary(e.target.value)} 
              className="w-full h-12 bg-chef-panel border-none text-sm font-bold text-chef-text opacity-70 px-8 placeholder:text-chef-text/30 outline-none chef-input-high-v rounded-sm"
            />
          </div>
        </div>
      </section>

      <section className="bevel-border bevel-section p-8 md:p-12 space-y-10">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-black text-chef-text flex items-center gap-3 italic">
             <FontAwesomeIcon icon={faCamera} className="text-orange-500" /> 대상 미디어 및 마감 기한
          </h4>
          <div className="relative">
             <Label className="text-[10px] font-black text-chef-text opacity-30 uppercase absolute -top-4 right-0 tracking-widest">진단 마감일</Label>
             <input type="date" value={auditDeadline} onChange={e => setAuditDeadline(e.target.value)} className="bg-white/5 text-chef-text border border-chef-border px-4 py-2 text-xs font-black bevel-cta outline-none focus:border-orange-500 transition-all cursor-pointer chef-input-high-v" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {(['link', 'image', 'video'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => {
                setAuditType(t);
                setMediaData(t === 'image' ? [] : "");
              }} 
              className={cn(
                "h-14 font-black text-xs uppercase tracking-widest transition-all bevel-cta border border-chef-border",
                auditType === t ? "bg-chef-text text-chef-bg" : "bg-chef-bg text-chef-text opacity-40 hover:opacity-100"
              )}
            >
              {t === 'link' ? "웹 링크" : t === 'image' ? "이미지 갤러리" : "유튜브"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {auditType === 'image' ? (
             <div className="flex flex-wrap gap-4 p-6 bg-chef-panel bevel-section border border-chef-border min-h-[160px]">
               {Array.isArray(mediaData) && mediaData.map((img, i) => (
                 <div key={i} className="w-24 h-24 bevel-sm overflow-hidden relative group">
                   <img src={img} className="w-full h-full object-cover" />
                   <button onClick={() => setMediaData((mediaData as string[]).filter((_, j) => j !== i))} className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <FontAwesomeIcon icon={faTrash} />
                   </button>
                 </div>
               ))}
               <label className="w-24 h-24 bevel-sm border-2 border-dashed border-chef-border flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-chef-text opacity-20 hover:opacity-100">
                 <FontAwesomeIcon icon={faPlus} className="mb-2" />
                 <span className="text-[8px] font-black uppercase">Add Photo</span>
                 <input type="file" multiple className="hidden" onChange={async e => {
                   if (e.target.files) {
                     const urls = await Promise.all(Array.from(e.target.files).map(f => uploadImage(f)));
                     setMediaData([...(Array.isArray(mediaData) ? mediaData : []), ...urls]);
                   }
                 }} />
               </label>
             </div>
          ) : (
            <div className="space-y-4">
              <div className="chef-black-panel p-1 rounded-sm border-none shadow-sm">
                <input 
                  value={typeof mediaData === 'string' ? mediaData : ''} 
                  onChange={async e => {
                    const val = e.target.value;
                    setMediaData(val);
                    if (auditType === 'link' && val.includes('.')) {
                      setIsLoadingPreview(true);
                      try {
                        const urlToFetch = val.startsWith('http') ? val : `https://${val}`;
                        const response = await fetch(`/api/og-preview?url=${encodeURIComponent(urlToFetch)}`);
                        if (response.ok) {
                          const data = await response.json();
                          setLinkPreview(data.title || data.image ? data : null);
                        }
                      } catch (e) { console.error(e); } finally { setIsLoadingPreview(false); }
                    } else { setLinkPreview(null); }
                  }} 
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
              <p className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-[0.3em] mt-0.5">EVALUATION METRICS</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-chef-text opacity-20">{customCategories.length}/6</span>
            <Button variant="outline" onClick={() => setCustomCategories([...customCategories, { id: `cat-${Date.now()}`, label: "", desc: "" }])} disabled={customCategories.length >= 6} className="bevel-sm border-chef-border h-10 font-black text-chef-text bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[10px] tracking-widest px-4 uppercase transition-all">
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> 항목 추가
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customCategories.map((cat, idx) => (
            <div key={idx} className="chef-black-panel bevel-section p-8 border border-chef-border relative group hover:border-orange-500/50 transition-all bg-chef-card">
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
        <Button variant="ghost" onClick={() => setAuditStep(1)} className="h-14 px-8 font-black text-chef-text opacity-50 hover:opacity-100 uppercase tracking-widest text-xs transition-opacity">이전 단계</Button>
        <Button onClick={() => setAuditStep(3)} className="h-16 px-16 bg-chef-text text-chef-bg hover:opacity-90 text-lg font-black bevel-cta transition-transform hover:scale-105 shadow-2xl uppercase tracking-widest">NEXT: STICKER POLL <FontAwesomeIcon icon={faPlus} className="ml-3" /></Button>
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
              <p className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-[0.3em] mt-0.5">STICKER POLL OPTIONS</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex bg-chef-panel p-1 bevel-sm gap-1">
              {(['professional', 'michelin', 'mz'] as const).map(p => (
                <button key={p} onClick={() => handlePresetChange(p)} className={cn("px-4 py-2 text-[10px] font-black uppercase transition-all", selectedPreset === p ? "bg-chef-text text-chef-bg shadow-lg" : "text-chef-text opacity-20 hover:opacity-100")}>{p}</button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-chef-text opacity-20">{pollOptions.length}/6</span>
              <Button onClick={() => setPollOptions([...pollOptions, { id: `p-${Date.now()}`, label: "", desc: "", image_url: "" }])} disabled={pollOptions.length >= 6} className="bevel-sm h-10 bg-chef-panel text-chef-text border border-chef-border hover:bg-black/5 dark:hover:bg-white/5 font-black text-[10px] uppercase tracking-widest transition-all"><FontAwesomeIcon icon={faPlus} className="mr-2" /> 항목 추가</Button>
            </div>
          </div>
        </div>

        <div className="chef-frame-container">
          <div className="chef-frame-header">STICKER MENU</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="chef-menu-card group">
                {/* 상단 이미지 영역 */}
                <label className="w-full aspect-[4/3] bg-chef-panel border-b border-chef-border flex items-center justify-center cursor-pointer overflow-hidden relative group/img">
                  {opt.image_url ? (
                    <img src={opt.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                  ) : (
                    <FontAwesomeIcon icon={faCamera} className="text-chef-text opacity-10 text-3xl" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                    <span className="text-[10px] text-white font-black uppercase tracking-widest border border-white/20 px-4 py-2">Select Image</span>
                  </div>
                  <input type="file" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImage(file);
                      const next = [...pollOptions];
                      next[idx].image_url = url;
                      setPollOptions(next);
                    }
                  }} />
                </label>

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
        <Button onClick={() => setAuditStep(4)} className="h-16 px-16 bg-chef-text text-chef-bg hover:opacity-90 text-lg font-black bevel-cta transition-transform hover:scale-105 shadow-2xl uppercase tracking-widest">NEXT: QUESTIONNAIRE <FontAwesomeIcon icon={faPlus} className="ml-3" /></Button>
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
            <div key={idx} className="flex gap-4 group items-center">
              <div className="shrink-0 w-16 h-16 bg-chef-text text-chef-bg font-black text-xl flex items-center justify-center bevel-cta">Q{idx+1}</div>
              <div className="flex-1 relative">
                <input value={q} onChange={e => {
                   const next = [...auditQuestions];
                   next[idx] = e.target.value;
                   setAuditQuestions(next);
                }} className="w-full h-16 bg-white/5 border border-chef-border focus:border-orange-500 text-chef-text font-black text-lg px-8 bevel-cta placeholder:text-chef-text/10 outline-none transition-all chef-input-high-v" placeholder="창작자에게 묻고 싶은 질문을 입력하세요." />
                {auditQuestions.length > 1 && (
                  <button onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))} className="absolute right-6 top-1/2 -translate-y-1/2 text-chef-text opacity-20 hover:text-red-400 hover:opacity-100 transition-all">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={() => setAuditQuestions([...auditQuestions, ""])} disabled={auditQuestions.length >= 3} className="w-full h-16 bevel-cta border border-dashed border-chef-border text-chef-text opacity-20 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 font-black uppercase tracking-widest transition-all">
            <FontAwesomeIcon icon={faPlus} className="mr-3" /> 새 질문 추가하기 (최대 3개)
          </Button>
        </div>
      </section>

      <div className="flex justify-between items-center pt-10 border-t border-chef-border">
        <Button variant="ghost" onClick={() => setAuditStep(auditStep - 1)} className="h-14 px-8 font-black text-chef-text opacity-80 hover:opacity-100 uppercase tracking-widest text-xs transition-opacity">이전 단계</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="h-20 px-16 bevel-cta bg-orange-600 hover:bg-orange-700 text-white text-xl font-black flex items-center gap-5 transition-all hover:scale-105 shadow-[0_10px_40px_rgba(234,88,12,0.4)]">
          {isSubmitting ? "의뢰 게시 중..." : <><ChefHat className="w-6 h-6" /> 진단 의뢰 게시하기</>}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen chef-bg-page selection:bg-orange-500/30">
      <MyRatingIsHeader />
      
      {/* Dynamic Stepper Header */}
      <div className="fixed top-16 left-0 right-0 z-40 chef-header-dark border-b border-chef-border">
         <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
               <span className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-[0.4em]">Audit Request Lab</span>
            </div>
            <div className="flex items-center gap-3">
               {[1, 2, 3, 4].map(s => (
                 <div key={s} className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-1 transition-all duration-500 bevel-cta", 
                      auditStep >= s ? "bg-orange-500 shadow-[0_0_10px_#f97316]" : "bg-chef-text opacity-10"
                    )} />
                    {s < 4 && <div className="text-[6px] text-chef-text opacity-5 font-black">/</div>}
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="pt-40 pb-32">
        <main className="max-w-4xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {auditStep === 1 ? renderStep1() : auditStep === 2 ? renderStep2() : auditStep === 3 ? renderStep3() : renderStep4()}
          </AnimatePresence>
        </main>
      </div>

      {user && (
        <OnboardingModal 
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
          userId={user.id}
          userEmail={user.email || ""}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
