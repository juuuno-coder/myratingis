"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Star, Info, Target, Zap, Lightbulb, TrendingUp, Sparkles, MessageSquareQuote } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Text
} from 'recharts';

export interface MichelinRatingRef {
  submit: () => Promise<boolean>;
  isValid: () => boolean;
}

interface MichelinRatingProps {
  projectId: string;
  ratingId?: string; 
  isDemo?: boolean; 
  activeCategoryIndex?: number; // [New] 단계별 노출을 위한 인덱스
  guestId?: string; // [New] 게스트 식별자
  onChange?: (scores: Record<string, number>) => void; // [New] 부모에게 점수 전달
}

const DEFAULT_CATEGORIES = [
  { id: 'score_1', label: '기획력', icon: Lightbulb, color: '#f59e0b', desc: '논리적 구조와 의도', sticker: '/review/s1.png' },
  { id: 'score_2', label: '완성도', icon: Zap, color: '#3b82f6', desc: '디테일과 마감 수준', sticker: '/review/s2.png' },
  { id: 'score_3', label: '독창성', icon: Target, color: '#10b981', desc: '작가 고유의 스타일', sticker: '/review/s3.png' },
  { id: 'score_4', label: '상업성', icon: TrendingUp, color: '#ef4444', desc: '시장 가치와 잠재력', sticker: '/review/s4.png' },
];

const ICON_MAP: Record<string, any> = {
  Lightbulb, Zap, Target, TrendingUp, Star, Info, Sparkles, MessageSquareQuote
};

