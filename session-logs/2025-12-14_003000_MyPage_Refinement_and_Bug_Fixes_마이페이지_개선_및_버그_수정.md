Log: MyPage*Refinement_and_Bug_Fixes (마이페이지*개선*및*버그\_수정)
Original Date: 2025-12-14 00:30:00
Key Goal: 마이페이지 기능 고도화(제안/댓글 카드), 프로젝트 삭제 오류 수정, TypeScript 및 빌드 에러 해결

📝 상세 작업 일지 (Chronological)

1. Core Improvements (기반 개선)
   상황: 전반적인 사용자 경험 및 에러 처리 부족
   해결:

- src/components/Skeleton.tsx: 로딩 상태를 위한 스켈레톤 UI 추가
- src/components/ErrorBoundary.tsx: 런타임 에러 방어 및 폴백 UI 구현
- src/components/Toast.tsx: 사용자 알림 시스템 구현
- src/components/OptimizedImage.tsx, src/lib/cache.ts: 성능 최적화 유틸리티 추가

2. MyPage Refactoring (마이페이지 구조 개선)
   상황: 1:1 문의와 제안하기 기능의 중복, UI/UX 비효율성
   해결:

- src/app/mypage/page.tsx:
  - '1:1 문의(inquiries)' 탭을 제거하고 '제안하기(proposals)'로 통합 (받은 제안 위주)
  - 탭 UI 버튼 및 빈 상태(Empty State) 메시지에서 inquiries 참조 완전 제거
  - 통계(Stats) 로직에 proposals 카운트 추가 (TypeScript 에러 수정)
  - 데이터 매핑 로직 수정: 프로젝트/좋아요는 ImageCard, 나머지는 자체 구조 유지

3. Feature Enhancement (기능 고도화)
   상황: 제안 및 댓글 목록이 단순 텍스트로만 표시됨
   해결:

- src/components/ProposalCard.tsx: 제안 상태(수락/거절/대기) 및 송수신자 정보를 포함한 카드 컴포넌트 생성
- src/components/CommentCard.tsx: 프로젝트 썸네일과 링크를 포함한 댓글 카드 컴포넌트 생성
- src/app/mypage/page.tsx: 위 컴포넌트들을 적용하여 그리드 레이아웃 구현

4. Bug Fixes (버그 수정)
   상황: 프로젝트 삭제 실패 (401 Error), JSX 구문 오류로 인한 빌드 실패
   해결:

- src/app/mypage/projects/page.tsx: DELETE 요청 시 Authorization 헤더에 Access Token 추가 및 상세 로깅 구현
- src/app/mypage/page.tsx: 누락된 JSX 닫는 태그(Fragment) 추가로 빌드 오류 해결
- TypeScript 타입 에러 수정: setStats 호출 시 proposals 속성 누락 문제 해결

---
