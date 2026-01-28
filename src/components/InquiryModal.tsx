"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Send, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

interface InquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    project_id?: number | string; // Handle both types just in case
    id?: number | string;
    title: string;
    user_id: string; // Owner ID
  };
}

export function InquiryModal({ open, onOpenChange, project }: InquiryModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
        toast.error("문의 내용을 입력해주세요.");
        return;
    }
    if (!user) {
        toast.error("로그인이 필요합니다.");
        return;
    }

    setIsSubmitting(true);
    try {
        const projectId = project.project_id || project.id;
        
        const { error } = await supabase.from('ProjectInquiry').insert({
            project_id: projectId,
            user_id: user.id,
            content: content.trim(),
            is_private: isPrivate,
            status: 'pending'
        } as any); // Cast to any if table types are not perfect

        if (error) throw error;

        toast.success("문의가 등록되었습니다. 작성자에게 전달됩니다.");
        onOpenChange(false);
        setContent("");
    } catch (error: any) {
        console.error("Inquiry Error:", error);
        toast.error("전송 실패: " + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-chef-card text-chef-text border-chef-border">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <Send className="w-5 h-5 text-orange-600" />
                    창작자에게 문의하기
                </DialogTitle>
                <DialogDescription className="text-chef-text opacity-60">
                    <span className="font-bold text-chef-text">{project.title}</span> 프로젝트에 대해 궁금한 점을 남겨주세요.
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>문의 내용</Label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="안녕하세요, 이 프로젝트의 어떤 부분이 궁금합니다..."
                        className="bg-chef-panel border-chef-border min-h-[120px] resize-none focus-visible:ring-orange-500"
                    />
                </div>
                
                <div className="flex items-center justify-between bg-chef-panel p-4 rounded-lg border border-chef-border">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-chef-text opacity-60" />
                        <div className="text-sm">
                            <span className="font-bold block">비공개로 보내기</span>
                            <span className="text-xs opacity-60">창작자와 나만 볼 수 있습니다.</span>
                        </div>
                    </div>
                    <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    문의 보내기
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
