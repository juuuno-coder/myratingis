/**
 * Centralized Constants for Vibefolio
 */

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibefolio.net';

export const CATEGORY_IDS = {
  PHOTO: 1,
  ANIMATION: 2,
  DESIGN: 3,
  VIDEO: 4,
  ENTERTAINMENT: 5,
  CONSTRUCTION: 6,
  WRITING: 7,
  DEVELOPMENT: 8,
  GAME: 9,
} as const;

export const GENRE_TO_CATEGORY_ID: Record<string, number> = {
  photo: 1,
  animation: 2,
  design: 3,
  video: 4,
  entertainment: 5,
  construction: 6,
  writing: 7,
  development: 8,
  game: 9,
};

export const CONTACT_EMAIL = 'support@vibefolio.com';
export const SOCIAL_LINKS = {
  INSTAGRAM: 'https://instagram.com/vibefolio',
  FACEBOOK: 'https://facebook.com/vibefolio',
  THREADS: 'https://www.threads.net/@vibefolio',
  YOUTUBE: 'https://youtube.com/vibefolio',
};

export const GENRE_CATEGORIES = [
  { id: "photo", label: "포토" },
  { id: "animation", label: "웹툰/애니" },
  { id: "design", label: "그래픽/디자인" },
  { id: "video", label: "영상/영화" },
  { id: "entertainment", label: "엔터테인먼트" },
  { id: "construction", label: "토목/건설/건축" },
  { id: "writing", label: "작가/서적" },
  { id: "development", label: "개발/웹/앱" },
  { id: "game", label: "게임" },
];

export const FIELD_CATEGORIES = [
  { id: "law", label: "법률" },
  { id: "administration", label: "행정/공공" },
  { id: "startup", label: "창업/스타트업" },
  { id: "healthcare", label: "헬스케어" },
  { id: "beauty", label: "뷰티/패션" },
  { id: "pet", label: "반려" },
  { id: "fnb", label: "F&B" },
  { id: "travel", label: "여행/레저" },
  { id: "education", label: "교육" },
  { id: "it", label: "IT" },
  { id: "lifestyle", label: "라이프스타일" },
  { id: "business", label: "비즈니스" },
  { id: "marketing", label: "마케팅" },
  { id: "art", label: "문화/예술" },
  { id: "other", label: "기타" },
];
