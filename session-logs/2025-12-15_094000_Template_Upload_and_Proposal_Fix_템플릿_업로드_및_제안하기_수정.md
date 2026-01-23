# Log: Template*Upload_and_Proposal_Fix (템플릿*업로드*및*제안하기\_수정)

- Original Date: 2025-12-15 09:40:00 (KST)
- Key Goal: 템플릿 페이지 구축, 제안하기 기능 DB 스키마 수정, 크리에이터 페이지 DB 연동 및 팔로우 기능 고도화

## 📝 상세 작업 일지 (Chronological)

### 1. 템플릿 이미지 업로드 및 페이지 구현

- **상황**: 템플릿 이미지가 로컬에 없고, 페이지가 구현되지 않음.
- **해결**:
  - **파일 업로드**: `public/templates/` 경로에 16개의 템플릿 이미지 파일(sweetspot.png, codeacademy.png 등) 복사 및 업로드.
  - **페이지 구현**: `src/app/templates/page.tsx` 생성. 로컬 이미지를 참조하는 정적 데이터 배열(`TEMPLATES`)을 정의하고, 카테고리 필터링(전체, 랜딩페이지, 이커머스 등) 및 검색 기능을 구현함.

### 2. 제안하기(Proposal) 기능 디버깅 및 DB 수정

- **상황**: 제안하기 모달에서 전송 시 500 에러 및 DB 컬럼 누락 에러 발생.
- **해결**:
  - **UI 수정**: `src/components/ProposalModal.tsx`에서 에러 발생 시 상세 메시지(`data.error`, `data.details`)를 alert로 출력하도록 수정하여 디버깅 용이성 확보.
  - **DB 스키마 수정 (Supabase SQL)**:
    - `Proposal` 테이블에 누락된 `contact`, `sender_id`, `receiver_id`, `project_id` 컬럼 추가.
    - `user_id` 컬럼의 NOT NULL 제약 조건으로 인한 에러 해결 (API 로직에 맞춰 컬럼 속성 조정).

### 3. 팔로우/언팔로우 UI 및 기능 고도화

- **상황**: 프로젝트 상세 모달에서 팔로우 버튼이 동작하나, 팔로워 수가 표시되지 않고 토글 시 카운트가 즉시 반영되지 않음.
- **해결**:
  - **API 확인**: `src/app/api/follows/route.ts`의 로직 확인 (이미 구현됨).
  - **UI/Logic 수정 (`src/components/ProjectDetailModalV2.tsx`)**:
    - `followersCount` 상태 변수 추가.
    - 모달 진입 시 `follows` API를 호출하여 팔로워 수 가져오기.
    - `handleFollow` 함수에서 성공 시 `followersCount`를 +/- 1 하여 즉각적인 UI 피드백 제공.
    - 버튼 하단에 팔로워 수 텍스트 표시 추가.

### 4. 크리에이터 프로필 페이지 DB 연동

- **상황**: `/creator/[username]` 페이지가 localStorage의 더미 데이터를 사용하고 있어 실제 사용자와 프로젝트가 연동되지 않음. TypeScript 타입 에러 다수 발생.
- **해결**:
  - **로직 전면 수정 (`src/app/creator/[username]/page.tsx`)**:
    - Supabase `users` 테이블에서 `username` 또는 `nickname`으로 사용자 조회.
    - `Project` 테이블에서 해당 사용자의 프로젝트 목록 조회 (User 정보 조인).
    - 팔로워 수 조회 및 현재 로그인한 사용자의 팔로우 여부 확인 로직 추가.
  - **TypeScript 수정**: Supabase 쿼리 결과에 대한 타입 불일치 문제를 해결하기 위해 `as { data: any; error: any }` 캐스팅 적용.

### 5. 프로젝트 삭제 기능 수정 (My Project)

- **상황**: 내 프로젝트 페이지에서 삭제 시도 시 `is_deleted` 컬럼 부재로 인한 에러 가능성 확인.
- **해결**:
  - **API 수정 (`src/app/api/projects/[id]/route.ts`)**: `is_deleted = true` 처리하는 Soft Delete 방식을 `delete()`를 호출하는 Hard Delete 방식으로 변경하여 데이터 완전 삭제 처리.
