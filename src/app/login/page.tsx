"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import Image from "next/image";
import { cn } from "@/lib/utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam);
      setError(decodedError);
      toast.error("로그인 오류", { description: decodedError });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        toast.success("로그인 성공!");
        const returnTo = searchParams.get("returnTo") || "/";
        router.push(returnTo);
      }
    } catch (error: any) {
      console.error("로그인 오류:", error);
      setError(error.message || "로그인 중 오류가 발생했습니다.");
      toast.error("로그인 실패", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const returnTo = searchParams.get("returnTo") || "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`,
          queryParams: {
            access_type: 'offline',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google 로그인 오류:", error);
      setError(error.message || "Google 로그인 중 오류가 발생했습니다.");
      toast.error("Google 로그인 실패", { description: error.message });
    }
  };

  return (
    <div className="min-h-screen chef-bg-dark selection:bg-orange-500/30">
      <MyRatingIsHeader />
      
      <div className="flex min-h-screen flex-col items-center justify-center py-24 px-6">
        {/* Decorative Ornaments */}
        <div className="absolute top-0 left-0 p-20 opacity-5 pointer-events-none select-none">
          <div className="text-[120px] font-black text-white leading-none tracking-tighter">STAGE</div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div 
            className="bevel-section p-10 chef-black-panel shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
            style={{ filter: "drop-shadow(0 0 1px var(--chef-border))" }}
          >
            {/* 로고 영역 */}
            <div className="flex justify-center mb-12">
              <div className="relative group">
                <Image
                  src="/myratingis-logo.png"
                  alt="MyRatingIs"
                  width={180}
                  height={54}
                  className="h-10 w-auto invert brightness-0"
                />
                <div className="absolute -inset-4 bg-orange-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-black tracking-tighter text-chef-text uppercase italic">
                로그인
              </h2>
              <div className="h-1 w-12 bg-orange-500 mx-auto mt-4 bevel-sm" />
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 bevel-sm text-[10px] font-black uppercase tracking-widest leading-loose">
                   [ Error : {error} ]
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email-address" className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-[0.2em] ml-1">
                    이메일 주소
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="CHEF@MYRATING.IS"
                    className="w-full h-14 bg-chef-panel border border-chef-border text-chef-text font-bold px-6 bevel-sm focus:border-orange-500 outline-none transition-all placeholder:text-chef-text/10"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-[0.2em] ml-1">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-14 bg-chef-panel border border-chef-border text-chef-text font-bold px-6 bevel-sm focus:border-orange-500 outline-none transition-all placeholder:text-chef-text/10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="relative">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-4 h-4 border border-white/20 bevel-sm bg-white/5 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                  </div>
                  <label htmlFor="remember-me" className="text-[10px] font-black text-chef-text opacity-40 uppercase tracking-widest cursor-pointer group-hover:opacity-60 transition-colors">
                    로그인 유지
                  </label>
                </div>

                <Link href="/forgot-password" className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors">
                  비밀번호 찾기
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-orange-600 text-white hover:bg-orange-700 text-lg font-black bevel-section transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
              >
                {loading ? "로그인 중..." : "입장하기"}
              </Button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em]">
                <span className="bg-chef-card px-4 text-chef-text opacity-20">또는 소셜 로그인</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-14 bg-transparent border-2 border-chef-border text-chef-text hover:bg-chef-panel bevel-sm font-black text-[10px] tracking-[0.2em] uppercase transition-all"
            >
              <FcGoogle className="h-4 w-4 mr-3" />
              구글로 로그인
            </Button>

            <div className="mt-12 text-center">
              <p className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-widest">
                계정이 없으신가요?{" "}
                <Link
                  href="/signup"
                  className="text-orange-500 hover:text-orange-400 underline underline-offset-4 ml-2"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-black animate-pulse">로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
