"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { 
  Loader2, Globe, Github, Twitter, Instagram, 
  Settings, Check, X, Copy, ExternalLink, 
  Eye, EyeOff, Terminal, Key, Plus, Trash2, RefreshCw, Lock, UserCircle
} from "lucide-react";
import { GENRE_CATEGORIES_WITH_ICONS, FIELD_CATEGORIES_WITH_ICONS } from "@/lib/ui-constants";
import { FontAwesomeIcon } from "@/components/FaIcon";

interface ProfileManagerProps {
  user: any; 
  onUpdate: () => void;
}

export function ProfileManager({ user, onUpdate }: ProfileManagerProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  // States
  const [isPublic, setIsPublic] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    nickname: "",
    bio: "",
    gender: "",
    age_group: "",
    occupation: "",
    website: "",
    github: "",
    twitter: "",
    instagram: "",
  });
  
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Interests
  const [interests, setInterests] = useState<{ genres: string[], fields: string[] }>({
    genres: [],
    fields: []
  });

  // Expertise
  const [expertise, setExpertise] = useState<{ fields: string[] }>({
    fields: []
  });

  // API Key State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        nickname: user.nickname || user.username || "",
        bio: user.bio || "",
        gender: user.gender || "",
        age_group: user.age_group || "",
        occupation: user.occupation || "",
        website: user.social_links?.website || "",
        github: user.social_links?.github || "",
        twitter: user.social_links?.twitter || "",
        instagram: user.social_links?.instagram || "",
      });
      setIsPublic(user.is_public !== false);
      
      // Load interests
      if (user.interests) {
          try {
            const savedInterests = typeof user.interests === 'string' 
                ? JSON.parse(user.interests) 
                : user.interests;
            setInterests({
                genres: Array.isArray(savedInterests.genres) ? savedInterests.genres : [],
                fields: Array.isArray(savedInterests.fields) ? savedInterests.fields : [],
            });
          } catch (e) { console.error('Error parsing interests:', e); }
      }

      // Load expertise
      if (user.expertise) {
          try {
            const savedExpertise = typeof user.expertise === 'string'
                ? JSON.parse(user.expertise)
                : user.expertise;
            setExpertise({
                fields: Array.isArray(savedExpertise.fields) ? savedExpertise.fields : [],
            });
          } catch (e) { console.error('Error parsing expertise:', e); }
      }

      setUsernameAvailable(null);
      fetchApiKeys();
    }
  }, [user]);

  // --- API Key Logic ---
  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false });
    if (data) setApiKeys(data);
    setLoadingKeys(false);
  };

  const generateApiKey = async () => {
      try {
          const key = 'vf_' + Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
          
          const { data, error } = await supabase.from('api_keys').insert({
              user_id: user.id,
              api_key: key,
              key_name: 'Vibefolio Personal Key',
              is_active: true
          }).select().single();

          if (error) throw error;
          
          setApiKeys([data, ...apiKeys]);
          setNewKey(key); // Show once
          toast.success("API Key가 발급되었습니다!");
      } catch (e: any) {
          toast.error("API Key 발급 실패: " + e.message);
      }
  };

  const deleteApiKey = async (id: number) => {
      if (!confirm('정말 삭제하시겠습니까? 이 키를 사용하는 모든 앱이 작동을 멈춥니다.')) return;
      await supabase.from('api_keys').update({ is_active: false }).eq('key_id', id);
      setApiKeys(apiKeys.filter(k => k.key_id !== id));
      toast.success("API Key가 삭제되었습니다.");
  };

  // --- Profile Logic ---
  // checkUsername Removed

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        nickname: formData.nickname,
        // bio: formData.bio, // Removed
        gender: formData.gender,
        age_group: formData.age_group,
        occupation: formData.occupation,
        social_links: {
          website: formData.website,
          github: formData.github,
          twitter: formData.twitter,
          instagram: formData.instagram,
        },
        is_public: isPublic,
        interests: interests,
        expertise: expertise,
      };

      // profiles 테이블 업데이트
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      // users 테이블이 존재할 수 있으므로 시도 (있는 경우에만)
      try {
        await supabase.from('users').update({ 
            nickname: formData.nickname,
            // username: formData.username // Removed from update
        }).eq('id', user.id);
      } catch (e) {}

      if (profileError) throw profileError;

      // Auth Metadata 업데이트
      await supabase.auth.updateUser({
          data: { 
              nickname: formData.nickname,
              full_name: formData.nickname 
          }
      });

      toast.success("설정이 저장되었습니다!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "저장 실패");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwords.new || passwords.new.length < 6) {
        return toast.error("새 비밀번호는 최소 6자 이상이어야 합니다.");
    }
    if (passwords.new !== passwords.confirm) {
        return toast.error("새 비밀번호가 일치하지 않습니다.");
    }

    setIsChangingPassword(true);
    try {
        const { error } = await supabase.auth.updateUser({
            password: passwords.new
        });
        if (error) throw error;
        
        toast.success("비밀번호가 성공적으로 변경되었습니다.");
        setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
        toast.error(error.message || "비밀번호 변경 실패");
    } finally {
        setIsChangingPassword(false);
    }
  };

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/${formData.username}` : '';

  // Helpers
  const toggleGenre = (id: string) => {
      setInterests(prev => ({
          ...prev,
          genres: prev.genres.includes(id) ? prev.genres.filter(g => g !== id) : [...prev.genres, id]
      }));
  };
  const toggleField = (id: string) => {
      setInterests(prev => ({
          ...prev,
          fields: prev.fields.includes(id) ? prev.fields.filter(f => f !== id) : [...prev.fields, id]
      }));
  };
  const toggleExpertise = (id: string) => {
      setExpertise(prev => ({
          ...prev,
          fields: prev.fields.includes(id) ? prev.fields.filter(f => f !== id) : [...prev.fields, id]
      }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 1. 기본 프로필 설정 */}
        <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-chef-border pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-chef-text">
                    <Settings className="w-6 h-6" />
                    기본 설정
                </h2>
                <Button onClick={handleSave} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "변경사항 저장"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 공개 여부 */}
                <div className="col-span-full bg-chef-panel p-6 rounded-xl border border-chef-border flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isPublic ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-chef-card text-chef-text opacity-40'}`}>
                            {isPublic ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-chef-text">프로필 공개 설정</h3>
                            <p className="text-sm text-chef-text opacity-40">
                                {isPublic ? "누구나 내 프로필을 볼 수 있습니다." : "나만 내 프로필을 볼 수 있습니다."}
                            </p>
                        </div>
                     </div>
                     <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="dark:text-slate-200">닉네임 (표시 이름)</Label>
                        <Input 
                            value={formData.nickname}
                            onChange={e => setFormData({...formData, nickname: e.target.value})}
                            placeholder="활동하실 닉네임을 입력하세요."
                            className="h-12 rounded-xl bg-white dark:bg-slate-950 border-input dark:border-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* 한줄 소개 & 아이디 Removed as per request */}
            </div>
        </section>

        {/* 2. 상세 프로필 (온보딩 정보) - 직접 수정 */}
        <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-chef-border pb-4">
                <div>
                   <h2 className="text-xl font-bold flex items-center gap-2 text-chef-text">
                       <UserCircle className="w-6 h-6 text-orange-500" />
                       상세 프로필
                   </h2>
                   <p className="text-sm text-chef-text opacity-40 mt-1">성별, 연령, 직업, 전문 분야 정보입니다.</p>
                </div>
            </div>

            <div className="bg-chef-card p-6 rounded-2xl border border-chef-border space-y-8">
                 {/* 성별 & 연령대 Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-base font-bold dark:text-slate-200">성별</Label>
                        <div className="flex flex-wrap gap-2">
                            {['남성', '여성', '기타'].map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setFormData({ ...formData, gender: g })}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${formData.gender === g
                                        ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                                        : 'bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100'
                                        }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base font-bold dark:text-slate-200">연령대</Label>
                        <div className="flex flex-wrap gap-2">
                            {['10대', '20대', '30대', '40대', '50대 이상'].map((age) => (
                                <button
                                    key={age}
                                    onClick={() => setFormData({ ...formData, age_group: age })}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${formData.age_group === age
                                        ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                                        : 'bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100'
                                        }`}
                                >
                                    {age}
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>

                 <div className="h-px bg-gray-100 dark:bg-slate-800" />

                 {/* 직업군 */}
                 <div className="space-y-3">
                    <Label className="text-base font-bold dark:text-slate-200">직업 / 소속</Label>
                    <div className="flex flex-wrap gap-2">
                        {['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자', '기타'].map((job) => (
                            <button
                                key={job}
                                onClick={() => setFormData({ ...formData, occupation: job === '기타' ? '' : job })}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                    (formData.occupation === job) || (job === '기타' && !['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자'].includes(formData.occupation) && formData.occupation !== "")
                                    ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                                    : 'bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100'
                                    }`}
                            >
                                {job}
                            </button>
                        ))}
                    </div>
                    {/* '기타' 직접 입력 */}
                    {!['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자'].includes(formData.occupation) && (
                        <div className="mt-3 max-w-md animate-in fade-in slide-in-from-top-1">
                            <Input 
                                value={formData.occupation} 
                                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                placeholder="직업을 직접 입력하세요 (예: 작가)" 
                                className="h-12 rounded-xl bg-chef-panel border-orange-500/30 focus:border-orange-500 text-chef-text font-bold"
                            />
                        </div>
                    )}
                </div>

                <div className="h-px bg-gray-100 dark:bg-slate-800" />

                {/* 전문 분야 */}
                <div className="space-y-4">
                    <Label className="text-base font-bold flex items-center gap-2 dark:text-slate-200">
                        전문 분야 🎖️
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">Badge Display</span>
                    </Label>
                    <div className="flex flex-wrap gap-2 p-6 bg-chef-panel rounded-2xl border border-chef-border">
                        {[...GENRE_CATEGORIES_WITH_ICONS, ...FIELD_CATEGORIES_WITH_ICONS].map(item => (
                            <button
                                key={item.value}
                                onClick={() => toggleExpertise(item.value)}
                                className={`px-3 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                    expertise.fields.includes(item.value)
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105'
                                    : 'bg-chef-card border-chef-border text-chef-text opacity-40 hover:opacity-100'
                                }`}
                            >
                                <span><FontAwesomeIcon icon={item.icon} /></span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* 2.7 비밀번호 변경 */}
        <section className="space-y-6">
            <h2 className="text-xl font-bold border-b border-chef-border pb-4 flex items-center gap-2 text-chef-text">
                <Lock className="w-6 h-6 text-chef-text opacity-40" />
                보안 및 비밀번호 변경
            </h2>
            <div className="bg-chef-panel p-6 rounded-2xl border border-chef-border space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="dark:text-slate-200">새 비밀번호</Label>
                        <Input 
                            type="password"
                            value={passwords.new}
                            onChange={e => setPasswords({...passwords, new: e.target.value})}
                            placeholder="새 비밀번호 입력"
                            className="bg-chef-card border-chef-border text-chef-text"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="dark:text-slate-200">새 비밀번호 확인</Label>
                        <Input 
                            type="password"
                            value={passwords.confirm}
                            onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                            placeholder="비밀번호 확인"
                            className="bg-chef-card border-chef-border text-chef-text"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button 
                        onClick={handlePasswordChange} 
                        disabled={isChangingPassword || !passwords.new}
                        className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                        {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        비밀번호 업데이트
                    </Button>
                </div>
            </div>
        </section>

        {/* Social & API Hidden */}
        
        {/* 하단 저장 버튼 (Floating also possible) */}
        <div className="flex justify-end pt-8">
             <Button onClick={handleSave} size="lg" disabled={loading} className="bg-green-600 hover:bg-green-700 shadow-lg px-8">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "모든 설정 저장"}
            </Button>
        </div>

    </div>
  );
}