export const MichelinRating = React.forwardRef<MichelinRatingRef, MichelinRatingProps>(
  ({ projectId, ratingId, isDemo = false, activeCategoryIndex, guestId, onChange }, ref) => {
  const [projectData, setProjectData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [averages, setAverages] = useState<Record<string, number>>({});
  const [totalAvg, setTotalAvg] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Give time for layout/animations to settle before rendering Recharts
    const timer = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // 현재 내 점수들의 평균 계산 (실시간)
  const currentTotalAvg = useMemo(() => {
    const activeScores = Object.values(scores);
    if (activeScores.length === 0) return 0;
    const sum = activeScores.reduce((a, b) => a + b, 0);
    return Number((sum / activeScores.length).toFixed(1));
  }, [scores]);

  // 부모에게 점수 변경 알림
  useEffect(() => {
    if (onChange) onChange(scores);
  }, [scores, onChange]);

  const fetchAIAnalysis = async (scoresToAnalyze: any) => {
    if (isDemo) {
        setAnalysis("이것은 데모 분석 결과입니다. 작가의 의도가 명확하며, 특히 독창성 부분에서 높은 점수를 기록했습니다. 상업적 가능성 또한 충분하여 발전 가능성이 기대되는 작품입니다.");
        return;
    }
    setIsAnalyzing(true);
    try {
      // AI 분석 서비스 일시 중단
      setAnalysis("현재 서비스 안정화를 위해 AI 정밀 분석 기능이 잠시 중단되었습니다. 곧 더 나은 서비스로 찾아뵙겠습니다.");
    } catch (e) {
      console.error("AI Analysis error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchRatingData = async () => {
    if (isDemo) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      
      // Guest ID 쿼리 파라미터 추가
      let url = `/api/projects/${projectId}/rating`;
      if (guestId) url += `?guest_id=${guestId}`;

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (data.success) {
        setProjectData(data.project);
        
        // 커스텀 카테고리 설정 확인 (audit_config.categories 또는 legacy custom_categories)
        const customCategories = data.project?.custom_data?.audit_config?.categories || data.project?.custom_data?.custom_categories;
        
        if (customCategories) {
          const custom = customCategories.map((c: any) => ({
            ...c,
            icon: ICON_MAP[c.icon] || Target
          }));
          setCategories(custom);
          
          // 초기 점수 셋팅
          const initialScores: Record<string, number> = {};
          custom.forEach((c: any) => initialScores[c.id] = 0);
          
          if (data.myRating) {
            custom.forEach((c: any) => {
              initialScores[c.id] = Number(data.myRating[c.id] || 0);
            });
          }
          setScores(initialScores);
          setAverages(data.averages || {});
        } else {
          // 기본 카테고리 사용 시
          const initial: Record<string, number> = {};
          DEFAULT_CATEGORIES.forEach(c => initial[c.id] = 0);
          
          if (data.myRating) {
            DEFAULT_CATEGORIES.forEach(c => {
               initial[c.id] = Number(data.myRating[c.id] || 0);
            });
          }
          setScores(initial);
          setAverages(data.averages || {});
        }
        
        setTotalAvg(data.totalAvg);
        setTotalCount(data.totalCount);

        // ratingId가 전달된 경우 해당 특정 평가 데이터를 강제로 덮어씀
        if (ratingId) {
          const { data: specificRating, error: sError } = await (supabase as any)
            .from('ProjectRating')
            .select('*')
            .eq('id', Number(ratingId))
            .single();
          
          if (!sError && specificRating) {
            const updatedScores: Record<string, number> = { ...scores };
            categories.forEach((c: any) => {
              updatedScores[c.id] = Number(specificRating[c.id] || 0);
            });
            setScores(updatedScores);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load ratings", e);
    }
  };

  useEffect(() => {
    if (projectId) fetchRatingData();
    else if (isDemo) {
        // 데모 모드 초기화
        const initial: Record<string, number> = {};
        DEFAULT_CATEGORIES.forEach(c => initial[c.id] = 0);
        setScores(initial);
    }
  }, [projectId, guestId]); // guestId 변경 시에도 다시 로드

  const isAllRated = () => {
    return categories.every(cat => (scores[cat.id] || 0) > 0);
  };

  // [Modified] API Submit Logic Removed. Now only performs validation.
  const handleRatingSubmit = async (): Promise<boolean> => {
    if (!isAllRated()) {
        toast.error("아직 평가하지 않은 항목이 있습니다.", {
            description: "모든 항목의 슬라이더를 조절하여 점수를 매겨주세요!"
        });
        return false;
    }
    
    // Parents will handle actual submission
    return true;
  };

  React.useImperativeHandle(ref, () => ({
    submit: handleRatingSubmit,
    isValid: isAllRated
  }));

  // Recharts Data Transformation
  const chartData = useMemo(() => {
    return categories.map(cat => ({
      subject: cat.label,
      A: scores[cat.id] || 0,
      B: averages[cat.id] || 0,
      fullMark: 5,
    }));
  }, [categories, scores, averages]);

  // 커스텀 라벨 렌더러
  const renderCustomPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
    return (
      <Text
        {...rest}
        verticalAnchor="middle"
        y={y + (y > cy ? 10 : -10)}
        x={x + (x > cx ? 10 : -10)}
        className="text-[10px] sm:text-[12px] font-black fill-chef-text uppercase tracking-tighter opacity-70"
      >
        {payload.value}
      </Text>
    );
  };

  // 단계별 모드일 때 렌더링할 특정 카테고리
  const activeCategory = typeof activeCategoryIndex === 'number' ? categories[activeCategoryIndex] : null;

  if (activeCategory) {
    return (
      <div className="w-full space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex flex-col items-center gap-6">
           <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-chef-text text-chef-bg flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-500">
                 {activeCategory.sticker ? (
                   <Image src={activeCategory.sticker} alt={activeCategory.label} width={80} height={80} className="object-contain" />
                 ) : (
                   React.createElement(activeCategory.icon || Target, { className: "w-12 h-12" })
                 )}
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-chef-card rounded-full shadow-lg border border-chef-border flex items-center justify-center font-black text-chef-text">
                {activeCategoryIndex! + 1}
              </div>
           </div>
           <div className="text-center">
              <h4 className="text-3xl font-black text-chef-text uppercase tracking-tighter mb-2">{activeCategory.label}</h4>
              <p className="text-chef-text opacity-40 font-bold uppercase tracking-widest text-xs">{activeCategory.desc}</p>
           </div>
        </div>

        <div className="bg-chef-card rounded-[3rem] p-10 border border-chef-border shadow-xl space-y-8">
            <div className="flex justify-between items-end relative">
               <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                     <Star key={i} className={cn("w-6 h-6 transition-all duration-300", (scores[activeCategory.id] || 0) >= i ? "text-amber-400 fill-current scale-110" : "text-chef-text opacity-5")} />
                  ))}
               </div>
               <div className="text-right">
                  <span className={cn("text-7xl font-black tabular-nums tracking-tighter transition-all", (scores[activeCategory.id] || 0) > 0 ? "opacity-100 scale-105" : "opacity-20")} style={{ color: activeCategory.color || '#f59e0b' }}>
                     {(scores[activeCategory.id] || 0).toFixed(1)}
                  </span>
                  <p className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-widest">Score / 5.0</p>
               </div>
            </div>

            <div className="relative h-12 flex items-center group/slider">
               {/* Background Track */}
                <div className="absolute inset-x-0 h-4 bg-chef-panel border border-chef-border/50 rounded-full overflow-hidden shadow-inner">
                   {/* Active Filled Track */}
                   <div 
                     className="h-full transition-all duration-100 ease-out shadow-[0_0_15px_rgba(0,0,0,0.1)]" 
                     style={{ 
                       width: `${((scores[activeCategory.id] || 0) / 5) * 100}%`,
                       backgroundColor: activeCategory.color || '#f59e0b'
                     }} 
                   />
                </div>
               
               <input 
                  type="range" 
                  min="0" 
                  max="5" 
                  step="0.1" 
                  value={scores[activeCategory.id] || 0} 
                  onChange={(e) => { 
                    setScores(prev => ({ ...prev, [activeCategory.id]: parseFloat(e.target.value) })); 
                    setIsEditing(true); 
                  }} 
                  className="absolute inset-x-0 w-full h-12 appearance-none bg-transparent cursor-pointer z-20 michelin-slider" 
               />
               
               {/* Markers */}
               <div className="absolute inset-0 flex justify-between px-1 pointer-events-none items-center z-10">
                  {[0, 1, 2, 3, 4, 5].map(v => (
                    <div key={v} className="flex flex-col items-center gap-2">
                       <div className={cn("w-[2px] h-3 transition-colors", (scores[activeCategory.id] || 0) >= v ? "bg-white" : "bg-chef-text opacity-10")} />
                    </div>
                  ))}
               </div>
            </div>
        </div>

        <div className="p-6 bg-chef-panel rounded-2xl border border-chef-border italic text-chef-text opacity-40 text-sm text-center font-medium">
           "이 항목은 프로젝트의 {activeCategory.label}을(를) 중점적으로 평가합니다."
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden group">
      <div className="flex flex-col gap-12 items-center w-full min-h-[460px]">
        {/* Radar Chart Visual with Recharts - Fixed size to avoid Responsive JS errors */}
        <div className="relative w-full max-w-[420px] min-w-[320px] h-[400px] flex justify-center items-center py-4">
            {mounted ? (
                <RadarChart width={400} height={380} cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={renderCustomPolarAngleAxis}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 5]} 
                      tick={false} 
                      axisLine={false} 
                    />
                    
                    {/* Community Average */}
                    {totalAvg > 0 && (
                      <Radar
                        name="Community"
                        dataKey="B"
                        stroke="currentColor"
                        className="text-chef-text opacity-10"
                        strokeWidth={1}
                        fill="currentColor"
                        fillOpacity={0.1}
                      />
                    )}
                    
                    {/* My Score */}
                    <Radar
                      name="My Score"
                      dataKey="A"
                      stroke={activeCategoryIndex !== undefined ? categories[activeCategoryIndex]?.color || "#f59e0b" : "#f59e0b"}
                      strokeWidth={4}
                      fill={activeCategoryIndex !== undefined ? categories[activeCategoryIndex]?.color || "#f59e0b" : "#f59e0b"}
                      fillOpacity={0.15}
                      animationBegin={0}
                      animationDuration={500}
                    />
                </RadarChart>
            ) : (
                <div className="w-full h-full bg-chef-panel/20 animate-pulse rounded-full" />
            )}
           
           {/* Center Score Badge */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none scale-110">
              <div className="bg-chef-card/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-chef-border flex flex-col items-center">
                <span className="text-4xl font-black text-chef-text tabular-nums leading-none mb-1">{currentTotalAvg.toFixed(1)}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-3 h-3 ${currentTotalAvg >= i ? 'text-amber-400 fill-current' : 'text-chef-text opacity-10'}`} />
                  ))}
                </div>
              </div>
           </div>
        </div>

        <div className="w-full space-y-8 max-w-lg">
          <div className="grid grid-cols-1 gap-8">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-3 group/item">
                <div className="flex justify-between items-end px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-chef-text text-chef-bg flex items-center justify-center shadow-lg transition-transform group-hover/item:scale-110">
                      {React.createElement(cat.icon || Target, { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <p className="text-sm font-black text-chef-text uppercase tracking-tight">{cat.label}</p>
                      <p className="text-[10px] text-chef-text opacity-40 font-bold uppercase">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: cat.color || '#f59e0b' }}>
                      {(scores[cat.id] || 0) > 0 ? (scores[cat.id] || 0).toFixed(1) : "0.0"}
                    </span>
                    <p className="text-[8px] font-black text-chef-text opacity-20 uppercase tracking-widest">Score</p>
                  </div>
                </div>
                
                 <div className="relative h-6 flex items-center group/slider-box">
                    {/* Visual Track */}
                    <div className="absolute inset-x-0 h-2 bg-chef-panel border border-chef-border/50 rounded-full shadow-inner overflow-hidden">
                      <div 
                        className="h-full transition-all duration-100 ease-out opacity-40" 
                        style={{ 
                          width: `${((scores[cat.id] || 0) / 5) * 100}%`,
                          backgroundColor: cat.color || '#f59e0b'
                        }} 
                      />
                    </div>

                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none items-center">
                      {[0, 1, 2, 3, 4, 5].map(v => (
                        <div key={v} className={cn("w-[1.5px] h-2 transition-colors", (scores[cat.id] || 0) >= v ? "bg-white/40" : "bg-chef-text/10")} />
                      ))}
                    </div>

                    <input 
                      type="range" 
                      min="0" 
                      max="5" 
                      step="0.1" 
                      value={scores[cat.id] || 0} 
                      onChange={(e) => { 
                        setScores(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) })); 
                        setIsEditing(true); 
                      }} 
                      className="w-full h-4 appearance-none bg-transparent cursor-pointer z-10 michelin-slider-small" 
                    />
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium italic">
         <Info className="w-4 h-4 flex-shrink-0" />
         <p>평가 완료 시 작가에게 분석 레포트 데이터가 전달됩니다. 각 항목을 신중히 조절하여 작품의 다면적인 가치를 기록해 주세요.</p>
      </div>
    </div>
  );
});

MichelinRating.displayName = 'MichelinRating';
