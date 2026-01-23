"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faCamera, 
  faCheck, 
  faRocket, 
  faStar, 
  faImage, 
  faPlus,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { uploadImage } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Sparkles, Rocket as RocketIcon, Clock } from "lucide-react";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";

export default function ProjectUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const mode = searchParams.get('mode') || 'audit'; // Default to audit for MyRatingIs
  const isAuditMode = mode === 'audit';
  
  const [auditStep, setAuditStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  // 미슐랭 평가 항목 (최초 5개, 최소 3개, 최대 6개)
  const [customCategories, setCustomCategories] = useState<any[]>([
    { id: 'm1', label: '기획력', desc: '탄탄한 논리와 명확한 문제 해결 전략' },
    { id: 'm2', label: '독창성', desc: '기존의 틀을 깨는 신선하고 개성 있는 시도' },
    { id: 'm3', label: '심미성', desc: '눈을 사로잡는 세련된 디자인과 레이아웃' },
    { id: 'm4', label: '완성도', desc: '작은 디테일까지 놓치지 않은 집요한 마감' },
    { id: 'm5', label: '상업성', desc: '시장의 니즈를 꿰뚫는 가치와 비즈니스 가능성' }
  ]);

  // 스티커 프리셋
  const STICKER_PRESETS: Record<string, any[]> = {
    professional: [
      { id: 'pr1', label: '당장 계약하시죠! 탐나는 결과물', desc: '시장에 즉시 내놓아도 손색없을 만큼 압도적인 퀄리티와 가치를 증명한 프로젝트', image_url: '/review/a1.jpeg' },
      { id: 'pr2', label: '좋긴 한데... 한 끗이 아쉽네요', desc: '기획의 방향은 훌륭하나, 사용자 경험(UX)이나 디테일한 마감에서 보완이 필요한 상태', image_url: '/review/a2.jpeg' },
      { id: 'pr3', label: '기획부터 다시! 싹 갈아엎읍시다', desc: '컨셉의 정체성이 모호하거나 핵심 기능에 대한 전면적인 재검토가 필요한 프로젝트', image_url: '/review/a3.jpeg' }
    ],
    michelin: [
      { id: 'mi1', label: '3스타급 완성도! 완벽한 미식 경험', desc: '예술성과 상업성을 모두 잡은, 누구나 소유하고 싶어 할 만큼 가치가 뛰어난 프로젝트', image_url: '/review/a1.jpeg' },
      { id: 'mi2', label: '훌륭한 요리, 하지만 향신료가 부족함', desc: '기본기는 탄탄하지만 이 프로젝트만의 확실한 개성(Kick)을 더 보여줄 필요가 있는 상태', image_url: '/review/a2.jpeg' },
      { id: 'mi3', label: '재료 선택부터 다시 고민해야 할 맛', desc: '타겟과 목적이 불분명하여 근본적인 기획 의도부터 다시 정립해야 하는 프로젝트', image_url: '/review/a3.jpeg' }
    ],
    mz: [
      { id: 'mz1', label: '폼 미쳤다! 그대로 입사하세요', desc: '더 이상 설명이 필요 없는 압승! 즉각적인 실행이 가능한 수준의 고퀄리티', image_url: '/review/a1.jpeg' },
      { id: 'mz2', label: '예쁜데 뭔가... 묘하게 2% 부족함', desc: '비주얼은 좋으나 사용성이나 실용성 측면에서 한 단계 업그레이드가 필요한 단계', image_url: '/review/a2.jpeg' },
      { id: 'mz3', label: '길을 잃었습니다... GPS 재탐색 필요', desc: '무엇을 말하려는지 잘 모르겠어요. 핵심 기능과 타겟을 다시 정의해 보세요.', image_url: '/review/a3.jpeg' }
    ]
  };

  const [selectedPreset, setSelectedPreset] = useState<'professional' | 'michelin' | 'mz'>('professional');
  const [pollOptions, setPollOptions] = useState<any[]>(STICKER_PRESETS.professional);
  const [pollDesc, setPollDesc] = useState("[몰입형] 현업 전문가의 리얼한 반응");

  // 종합 의견 (최소 1개, 기본 1개, 최대 3개)
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
      const projectData = {
        title,
        summary,
        visibility: 'unlisted',
        audit_deadline: auditDeadline,
        custom_data: {
          audit_config: {
            type: auditType,
            mediaA: mediaData,
            categories: customCategories,
            poll: { desc: pollDesc, options: pollOptions },
            questions: auditQuestions
          }
        },
        is_feedback_requested: true,
        user_id: user?.id
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!res.ok) throw new Error("등록 실패");
      
      const data = await res.json();
      toast.success("평가 의뢰가 성공적으로 등록되었습니다!");
      router.push(`/project/share/${data.project.project_id}`);
    } catch (error) {
      console.error(error);
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Steps ---
  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-xl shadow-lg ring-4 ring-orange-100 italic font-black">?</div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">제 평가는요? 의뢰 정보</h2>
        </div>
        <div className="space-y-4">
          <Input placeholder="진단받을 제목 (예: 커피 배달 매칭 MVP)" value={title} onChange={e => setTitle(e.target.value)} className="h-16 text-2xl font-bold border-2 border-gray-100 focus:border-orange-500 rounded-2xl px-6" />
          <Input placeholder="한 줄 설명 (예: 바쁜 직원을 위한 가장 빠른 커피 배달)" value={summary} onChange={e => setSummary(e.target.value)} className="h-14 text-lg border-2 border-gray-100 focus:border-orange-500 rounded-xl px-6" />
        </div>
      </section>

      <section className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black flex items-center gap-2">
            <FontAwesomeIcon icon={faCamera} className="text-orange-500" /> 대상 미디어 및 마감 기한
          </h3>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-white/40 uppercase mb-1">진단 마감일</span>
            <input type="date" value={auditDeadline} onChange={e => setAuditDeadline(e.target.value)} className="bg-white/10 border-none rounded-lg px-3 py-1 text-xs font-bold text-orange-400 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['link', 'image', 'video'].map((t) => (
            <button key={t} onClick={() => setAuditType(t as any)} className={cn("py-4 rounded-2xl border-2 transition-all font-bold text-sm", auditType === t ? "bg-white text-black border-orange-500 shadow-xl" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10")}>
              {t === 'link' ? "웹 링크" : t === 'image' ? "이미지 갤러리" : "유튜브"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {auditType === 'image' ? (
            <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
              {Array.isArray(mediaData) && (mediaData as string[]).map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative group">
                  <img src={img} className="w-full h-full object-cover" />
                  <button onClick={() => setMediaData((mediaData as string[]).filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FontAwesomeIcon icon={faTrash} size="xs" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                <FontAwesomeIcon icon={faPlus} className="text-gray-500 mb-1" />
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
              <Input 
                className="bg-white border-gray-300 h-14 text-black placeholder:text-gray-500 rounded-xl focus:border-orange-500 px-5" 
                placeholder={auditType === 'link' ? "웹사이트 URL (예: https://example.com)" : "유튜브 URL (예: https://youtube.com/watch?v=...)"}
                value={typeof mediaData === 'string' ? mediaData : ''} 
                onChange={async (e) => {
                  const url = e.target.value;
                  setMediaData(url);
                  
                  // Open Graph 미리보기 가져오기 (링크 타입일 때만)
                  if (auditType === 'link' && url && url.startsWith('http')) {
                    setIsLoadingPreview(true);
                    try {
                      const response = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
                      if (response.ok) {
                        const data = await response.json();
                        setLinkPreview(data);
                      }
                    } catch (error) {
                      console.error('Failed to fetch preview:', error);
                    } finally {
                      setIsLoadingPreview(false);
                    }
                  } else {
                    setLinkPreview(null);
                  }
                }}
              />
              {typeof mediaData === 'string' && mediaData && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">미리보기</p>
                  {auditType === 'video' && (mediaData.includes('youtube.com') || mediaData.includes('youtu.be')) ? (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe 
                        src={`https://www.youtube.com/embed/${mediaData.includes('youtu.be') ? mediaData.split('youtu.be/')[1] : new URLSearchParams(new URL(mediaData).search).get('v')}`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  ) : auditType === 'link' && linkPreview ? (
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      {linkPreview.image && (
                        <img src={linkPreview.image} alt="Preview" className="w-full h-48 object-cover" />
                      )}
                      <div className="p-4">
                        {linkPreview.title && (
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{linkPreview.title}</h3>
                        )}
                        {linkPreview.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{linkPreview.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2 truncate">{mediaData}</p>
                      </div>
                    </div>
                  ) : isLoadingPreview ? (
                    <div className="p-3 bg-white/5 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-sm text-white/80 truncate">{mediaData}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={() => setAuditStep(2)} className="h-14 px-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg">
          다음 단계로 <FontAwesomeIcon icon={faCheck} className="ml-3" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.2rem] bg-orange-500 text-white flex items-center justify-center text-2xl shadow-lg ring-4 ring-orange-100">🎯</div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">1. 미슐랭 평가 (항목당 5.0 만점)</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">EVALUATION METRICS (RADAR CHART)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-gray-300">{customCategories.length}/6</span>
            <Button variant="outline" onClick={() => setCustomCategories([...customCategories, { id: `cat-${Date.now()}`, label: "", desc: "" }])} disabled={customCategories.length >= 6} className="rounded-xl border-gray-100 h-10 font-bold hover:bg-gray-50 flex items-center gap-2 px-4 text-xs">
              <FontAwesomeIcon icon={faPlus} /> 항목 추가
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customCategories.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-5 p-6 rounded-[2rem] border border-gray-50 bg-white relative group shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                <FontAwesomeIcon icon={faStar} className="text-sm" />
              </div>
              <div className="flex-1 space-y-1">
                <input value={cat.label} onChange={e => {
                  const next = [...customCategories];
                  next[idx].label = e.target.value;
                  setCustomCategories(next);
                }} className="font-black text-gray-900 outline-none w-full bg-transparent text-lg placeholder:text-gray-200" placeholder="항목 이름" />
                <input value={cat.desc} onChange={e => {
                  const next = [...customCategories];
                  next[idx].desc = e.target.value;
                  setCustomCategories(next);
                }} className="text-xs text-gray-400 outline-none w-full bg-transparent font-bold" placeholder="항목에 대한 간단한 가이드" />
              </div>
              {customCategories.length > 3 && (
                <button onClick={() => setCustomCategories(customCategories.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-gray-200 hover:text-red-500 transition-all">
                  <FontAwesomeIcon icon={faTrash} size="xs" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setAuditStep(1)} className="h-14 px-8 rounded-2xl font-bold text-gray-400">이전으로</Button>
        <Button onClick={() => setAuditStep(3)} className="h-14 px-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg">다음 단계로</Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.2rem] bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg ring-4 ring-indigo-100">📊</div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">2. 스티커 투표 설정</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">STICKER POLL (2-6 OPTIONS)</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
              {(['professional', 'michelin', 'mz'] as const).map(p => (
                <button key={p} onClick={() => handlePresetChange(p)} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase", selectedPreset === p ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400")}>{p}</button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-gray-300">{pollOptions.length}/6</span>
              <Button variant="outline" onClick={() => setPollOptions([...pollOptions, { id: `p-${Date.now()}`, label: "", desc: "", image_url: "" }])} disabled={pollOptions.length >= 6} className="rounded-xl border-gray-100 h-10 font-bold text-xs"><FontAwesomeIcon icon={faPlus} /> 추가</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pollOptions.map((opt, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 relative group pt-12">
              <div className="absolute top-4 left-4 bg-slate-900 text-white px-3 py-1 rounded-full text-[8px] font-black tracking-tighter uppercase z-20">STICKER {idx + 1}</div>
              <label className="w-full aspect-square bg-gray-50 rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-100 mb-8 relative">
                {opt.image_url ? <img src={opt.image_url} className="w-full h-full object-cover" /> : <FontAwesomeIcon icon={faCamera} className="text-gray-200 text-2xl" />}
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
              <div className="space-y-4">
                <input value={opt.label} onChange={e => {
                  const next = [...pollOptions];
                  next[idx].label = e.target.value;
                  setPollOptions(next);
                }} className="w-full font-black text-gray-900 outline-none text-lg border-b border-gray-50 pb-2" placeholder="항목 명칭" />
                <textarea value={opt.desc} onChange={e => {
                  const next = [...pollOptions];
                  next[idx].desc = e.target.value;
                  setPollOptions(next);
                }} className="w-full text-xs text-gray-500 bg-transparent resize-none outline-none font-bold" placeholder="투표 가이드라인" rows={3} />
              </div>
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-gray-200 hover:text-red-500 transition-all">
                  <FontAwesomeIcon icon={faTrash} size="xs" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-xl italic font-black">?</div> 3. 종합 의견 (심층 질문)
        </h3>
        <div className="space-y-4">
          {auditQuestions.map((q, idx) => (
            <div key={idx} className="flex gap-4 group">
              <div className="shrink-0 w-14 h-14 bg-slate-950 text-white rounded-[1.2rem] flex items-center justify-center font-black text-lg">Q{idx+1}</div>
              <div className="flex-1 relative">
                <Input value={q} onChange={e => {
                   const next = [...auditQuestions];
                   next[idx] = e.target.value;
                   setAuditQuestions(next);
                }} className="h-14 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 text-lg font-bold px-6 shadow-sm" />
                {auditQuestions.length > 1 && (
                  <button onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={() => setAuditQuestions([...auditQuestions, ""])} disabled={auditQuestions.length >= 3} className="w-full h-14 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 font-bold">
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> 새 질문 추가하기 (최대 3개)
          </Button>
        </div>
      </section>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setAuditStep(2)} className="h-14 px-8 rounded-2xl font-bold text-gray-400">이전 단계</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="h-16 px-16 rounded-[2rem] bg-slate-950 hover:bg-black text-white text-xl font-black flex items-center gap-4 transition-all hover:scale-105 shadow-xl">
          {isSubmitting ? "게시 중..." : <><ChefHat /> 진단 의뢰 게시하기</>}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <>
      <MyRatingIsHeader />
      <div className="min-h-screen bg-[#fafafa] pt-16">
        <main className="max-w-4xl mx-auto py-12 px-6">
          <AnimatePresence mode="wait">
            {auditStep === 1 ? renderStep1() : auditStep === 2 ? renderStep2() : renderStep3()}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
