Log: Refine UI and Interests Feature (UI 개선 및 관심사 기능 구현)
Original Date: 2025-12-18 11:13:00
Key Goal: "관심사" 필터링 기능 구현, UI 테마(Green) 적용, 스티키 메뉴 버그 수정, 그리고 Vercel 배포를 위한 TypeScript 빌드 에러 해결.

📝 상세 작업 일지 (Chronological)

1. Refine Header & Filters (헤더 및 필터 개선)
   상황: 헤더 높이가 너무 크고, 카테고리 메뉴가 스크롤 시 상단에 고정되지 않는 문제, 그리고 "관심사" 필터 기능이 구현되지 않음.
   해결:
   src/components/Header.tsx: 높이를 h-20에서 h-16으로 축소하여 콤팩트하게 변경.
   src/components/StickyMenu.tsx: 상단 `top` 위치 조정(top-14 -> top-16), 아이콘 크기 및 패딩 축소, "관심사" 탭 추가 및 디자인 개선.
   src/app/layout.tsx: sticky 동작을 방해하던 fade-in 애니메이션 클래스 제거.
   src/app/page.tsx: "관심사" 선택 시 로직(로그인 체크, 관심사 설정 체크) 구현.
   기술적 포인트: CSS position: sticky 동작 원리 이해 및 충돌 요소(transform) 제거.

2. Implement Interests Modal (관심사 설정 유도 모달 구현)
   상황: 사용자가 관심사를 설정하지 않고 "관심사" 탭을 클릭했을 때 안내할 UI가 부재함. 또한 구현 과정에서 상태 변수 선언 누락으로 런타임 에러 발생.
   해결:
   src/app/page.tsx: Shadcn UI Dialog 컴포넌트를 활용하여 안내 모달 구현. "설정하러 가기" 버튼 클릭 시 마이페이지로 이동.
   Troubleshooting: interestModalOpen is not defined 에러 발생. useState 선언이 컴포넌트 내부 최상단에 올바르게 위치하도록 수정하여 해결.

3. Fix TypeScript Build Errors (빌드 에러 수정)
   상황: Vercel 배포 과정에서 Supabase Auth 이벤트 핸들러의 매개변수 타입이 명시되지 않아(implicit any) 빌드 실패.
   해결:
   src/app/login/page.tsx, src/lib/auth/AuthContext.tsx, src/app/auth/callback/page.tsx:
   @supabase/supabase-js에서 AuthChangeEvent, Session 타입을 import.
   onAuthStateChange((event: AuthChangeEvent, session: Session | null) => ...) 형태로 타입 명시.

4. Theming Consistency (테마 통일)
   상황: 로그인 페이지 및 메뉴 등에 이전 테마 색상(민트/인디고)이 하드코딩되어 있어 전체적인 디자인 통일성 저해.
   해결:
   src/app/login/page.tsx, src/components/StickyMenu.tsx: 하드코딩된 색상 코드(#4ACAD4 등)를 제거하고 text-primary, btn-primary 등 Tailwind CSS 유틸리티 클래스와 Green 테마 색상으로 변경.
