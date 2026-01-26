"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.session) {
        toast.success("회원가입이 완료되었습니다!");
        router.push("/");
      } else {
        toast.success("회원가입 확인 이메일이 발송되었습니다!", {
          description: "이메일을 확인하여 계정을 활성화해주세요.",
          duration: 5000,
        });
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      console.error("[Signup] Error:", error);
      setError(error.message || "회원가입 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("[Signup] Google Error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen chef-bg-dark selection:bg-orange-500/30">
      <MyRatingIsHeader />
      
      <div className="flex min-h-screen flex-col items-center justify-center py-24 px-6">
        {/* Decorative Ornaments */}
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none select-none">
          <div className="text-[120px] font-black text-white leading-none tracking-tighter">JOIN</div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bevel-border bevel-section p-10 chef-black-panel shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
            {/* 로고 영역 */}
            <div className="flex justify-center mb-10">
              <Image
                src="/myratingis-logo.png"
                alt="MyRatingIs"
                width={180}
                height={54}
                className="h-10 w-auto invert brightness-0"
              />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black tracking-tighter text-chef-text uppercase italic">
                Register as Chef
              </h2>
              <div className="h-1 w-12 bg-orange-500 mx-auto mt-4 bevel-sm" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 mb-6 bevel-sm text-[10px] font-black uppercase tracking-widest leading-loose">
                 [ {error} ]
              </div>
            )}

            {/* 소셜 회원가입 */}
            <Button
              onClick={handleGoogleSignup}
              disabled={loading}
              variant="outline"
              className="w-full h-14 bg-transparent border-2 border-chef-border text-chef-text hover:bg-chef-panel bevel-sm font-black text-[10px] tracking-[0.2em] uppercase transition-all mb-8"
            >
              <FcGoogle className="h-4 w-4 mr-3" />
              Join with Google
            </Button>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em]">
                <span className="bg-chef-card px-4 text-chef-text opacity-20">OR CREATE CHEF ID</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleEmailSignup}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-[0.2em] ml-1">
                    Email Identity
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="CHEF@MYRATING.IS"
                    className="w-full h-14 bg-chef-panel border border-chef-border text-chef-text font-bold px-6 bevel-sm focus:border-orange-500 outline-none transition-all placeholder:text-chef-text/10"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-[0.2em] ml-1">
                    Security Key
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 bg-chef-panel border border-chef-border text-chef-text font-bold px-6 bevel-sm focus:border-orange-500 outline-none transition-all placeholder:text-chef-text/10"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password-confirm" className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-[0.2em] ml-1">
                    Confirm Key
                  </label>
                  <input
                    id="password-confirm"
                    type="password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 bg-chef-panel border border-chef-border text-chef-text font-bold px-6 bevel-sm focus:border-orange-500 outline-none transition-all placeholder:text-chef-text/10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-orange-600 text-white hover:bg-orange-700 text-lg font-black bevel-section transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl mt-4"
              >
                {loading ? "PROCESSING..." : "JOIN THE KITCHEN"}
              </Button>
            </form>

            <div className="mt-10 text-center space-y-4">
              <p className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-widest leading-relaxed">
                Already a Chef?{" "}
                <Link
                  href="/login"
                  className="text-chef-text hover:text-orange-500 underline underline-offset-4 ml-2"
                >
                  Enter Studio
                </Link>
              </p>
              
              <p className="text-[8px] font-black text-chef-text opacity-10 uppercase tracking-widest leading-loose max-w-[200px] mx-auto">
                By joining, you agree to our{" "}
                <Link href="/policy/terms" className="underline">Terms</Link> &{" "}
                <Link href="/policy/privacy" className="underline">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
