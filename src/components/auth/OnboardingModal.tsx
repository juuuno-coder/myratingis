"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GENRE_CATEGORIES_WITH_ICONS, FIELD_CATEGORIES_WITH_ICONS } from "@/lib/ui-constants";

export function OnboardingModal() {
  const { user, userProfile, refreshUserProfile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    gender: "",
    age_group: "",
    occupation: "",
    expertise: [] as string[],
  });

  const pathname = usePathname();

  // Check if onboarding is needed
  useEffect(() => {
    if (loading || !user) return;
    
    // 1. Check if user already skipped/completed in this browser
    const skipKey = `onboarding_skipped_${user.id}`;
    if (localStorage.getItem(skipKey) === 'true') return;

    // Don't show on specific paths if needed, generally show everywhere if logged in & missing info
    const excludedPaths = ["/auth", "/api", "/faq", "/about", "/support", "/policy"];
    if (excludedPaths.some(path => pathname?.startsWith(path))) return;

    // Check if profile is loaded but missing info
    if (userProfile) {
       const isMissing = !userProfile.gender || !userProfile.age_range || !userProfile.occupation;
       if (isMissing) {
           setOpen(true);
       } else {
           setOpen(false);
           // If profile is complete, ensure we don't check again (optional, but good for sync)
           localStorage.setItem(skipKey, 'true');
       }
    }
  }, [user, userProfile, loading, pathname]);

  const handleNext = () => {
    if (step === 2 && (!formData.gender || !formData.age_range)) { // userProfile uses age_range, form uses age_group. Unified to age_group in form but check logic.
      if (!formData.gender || !formData.age_group) {
          toast.error("성별과 연령대를 선택해주세요.");
          return;
      }
    }
    if (step === 3 && !formData.occupation) {
      toast.error("직업을 선택하거나 입력해주세요.");
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleClose = (isOpen: boolean) => {
      if (!isOpen && user) {
          // User dismissed the modal (ESC, backdrop click, etc.)
          localStorage.setItem(`onboarding_skipped_${user.id}`, 'true');
      }
      setOpen(isOpen);
  };

  const handleSubmit = async () => {
    if (!user) {
        toast.error("로그인 정보가 없습니다. 다시 로그인해주세요.");
        return;
    }
    setIsSubmitting(true);
    
    // Timeout for safety
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
        gender: formData.gender,
        age_group: formData.age_group,
        occupation: formData.occupation,
        expertise: { fields: formData.expertise }, 
      };

      console.log("Onboarding Payload:", updatePayload);

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
          const resData = await response.json();
          throw new Error(resData.error || resData.details || 'Server update failed');
      }
      
      console.log("Onboarding Success (API)");

      // Mark as completed in local storage immediately
      localStorage.setItem(`onboarding_skipped_${user.id}`, 'true');

      // No need to await refreshUserProfile() since we reload
      toast.success("프로필 설정이 완료되었습니다!");
      
      // Close immediately and reload
      setOpen(false);
      window.location.reload(); 
    } catch (error: any) {
      console.error("Onboarding Save Error:", error);
      const errorMsg = error.name === 'AbortError' ? '요청 시간이 초과되었습니다.' : (error.message || "알 수 없는 오류가 발생했습니다.");
      
      toast.error(`저장 실패: ${errorMsg}`);
      
      if (confirm("저장 중 오류가 발생했습니다. 페이지를 새로고침 하시겠습니까?")) {
         window.location.reload();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpertise = (id: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(id) 
        ? prev.expertise.filter(item => item !== id)
        : [...prev.expertise, id]
    }));
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl h-[90vh] md:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white text-black border-none shadow-2xl"
        // Allow default interaction outside and ESC to close
        showCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>온보딩</DialogTitle>
          <DialogDescription>서비스 이용을 위한 필수 정보를 입력합니다.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 h-full overflow-hidden">
            {/* Top Bar: Progress & Info */}
            <div className="w-full bg-slate-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                <h1 className="font-black text-xl italic tracking-tighter text-slate-900 hidden sm:block">
                    제 평가는요?
                </h1>
                
                {/* Steps Container - Horizontal Scroll if needed */}
                <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar mx-auto sm:mx-0">
                    {[
                        { step: 1, label: "환영" },
                        { step: 2, label: "정보" },
                        { step: 3, label: "직업" },
                        { step: 4, label: "분야" },
                    ].map((s) => (
                        <div key={s.step} className="flex items-center gap-2 shrink-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                                step >= s.step ? "bg-orange-600 text-white" : "bg-white border text-gray-300"
                            }`}>
                                {step > s.step ? <Check className="w-4 h-4" /> : s.step}
                            </div>
                            <span className={`text-sm font-bold ${step === s.step ? "text-slate-900" : "text-gray-300"}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white flex flex-col items-center">
                <div className="w-full max-w-2xl">
                <AnimatePresence mode="wait">
                    
                    {/* STEP 1: WELCOME */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="h-full flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-orange-100 rounded-full flex items-center justify-center text-4xl mb-2">
                                👋
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black mb-2">환영합니다!</h2>
                                <p className="text-lg md:text-xl font-bold text-orange-600">
                                    {userProfile?.username || "고객"}님
                                </p>
                            </div>
                            <p className="text-sm md:text-base text-gray-500 max-w-sm">
                                공정한 평가와 성장을 위한 플랫폼,<br/>
                                MyRatingIs에 오신 것을 환영합니다.
                            </p>
                            <div className="pt-8 w-full md:w-auto">
                                <Button onClick={() => setStep(2)} size="lg" className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold px-12 h-14 rounded-full text-lg shadow-xl shadow-orange-200">
                                    시작하기 <ChevronRight className="ml-2 w-5 h-5"/>
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: BASIC INFO */}
                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 md:space-y-8 pb-10"
                        >
                            <div>
                                <h2 className="text-xl md:text-2xl font-black mb-2">기본 정보</h2>
                                <p className="text-sm text-gray-500">보다 정확한 콘텐츠 추천을 위해 필요합니다.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-base font-bold">성별</Label>
                                    <div className="flex gap-3">
                                        {['남성', '여성', '기타'].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setFormData({ ...formData, gender: g })}
                                                className={`flex-1 h-12 md:h-14 rounded-xl font-bold border-2 transition-all text-sm md:text-base ${formData.gender === g
                                                    ? 'bg-orange-50 border-orange-600 text-orange-700'
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-bold">연령대</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['10대', '20대', '30대', '40대', '50대 이상'].map((age) => (
                                            <button
                                                key={age}
                                                onClick={() => setFormData({ ...formData, age_group: age })}
                                                className={`h-10 md:h-12 rounded-xl font-bold border-2 transition-all text-sm md:text-base ${formData.age_group === age
                                                    ? 'bg-orange-50 border-orange-600 text-orange-700'
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                                                    }`}
                                            >
                                                {age}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 md:pt-8">
                                <Button onClick={handleNext} className="w-full h-12 md:h-14 bg-black text-white hover:bg-gray-800 text-lg font-bold rounded-xl">
                                    다음 단계
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: OCCUPATION */}
                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 md:space-y-8 pb-10"
                        >
                            <div>
                                <h2 className="text-xl md:text-2xl font-black mb-2">직업 / 소속</h2>
                                <p className="text-sm text-gray-500">현재 주로 활동하는 분야를 알려주세요.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자', '기타'].map((job) => (
                                    <button
                                        key={job}
                                        onClick={() => setFormData({ ...formData, occupation: job === '기타' ? '' : job })}
                                        className={`h-12 md:h-14 rounded-xl font-bold border-2 transition-all text-sm md:text-base ${
                                            (formData.occupation === job) || (job === '기타' && !['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자'].includes(formData.occupation) && formData.occupation !== "")
                                            ? 'bg-orange-50 border-orange-600 text-orange-700'
                                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                                            }`}
                                    >
                                        {job}
                                    </button>
                                ))}
                            </div>
                            
                            {!['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자'].includes(formData.occupation) && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-xs font-bold text-orange-500 mb-1 block">직업을 직접 입력해주세요</Label>
                                    <input 
                                        type="text" 
                                        value={formData.occupation}
                                        onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                        placeholder="예: 작가, 아티스트 등"
                                        className="w-full h-12 px-4 border-b-2 border-orange-500 bg-transparent outline-none font-bold text-black placeholder:text-gray-300 transition-colors"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="pt-4 md:pt-8">
                                <Button onClick={handleNext} className="w-full h-12 md:h-14 bg-black text-white hover:bg-gray-800 text-lg font-bold rounded-xl">
                                    다음 단계
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: EXPERTISE */}
                    {step === 4 && (
                        <motion.div 
                            key="step4"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 md:space-y-8 pb-10"
                        >
                            <div>
                                <h2 className="text-xl md:text-2xl font-black mb-2">전문 분야 (선택)</h2>
                                <p className="text-sm text-gray-500">
                                    본인의 전문성을 나타낼 수 있는 분야를 선택하세요.<br/>
                                    <span className="text-orange-600 font-bold">* 프로필 뱃지로 표시됩니다.</span>
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto p-1 scrollbar-hide">
                                {[...GENRE_CATEGORIES_WITH_ICONS, ...FIELD_CATEGORIES_WITH_ICONS].map(item => (
                                    <button
                                        key={item.value}
                                        onClick={() => toggleExpertise(item.value)}
                                        className={`px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all border-2 ${
                                            formData.expertise.includes(item.value)
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                            : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-500'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4 md:pt-8">
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-12 md:h-14 bg-orange-600 text-white hover:bg-orange-700 text-lg font-bold rounded-xl shadow-lg shadow-orange-200">
                                    {isSubmitting ? "저장 중..." : "설정 완료 및 시작"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
