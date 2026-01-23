Log: Social*Login_Fix_and_Admin_Banners (소셜로그인*포트수정*및*배너관리\_구현)
Original Date: 2025-12-16 20:54:00
Key Goal: 소셜 로그인(구글/카카오) 연동 흐름 제어, 서버 포트 설정 표준화(3000), 마이페이지 프로필 DB 연동, 관리자 배너 관리 기능(Drag&Drop) 고도화

📝 상세 작업 일지 (Chronological)

1. 로그인/회원가입 페이지 리팩토링 및 소셜 로그인 제어
   상황: 로그인 페이지에 중복된 핸들러가 존재하고, 카카오 로그인 시 이메일 권한 문제 및 버튼 텍스트 불일치 발생.
   해결:

- src/app/login/page.tsx: 불필요한 Signup 핸들러 제거, 버튼 텍스트 '로그인'으로 통일.
- src/app/signup/page.tsx: 카카오/네이버 버튼 교체 및 제거 작업 반복(최종적으로 구글만 유지).
- 로그인 성공 감지: AuthButtons 외에도 페이지 레벨에서 onAuthStateChange를 감지하여 로그인 성공 시 즉시 메인('/')으로 리다이렉트하는 Fail-safe 로직 추가.

2. 카카오 -> 네이버 -> 구글 단일화 과정
   상황: 카카오 로그인 설정(이메일 동의)이 복잡하고, 네이버 로그인을 요청했으나 Supabase 미지원 확인.
   해결:

- 카카오 로그인 시도: Supabase 설정(Enable Kakao, Allow users without email) 및 카카오 개발자 센터(이메일 선택 동의) 가이드 제공.
- 네이버 로그인 시도: 코드 구현했으나 Supabase Native Provider 미지원으로 롤백.
- 최종 결정: 복잡성을 줄이기 위해 카카오/네이버 버튼을 숨기고 구글 로그인만 남김.

3. 개발 서버 포트 표준화 (Connection Refused 해결)
   상황: 구글 로그인 콜백 URL은 localhost:3000이나, Next.js가 4000번 포트로 실행되어 로그인 후 접속 거부 에러 발생.
   해결:

- package.json: "dev": "next dev -p 4000" → "next dev" (기본 3000번)으로 변경.
- 사용자에게 터미널 재시작(Ctrl+C -> npm run dev) 강력 권고.

4. 마이페이지 프로필 연동 ("사용자" 닉네임 문제)
   상황: 마이페이지 접속 시 닉네임이 실제 DB 정보가 아닌 기본값("사용자")으로 표시됨.
   해결:

- src/app/mypage/page.tsx: supabase.auth.getUser()의 메타데이터에만 의존하던 로직을 수정. user.id를 이용해 public.users 테이블을 직접 조회(select)하여 최신 닉네임과 프로필 이미지를 바인딩하도록 변경.

5. 관리자 배너 관리 기능 고도화
   상황: 배너 관리 페이지의 드래그 앤 드롭 영역이 클릭되지 않아 파일 선택이 불편하고, DB 테이블이 부재함.
   해결:

- DB: supabase/CREATE_BANNER_TABLE.sql 작성 (Banner 테이블 생성 및 RLS 정책).
- src/app/admin/banners/page.tsx:
  - useRef를 도입하여 커스텀 UI(div) 클릭 시 hidden input이 트리거되도록 수정.
  - 드래그 앤 드롭 이벤트 핸들러(stopPropagation) 보완.
  - 이미지 미리보기 및 삭제(X) 버튼 UI 개선.
- SETUP_GUIDE.md: 배너 관리 시스템 설정을 위한 SQL 실행 및 Storage 버킷 생성 가이드 추가.

6. 관리자 권한 및 DB 동기화
   상황: 관리자 페이지 접근 시 권한 에러 가능성.
   해결: user role이 'admin'이어야 함을 안내하고, SQL 스크립트 실행 결과(Policy already exists)는 정상임을 확인해줌.
