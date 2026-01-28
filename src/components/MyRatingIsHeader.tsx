"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChefHat, User, LogOut, Sun, Moon, ArrowRight } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center">
        {/* Left: Logo */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center">
              {theme === 'dark' ? (
                <img src="/logo-white.png" alt="제 평가는요?" className="h-8 w-auto object-contain transition-all duration-300" />
              ) : (
                <img src="/myratingis-logo.png" alt="제 평가는요?" className="h-8 w-auto object-contain transition-all duration-300 brightness-0" />
              )}
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex flex-[2] justify-center items-center gap-10">
           <Link href="/about/features" className="text-[13px] font-black text-chef-text opacity-50 hover:opacity-100 uppercase tracking-[0.2em] transition-all group relative">
              서비스 소개
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
           </Link>
           <Link href="/projects" className="text-[13px] font-black text-chef-text opacity-80 hover:opacity-100 uppercase tracking-[0.2em] transition-all group relative flex items-center gap-1.5">
              평가 참여하기
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
           </Link>
           <Link href="/growth" className="text-[13px] font-black text-chef-text opacity-50 hover:opacity-100 uppercase tracking-[0.2em] transition-all group relative flex items-center gap-2">
              명예의 전당
              <span className="bg-orange-500/10 text-orange-500 text-[8px] px-1.5 py-0.5 rounded-md font-bold border border-orange-500/20">준비중</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
           </Link>
           <Link href="/faq" className="text-[13px] font-black text-chef-text opacity-50 hover:opacity-100 uppercase tracking-[0.2em] transition-all group relative">
              자주 묻는 질문
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
           </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex-1 hidden md:flex items-center justify-end gap-6">
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
                onClick={() => router.push("/project/upload?mode=audit")}
                className="bg-orange-600 hover:bg-orange-700 text-white bevel-cta px-6 h-10 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                평가 의뢰하기
              </Button>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 bevel-sm bg-orange-600 flex items-center justify-center">
                    <span className="text-white font-black text-sm">
                      {userProfile?.username?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-black text-chef-text opacity-80">
                    {userProfile?.username || "CHEF"}
                  </span>
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-chef-card backdrop-blur-xl rounded-xl border border-chef-border py-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        router.push("/mypage");
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 text-xs font-black text-chef-text opacity-70 hover:opacity-100 transition-all"
                    >
                      <User className="w-4 h-4" />
                      마이페이지
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-400 transition-all"
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
                <Button variant="ghost" className="text-chef-text opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 px-5 font-black text-xs uppercase tracking-widest transition-all">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-chef-text text-chef-bg hover:opacity-90 bevel-cta px-6 font-black text-xs uppercase tracking-widest transition-all">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-chef-text"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="w-6 h-5 flex flex-col justify-between items-end">
            <span className="w-full h-0.5 bg-current rounded transition-all"></span>
            <span className="w-2/3 h-0.5 bg-current rounded transition-all"></span>
            <span className="w-full h-0.5 bg-current rounded transition-all"></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-chef-card/95 backdrop-blur-2xl border-t border-chef-border overflow-hidden shadow-2xl"
          >
            <div className="p-6 flex flex-col gap-4">
              {isAuthenticated && user ? (
                <>
                  <Button
                    onClick={() => {
                      router.push("/project/upload?mode=audit");
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-600/20"
                  >
                    <ChefHat className="w-5 h-5 mr-3" />
                    평가 의뢰하기
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        router.push("/mypage");
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full rounded-2xl h-14 font-black text-chef-text border-chef-border text-[11px] uppercase tracking-widest bg-white/5"
                    >
                      <User className="w-4 h-4 mr-2" />
                      마이페이지
                    </Button>
                    <Button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full text-red-500 rounded-2xl h-14 font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="w-full">
                    <Button variant="outline" className="w-full rounded-2xl h-14 font-black text-chef-text border-chef-border text-sm uppercase tracking-widest bg-white/5">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="w-full">
                    <Button className="w-full bg-chef-text text-chef-bg rounded-2xl h-14 font-black text-sm uppercase tracking-widest">
                      회원가입
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Secondary Links for Mobile */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                 <Link href="/about/features" onClick={() => setIsMenuOpen(false)}>
                    <div className="h-14 flex items-center px-4 bg-white/5 rounded-2xl border border-chef-border/30 text-[10px] font-black text-chef-text opacity-70 uppercase tracking-widest italic justify-between group">
                       서비스 소개
                       <ArrowRight size={12} className="opacity-30 group-hover:opacity-100 transition-all" />
                    </div>
                 </Link>
                 <Link href="/projects" onClick={() => setIsMenuOpen(false)}>
                    <div className="h-14 flex items-center px-4 bg-white/5 rounded-2xl border border-orange-500/20 text-[10px] font-black text-orange-500 uppercase tracking-widest italic justify-between group">
                       평가 참여하기
                       <span className="bg-orange-500 text-white text-[7px] px-1 rounded-sm">HOT</span>
                    </div>
                 </Link>
                 <Link href="/growth" onClick={() => setIsMenuOpen(false)}>
                    <div className="h-14 flex items-center px-4 bg-white/5 rounded-2xl border border-chef-border/30 text-[10px] font-black text-chef-text opacity-70 uppercase tracking-widest italic justify-between group">
                       명예의 전당
                       <span className="bg-orange-500/10 text-orange-500 text-[8px] px-1.5 py-0.5 rounded-md font-bold border border-orange-500/20 uppercase">Coming</span>
                    </div>
                 </Link>
                 <Link href="/faq" onClick={() => setIsMenuOpen(false)}>
                    <div className="h-14 flex items-center px-4 bg-white/5 rounded-2xl border border-chef-border/30 text-[10px] font-black text-chef-text opacity-70 uppercase tracking-widest italic justify-between group">
                       자주 묻는 질문
                       <ArrowRight size={12} className="opacity-30 group-hover:opacity-100 transition-all" />
                    </div>
                 </Link>
              </div>
              
              {/* Theme Toggle in Mobile */}
              <div className="pt-4 mt-2 border-t border-chef-border/30 flex items-center justify-between">
                 <span className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-widest italic">화면 모드 설정</span>
                 <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-4 py-2 rounded-full bg-chef-panel border border-chef-border text-xs font-black text-chef-text"
                  >
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === 'dark' ? '라이트 모드' : '다크 모드'}
                  </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default MyRatingIsHeader;
