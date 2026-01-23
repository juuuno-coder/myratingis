"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChefHat, User, LogOut } from "lucide-react";

export function MyRatingIsHeader() {
  const router = useRouter();
  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img 
            src="/myratingis-logo.png" 
            alt="제 평가는요?" 
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated && user ? (
            <>
              <Button
                onClick={() => router.push("/project/upload")}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 h-10 font-bold flex items-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                진단 의뢰
              </Button>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">
                      {userProfile?.username?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {userProfile?.username || "사용자"}
                  </span>
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                    <button
                      onClick={() => {
                        router.push("/mypage");
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <User className="w-4 h-4" />
                      마이페이지
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="rounded-full px-5 font-medium">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 font-medium">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className="w-full h-0.5 bg-gray-900 rounded"></span>
            <span className="w-full h-0.5 bg-gray-900 rounded"></span>
            <span className="w-full h-0.5 bg-gray-900 rounded"></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4">
          {isAuthenticated && user ? (
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  router.push("/project/upload");
                  setIsMenuOpen(false);
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full h-12 font-bold"
              >
                진단 의뢰하기
              </Button>
              <Button
                onClick={() => {
                  router.push("/mypage");
                  setIsMenuOpen(false);
                }}
                variant="outline"
                className="w-full rounded-full h-12 font-medium"
              >
                마이페이지
              </Button>
              <Button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                variant="ghost"
                className="w-full text-red-600 rounded-full h-12 font-medium"
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full rounded-full h-12 font-medium">
                  로그인
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-gray-900 text-white rounded-full h-12 font-medium">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
