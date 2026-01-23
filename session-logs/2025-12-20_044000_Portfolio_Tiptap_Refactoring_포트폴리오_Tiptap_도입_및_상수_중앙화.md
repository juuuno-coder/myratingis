# Log: Portfolio Upload Upgrade & Refactoring (포트폴리오 업로드 개선 및 리팩토링)

**Original Date:** 2025-12-20
**Key Goal:** Tiptap 에디터 도입을 통한 포트폴리오 업로드 페이지 고도화, 하드코딩 제거를 위한 상수 중앙화, 그리고 Vercel 배포 에러 해결.

---

## 📝 상세 작업 일지 (Chronological)

### 1. Tiptap 에디터 도입 및 페이지 고도화

**상황:**
기존의 단순한 업로드 폼을 Behance나 Notion 스타일의 리치 텍스트 에디터로 업그레이드하여, 사용자가 이미지, 비디오, 텍스트 등을 자유롭게 배치할 수 있도록 개선 요청.

**해결:**

- **패키지 설치:** `@tiptap/react`, `@tiptap/starter-kit` 및 Image, Link, Youtube, Placeholder 익스텐션 설치.
- **컴포넌트 구현 (`src/components/editor/TiptapEditor.tsx`):**
  - 볼드, 이탤릭, 헤딩 등 텍스트 포맷팅 툴바 구현.
  - 이미지 드래그 앤 드롭 및 파일 업로드 버튼 추가 (Supabase Storage 연동).
  - 텍스트 드래그 시 나타나는 **Bubble Menu** 구현.
- **페이지 적용 (`src/app/project/upload/page.tsx`):**
  - 기존 폼을 제거하고 Tiptap 에디터를 통합.
  - **2단계 워크플로우** 도입: 1단계(썸네일, 제목, 카테고리) → 2단계(콘텐츠 작성).
  - **자동 저장 기능:** `checkForDraft` 및 `saveDraft` 기능을 통해 30초마다 로컬 스토리지에 내용 저장.
- **렌더링 지원 (`src/components/ProjectDetailModalV2.tsx`):**
  - 상세 모달에서 `rendering_type: 'rich_text'`일 경우 HTML로 렌더링하도록 수정 (`props` 및 `dangerouslySetInnerHTML` 적용).

### 2. 하드코딩 제거 및 상수 중앙화

**상황:**
주요 파일들에 사이트 URL, 카테고리 매핑 정보, 소셜 미디어 링크 등이 하드코딩되어 있어 유지보수성과 확장성이 떨어짐.

**해결:**

- **상수 파일 생성 (`src/lib/constants.ts`):**
  - `BASE_URL`, `CATEGORY_IDS`, `GENRE_TO_CATEGORY_ID`, `SOCIAL_LINKS` 상수 정의.
- **파일 리팩토링:**
  - `src/app/sitemap.ts`: 하드코딩된 도메인을 `BASE_URL`로 교체.
  - `src/app/api/projects/route.ts`: API 내부 복잡한 카테고리 매핑 로직을 `GENRE_TO_CATEGORY_ID` 상수로 간소화.
  - `src/app/project/upload/page.tsx`: 업로드 로직의 장르-카테고리 매핑을 상수로 교체.
  - `src/components/Footer.tsx`, `src/components/Header.tsx`: 소셜 아이콘 링크 및 모바일 메뉴 링크를 `SOCIAL_LINKS` 상수로 교체.

### 3. Vercel 빌드 에러 긴급 수정 (Tiptap 호환성)

**상황:**
Vercel 배포 중 `Export BubbleMenu doesn't exist in target module` 에러 발생. 최신 버전인 Tiptap v3.14.0과 Next.js 빌드 환경(Turbopack) 간의 호환성 문제로 파악됨.

**해결:**

- **버전 다운그레이드:** Tiptap 관련 모든 패키지를 안정적인 **v2.27.1** 버전으로 다운그레이드.
- **패키지 추가 (`package.json`):**
  - `@tiptap/extension-bubble-menu`, `@tiptap/extension-floating-menu` 명시적 설치.
- **코드 수정 (`src/components/editor/TiptapEditor.tsx`):**
  - `BubbleMenu` 컴포넌트 임포트 에러 해결을 위해 익스텐션을 별도로 임포트하여 에디터 설정(`extensions` 배열)에 등록.

---

**기술적 포인트:**

- **Tiptap v2 vs v3:** v3 베타 버전의 불안정성으로 인해 v2 안정 버전을 채택하여 프로덕션 안정성 확보.
- **Centralized Config:** `src/lib/constants.ts`를 통한 전역 설정 관리로 코드 일관성 향상.
- **Supabase Storage:** 에디터 내 직접 이미지 업로드 기능 구현.
