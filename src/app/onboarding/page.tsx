"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gender: "",
    age_group: "",
    occupation: ""
  });

  const handleSubmit = async () => {
    if (!formData.gender || !formData.age_group || !formData.occupation) {
      toast.error("모든 항목을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const { error } = await supabase
        .from('profiles')
        .update({
          gender: formData.gender,
          age_group: formData.age_group,
          occupation: formData.occupation
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("정보가 저장되었습니다! 환영합니다.");
      router.push("/");
    } catch (error: any) {
      toast.error("저장 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen chef-bg-dark selection:bg-orange-500/30">
      <MyRatingIsHeader />
      
      <div className="flex min-h-screen flex-col items-center justify-center py-24 px-6">
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-none border-2 border-chef-border p-10 chef-black-panel shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black tracking-tighter text-chef-text uppercase italic">
                추가 정보 입력
              </h2>
              <div className="h-1 w-12 bg-orange-500 mx-auto mt-4 rounded-none" />
              <p className="text-xs text-gray-500 mt-4 font-bold tracking-widest uppercase">
                더 나은 추천을 위해 몇 가지 정보가 필요합니다.
              </p>
            </div>

            <div className="space-y-8">
                {/* 성별 */}
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

                {/* 연령대 */}
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

                {/* 직업군 */}
                <div className="space-y-3">
                    <Label className="text-sm font-black text-gray-400 uppercase tracking-widest">직업군</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {['학생', '직장인', '프리랜서', '사업가', '구직자', '기타'].map((job) => (
                            <button
                                key={job}
                                onClick={() => setFormData({ ...formData, occupation: job })}
                                className={`h-12 rounded-none font-bold border-2 transition-all ${formData.occupation === job
                                    ? 'bg-orange-600 border-orange-600 text-white'
                                    : 'bg-transparent border-gray-200 text-gray-500 hover:border-orange-200'
                                    }`}
                            >
                                {job}
                            </button>
                        ))}
                    </div>
                </div>

                <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white text-lg font-black bevel-section mt-8 transition-transform hover:scale-[1.02]"
                >
                    {loading ? "저장 중..." : "시작하기"}
                </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
