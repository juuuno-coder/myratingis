"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChefHat, User, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export function MyRatingIsHeader() {
  const router = useRouter();
  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 chef-header-dark shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img 
            src="/myratingis-logo.png" 
            alt="제 평가는요?" 
            className={cn(
              "h-8 w-auto object-contain transition-all duration-300",
              theme === "dark" ? "invert brightness-200" : "invert-0 brightness-0"
            )}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-chef-text"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          {isAuthenticated && user ? (
            <>
              <Button
                onClick={() => router.push("/project/upload")}
                className="bg-orange-600 hover:bg-orange-700 text-white bevel-cta px-6 h-10 font-black text-xs uppercase tracking-widest flex items-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                Audit Request
              </Button>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 bevel-sm bg-white/10 flex items-center justify-center">
                    <span className="text-white font-black text-sm">
                      {userProfile?.username?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-black text-white/80">
                    {userProfile?.username || "CHEF"}
                  </span>
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-black/95 backdrop-blur-xl rounded-none border border-white/10 py-2 shadow-2xl">
                    <button
                      onClick={() => {
                        router.push("/mypage");
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-xs font-black text-white/60 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      MY STUDIO
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-xs font-black text-red-500/80 hover:text-red-500 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      LOGOUT
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 px-5 font-black text-xs uppercase tracking-widest">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-white text-black hover:bg-white/90 bevel-cta px-6 font-black text-xs uppercase tracking-widest">
                  Signup
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
          <div className="w-6 h-5 flex flex-col justify-between items-end">
            <span className="w-full h-0.5 bg-white rounded"></span>
            <span className="w-2/3 h-0.5 bg-white rounded"></span>
            <span className="w-full h-0.5 bg-white rounded"></span>
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

export default MyRatingIsHeader;
