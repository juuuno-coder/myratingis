"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { Label } from "@/components/ui/label";
import { GENRE_CATEGORIES_WITH_ICONS, FIELD_CATEGORIES_WITH_ICONS } from "@/lib/ui-constants";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, Star, User, Briefcase, Award } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Welcome, 1: Basic, 2: Occupation, 3: Expertise
  const [userNickname, setUserNickname] = useState("");
  
  const [formData, setFormData] = useState({
    gender: "",
    age_group: "",
    occupation: "",
    expertise: [] as string[]
  });

  // Get user info for greeting
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name || user?.user_metadata?.name) {
        setUserNickname(user.user_metadata.full_name || user.user_metadata.name);
      }
    };
    getUser();
  }, []);

  const handleNext = () => {
    if (step === 1) {
        if (!formData.gender || !formData.age_group) return toast.error("성별과 연령대를 선택해주세요.");
    }
    if (step === 2) {
        if (!formData.occupation) return toast.error("직업을 선택해주세요.");
    }
    setStep(prev => prev + 1);
  };

  const toggleExpertise = (id: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(id) 
        ? prev.expertise.filter(item => item !== id)
        : [...prev.expertise, id]
    }));
  };

  const handleSubmit = async () => {
    // Expertise is optional? Let's assume at least one is good but not strictly required. 
    // If required: if (formData.expertise.length === 0) return toast.error("최소 하나의 전문 분야를 선택해주세요.");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const updatePayload: any = {
        gender: formData.gender,
        age_group: formData.age_group,
        occupation: formData.occupation,
        expertise: { fields: formData.expertise } // Saving as JSONB structure consistent with ProfileManager
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (error) throw error;

      toast.success("프로필 설정이 완료되었습니다!");
      router.push("/");
    } catch (error: any) {
      toast.error("저장 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Combined categories for expertise selection
  const ALL_CATEGORIES = [...GENRE_CATEGORIES_WITH_ICONS, ...FIELD_CATEGORIES_WITH_ICONS];

  const steps = [
    { title: "환영합니다", icon: Star },
    { title: "기본 정보", icon: User },
    { title: "직업/소속", icon: Briefcase },
    { title: "전문 분야", icon: Award },
  ];

  return (
    <div className="min-h-screen chef-bg-dark selection:bg-orange-500/30 font-sans">
      <MyRatingIsHeader />
      
      <div className="flex min-h-screen flex-col items-center justify-center py-24 px-4 w-full">
        
        {/* Progress Display */}
        <div className="w-full max-w-xl mb-8 flex justify-between items-center px-4">
             {steps.map((s, idx) => (
                 <div key={idx} className={`flex flex-col items-center gap-2 transition-all ${idx <= step ? 'text-orange-500' : 'text-gray-700'}`}>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all
                         ${idx < step ? 'bg-orange-500 border-orange-500 text-white' : 
                           idx === step ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 
                           'bg-transparent border-gray-700 text-gray-700'}
                     `}>
                         {idx < step ? <Check className="w-4 h-4" /> : idx + 1}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-wider hidden md:block">{s.title}</span>
                 </div>
             ))}
        </div>

        <div className="w-full max-w-xl relative">
          <div className="rounded-none border-2 border-chef-border p-8 md:p-12 chef-black-panel shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden min-h-[500px] flex flex-col">
            
            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div 
                        key="step0"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col items-center justify-center flex-1 text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">👋</span>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-chef-text uppercase italic">
                                환영합니다!
                            </h2>
                            {userNickname && <p className="text-xl text-orange-400 font-bold">{userNickname}님</p>}
                            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
                                공정한 평가와 성장을 위한 플랫폼,<br/>
                                <strong>MyRatingIs</strong>에 오신 것을 환영합니다.
                            </p>
                        </div>
                        <Button onClick={() => setStep(1)} className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white text-lg font-black bevel-section mt-8">
                            시작하기 <ChevronRight className="ml-2 w-5 h-5"/>
                        </Button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 flex-1"
                    >
                        <div>
                            <h2 className="text-2xl font-black text-chef-text mb-2">기본 정보</h2>
                            <p className="text-sm text-gray-500">맞춤형 콘텐츠 추천을 위해 필요합니다.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-black text-gray-400 uppercase tracking-widest">성별</Label>
                                <div className="flex gap-2">
                                    {['남성', '여성', '기타'].map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setFormData({ ...formData, gender: g })}
                                            className={`flex-1 h-12 rounded-none font-bold border-2 transition-all ${formData.gender === g
                                                ? 'bg-orange-600 border-orange-600 text-white'
                                                : 'bg-transparent border-gray-200 text-gray-500 hover:border-orange-200'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-black text-gray-400 uppercase tracking-widest">연령대</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['10대', '20대', '30대', '40대', '50대 이상'].map((age) => (
                                        <button
                                            key={age}
                                            onClick={() => setFormData({ ...formData, age_group: age })}
                                            className={`h-12 rounded-none font-bold border-2 transition-all ${formData.age_group === age
                                                ? 'bg-orange-600 border-orange-600 text-white'
                                                : 'bg-transparent border-gray-200 text-gray-500 hover:border-orange-200'
                                                }`}
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1" />
                        <Button onClick={handleNext} className="w-full h-14 bg-white text-black hover:bg-gray-200 text-lg font-black rounded-none">
                            다음 단계 <ChevronRight className="ml-2 w-5 h-5"/>
                        </Button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 flex-1"
                    >
                        <div>
                            <h2 className="text-2xl font-black text-chef-text mb-2">직업 / 소속</h2>
                            <p className="text-sm text-gray-500">현재 주로 활동하는 분야를 알려주세요.</p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자', '기타'].map((job) => (
                                <button
                                    key={job}
                                    onClick={() => setFormData({ ...formData, occupation: job === '기타' ? '' : job })}
                                    className={`h-14 rounded-none font-bold border-2 transition-all ${
                                        (formData.occupation === job) || (job === '기타' && !['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자'].includes(formData.occupation) && formData.occupation !== "")
                                        ? 'bg-orange-600 border-orange-600 text-white'
                                        : 'bg-transparent border-gray-200 text-gray-500 hover:border-orange-200'
                                        }`}
                                >
                                    {job}
                                </button>
                            ))}
                        </div>
                        
                        {/* '기타' 선택 시 직접 입력 필드 노출 (직업이 위 목록에 없으면) */}
                        {!['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자'].includes(formData.occupation) && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Label className="text-xs font-bold text-orange-500 mb-1 block">직업을 직접 입력해주세요</Label>
                                <input 
                                    type="text" 
                                    value={formData.occupation}
                                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                    placeholder="예: 작가, 아티스트 등"
                                    className="w-full h-12 px-4 border-b-2 border-orange-500 bg-transparent outline-none font-bold text-chef-text placeholder:text-gray-300 rounded-none focus:bg-orange-500/5 transition-colors"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex-1" />
                        <Button onClick={handleNext} className="w-full h-14 bg-white text-black hover:bg-gray-200 text-lg font-black rounded-none">
                            다음 단계 <ChevronRight className="ml-2 w-5 h-5"/>
                        </Button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 flex-1 flex flex-col"
                    >
                        <div>
                            <h2 className="text-2xl font-black text-chef-text mb-2">전문 분야 (선택)</h2>
                            <p className="text-sm text-gray-500">
                                본인의 전문성을 나타낼 수 있는 분야를 선택하세요.<br/>
                                <span className="text-orange-500 font-bold">* 프로필 뱃지로 표시됩니다.</span>
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                             {ALL_CATEGORIES.map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => toggleExpertise(item.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${
                                        formData.expertise.includes(item.value)
                                        ? 'bg-blue-600 border-blue-600 text-white transform scale-105'
                                        : 'bg-transparent border-gray-700 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1" />
                        <Button 
                            onClick={handleSubmit} 
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-black bevel-section shadow-lg"
                        >
                            {loading ? "저장 중..." : "설정 완료 및 시작"}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
