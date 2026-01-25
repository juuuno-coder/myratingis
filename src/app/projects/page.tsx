"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MyRatingIsHeader } from '@/components/MyRatingIsHeader';
import { ChefHat, Star, Eye, MessageSquare, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/projects?mode=audit');
      const json = await resp.json();
      
      if (json.projects) {
        setProjects(json.projects);
      }
    } catch (e) {
      console.error("Failed to fetch audit projects", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <MyRatingIsHeader />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-orange-600/10 border border-orange-600/20 rounded-full w-fit">
                 <ChefHat className="w-4 h-4 text-orange-600" />
                 <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Ongoing Audit Requests</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-chef-text tracking-tighter italic uppercase">
                진단 참여하기
              </h1>
              <p className="text-chef-text opacity-40 font-bold max-w-xl text-lg">
                도전하는 창작자들의 프로젝트를 미슐랭 스타급 시선으로 진단해 주세요.<br />
                당신의 한 마디가 새로운 마침표가 됩니다.
              </p>
           </div>

           <div className="flex bg-chef-panel p-1 rounded-sm border border-chef-border">
              {['all', 'popular', 'latest'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    activeFilter === f ? "bg-chef-text text-chef-bg shadow-lg" : "text-chef-text opacity-30 hover:opacity-100"
                  )}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>

        {/* Auth Inducement Banner */}
        {!isAuthenticated && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 p-8 rounded-[2rem] bg-gradient-to-r from-orange-600 to-orange-500 text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <ChefHat size={120} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="text-center md:text-left space-y-2">
                  <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-2 justify-center md:justify-start">
                     <Sparkles className="w-6 h-6" /> Join the Kitchen
                  </h3>
                  <p className="text-white/80 font-bold">로그인하고 셰프가 되어 프로젝트를 진단해보세요. <br className="hidden md:block" />참여 시 다양한 리워드와 전문성 배지가 제공됩니다.</p>
               </div>
               <div className="flex gap-3">
                  <Button onClick={() => router.push('/login')} variant="secondary" className="h-14 px-8 rounded-2xl font-black bg-white text-orange-600 hover:bg-white/90">로그인하기</Button>
                  <Button onClick={() => router.push('/signup')} variant="outline" className="h-14 px-8 rounded-2xl font-black border-white/20 text-white hover:bg-white/10">회원가입</Button>
               </div>
            </div>
          </motion.div>
        )}

        {/* Project Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[4/3] bg-chef-panel animate-pulse bevel-section" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map((p) => {
              const auditConfig = p.custom_data?.audit_config;
              return (
                <motion.div 
                  key={p.project_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/review/viewer?projectId=${p.project_id}`)}
                >
                   <div className="relative aspect-[4/3] overflow-hidden bevel-section bg-chef-card border border-chef-border shadow-xl">
                      {p.thumbnail_url ? (
                        <Image 
                          src={p.thumbnail_url} 
                          alt={p.title} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-chef-panel to-chef-card">
                          <ChefHat className="w-16 h-16 text-chef-text opacity-10" />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      
                      {/* Badge Tags */}
                       <div className="absolute top-4 left-4 flex gap-2">
                         <span className="bg-orange-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest bevel-sm">Audit Active</span>
                         {p.has_rated && (
                           <span className="bg-green-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest bevel-sm animate-in zoom-in duration-300">내 평가 완료</span>
                         )}
                       </div>

                      {/* Content info on hover-like appearance */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                         <div className="flex items-center gap-2 mb-2">
                            <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                            <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">{p.category_name || "New Kitchen"}</span>
                         </div>
                         <h3 className="text-2xl font-black text-white tracking-tight line-clamp-1 mb-2 italic">{p.title}</h3>
                          <div className="flex items-center gap-4 text-white opacity-0 group-hover:opacity-60 transition-opacity">
                             <div className="flex items-center gap-1.5 ">
                                <Eye className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{p.views_count || 0}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{p.rating_count || 0}</span>
                             </div>
                          </div>
                      </div>

                      {/* Arrow Icon */}
                      <div className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <ArrowRight className="w-6 h-6" />
                      </div>
                   </div>
                   
                   <div className="mt-4 flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-chef-panel border border-chef-border flex items-center justify-center overflow-hidden">
                             <img src={p.User?.avatar_url || "/globe.svg"} className="w-full h-full object-cover" />
                         </div>
                         <span className="text-xs font-black text-chef-text opacity-70 italic">{p.User?.username || "Chef Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Clock className="w-3 h-3 text-chef-text opacity-20" />
                         <span className="text-[10px] font-black text-chef-text opacity-20 uppercase">
                          {p.audit_deadline ? `${new Date(p.audit_deadline).toLocaleDateString()} Deadline` : "No Limit"}
                         </span>
                      </div>
                   </div>

                    {p.has_rated && (
                      <div className="mt-4 px-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="w-full rounded-xl font-black text-[10px] h-10 uppercase tracking-widest bg-green-600/10 text-green-600 hover:bg-green-600 hover:text-white border-none transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/report/${p.project_id}`);
                          }}
                        >
                          내 리포트 보기 <ArrowRight className="ml-2 w-3 h-3" />
                        </Button>
                      </div>
                    )}
                 </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 space-y-6 text-center">
             <div className="w-24 h-24 bg-chef-panel rounded-full flex items-center justify-center border border-chef-border animate-bounce">
                <ChefHat className="w-10 h-10 text-chef-text opacity-20" />
             </div>
             <div className="space-y-2">
                <h3 className="text-3xl font-black text-chef-text italic uppercase">No Audits Found</h3>
                <p className="text-chef-text opacity-40 font-bold">진단을 기다리는 프로젝트가 아직 없습니다. 직접 의뢰를 시작해 보세요.</p>
             </div>
             <Button 
               onClick={() => router.push('/project/upload')}
               className="bg-orange-600 hover:bg-orange-500 text-white font-black px-10 h-14 rounded-full shadow-2xl transition-all hover:scale-105"
             >
               진단 의뢰하기 <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
          </div>
        )}
      </main>

      <footer className="py-20 border-t border-chef-border mt-20">
         <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
            <img src="/myratingis-logo.png" className="h-6 opacity-20 brightness-0 dark:invert transition-all" />
            <p className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-[0.4em]">© 2026 MyRatingIs. Beyond the Star.</p>
         </div>
      </footer>
    </div>
  );
}
