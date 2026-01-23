# 세션 로그: CSR/SSR 인증 시스템 수정

## Goal

관리자 로그인 시 관리자 메뉴가 표시되지 않는 문제 해결 및 CSR/SSR 호환성 개선

## Timeline

### 09:27 - 세션 시작

- 실시간 기록 모드 활성화

### 09:57 - 문제 보고

- **증상**: 관리자로 로그인해도 드롭다운 메뉴에 "관리자 페이지" 메뉴가 표시되지 않음
- **추정 원인**: "오늘 하루 보지 않기" 모달 클릭 후 발생, CSR/SSR 설정 문제 (무한 로딩)

### 09:58 - 코드 분석

- `AuthButtons.tsx` - 관리자 메뉴 표시 로직 확인
- `AuthContext.tsx` - 인증 상태 관리 및 `isAdmin` 설정 로직 확인
- `PopupModal.tsx` - localStorage 접근 로직 확인

### 09:59 - 문제점 발견

1. **하이드레이션 불일치**: SSR에서 `localStorage` 접근 시도로 서버/클라이언트 렌더링 결과 불일치
2. **Race Condition**: `loadUserProfile` 비동기 완료 전 `isAdmin`이 `false`로 설정됨
3. **localStorage SSR 오류**: `PopupModal`에서 마운트 전 `localStorage` 접근

### 10:00 - 수정 적용

#### 1. `src/lib/auth/AuthContext.tsx` (핵심 변경)

- `useIsMounted` 훅 추가: 클라이언트 마운트 상태 추적
- `loadUserProfile` 완료 후 `isAdmin` 동기화
- `initializationRef`로 초기화 중복 실행 방지 (React StrictMode 대응)
- `localStorage` 접근 전 `typeof window !== 'undefined'` 체크 추가

#### 2. `src/components/AuthButtons.tsx`

- `mounted` 상태 추가: 클라이언트 렌더링 완료 확인
- 스켈레톤 표시 조건 개선: `!mounted || loading`

#### 3. `src/components/PopupModal.tsx`

- `mounted` 상태 추가: `localStorage` 접근 전 클라이언트 확인

#### 4. `src/app/admin/page.tsx`

- `localStorage` 접근을 `try-catch`로 감싸고 SSR 안전하게 처리

### 10:02 - 빌드 테스트

- `npm run build` 성공 (Exit code: 0)
- 모든 페이지 정상 빌드 확인

### 10:04 - 테스트 완료

- 관리자 로그인 후 드롭다운 메뉴에 "관리자 페이지" 정상 표시 확인

## Insight

### CSR/SSR 안전한 코드 작성 팁

1. **`localStorage` 접근 전 항상 마운트 상태 확인**

   ```tsx
   const [mounted, setMounted] = useState(false);
   useEffect(() => {
     setMounted(true);
   }, []);

   // 사용 시
   if (mounted) {
     localStorage.getItem("key");
   }
   ```

2. **비동기 상태 업데이트 동기화**

   - 여러 상태를 함께 업데이트해야 할 때 `updateAuthState` 같은 래퍼 함수 사용

3. **로딩 상태에 마운트 포함**

   ```tsx
   loading: !isMounted || loading;
   ```

4. **React StrictMode 대응**
   - `useRef`로 초기화 중복 실행 방지
   ```tsx
   const initRef = useRef(false);
   useEffect(() => {
     if (initRef.current) return;
     initRef.current = true;
     // 초기화 로직
   }, []);
   ```

## 수정된 파일 목록

- `src/lib/auth/AuthContext.tsx`
- `src/components/AuthButtons.tsx`
- `src/components/PopupModal.tsx`
- `src/app/admin/page.tsx`
