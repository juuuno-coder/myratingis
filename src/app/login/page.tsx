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
import MyRatingIsHeader from "@/components/MyRatingIsHeader";
import Image from "next/image";

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
    <>
      <MyRatingIsHeader />
      <div 
        className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24"
        style={{
          backgroundImage: 'url(/dark-texture-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
          {/* 로고 */}
          <div className="flex justify-center mb-6">
            <Image
              src="/myratingis-logo.png"
              alt="MyRatingIs"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
          </div>

          <div>
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
              로그인
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                회원가입
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm break-words">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이메일 주소
                </label>
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="example@email.com"
                  className="h-11"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  비밀번호
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="비밀번호"
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-600"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  로그인 상태 유지
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-full shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">또는</span>
            </div>
          </div>

          <div>
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-medium transition-all hover:shadow-md"
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              Google 계정으로 로그인
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
