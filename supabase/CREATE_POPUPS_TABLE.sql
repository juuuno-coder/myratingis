-- 팝업 광고 테이블 생성
CREATE TABLE IF NOT EXISTS public.popups (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT '자세히 보기',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- 공개 정책: 활성화되고 기간 내인 팝업만 조회 가능
CREATE POLICY "Active popups are viewable by everyone."
  ON public.popups
  FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- 관리자 정책: 관리자는 모든 팝업 관리 가능
CREATE POLICY "Admins can manage popups."
  ON public.popups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_popups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER popups_updated_at
  BEFORE UPDATE ON public.popups
  FOR EACH ROW
  EXECUTE FUNCTION update_popups_updated_at();

-- 샘플 데이터
INSERT INTO public.popups (title, content, image_url, link_url, is_active, display_order) VALUES
('🎉 Vibefolio 오픈 기념 이벤트', '새로운 크리에이터 커뮤니티 Vibefolio에 오신 것을 환영합니다! 지금 가입하고 프로젝트를 공유해보세요.', null, '/signup', true, 1);
