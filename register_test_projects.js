
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function registerTestProjects() {
  // 1. Get a user ID
  const { data: users, error: userError } = await supabase.from('profiles').select('id').limit(1);
  if (userError || !users.length) {
    console.error('No users found in profiles table');
    return;
  }
  const userId = users[0].id;
  console.log(`Using User ID: ${userId}`);

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 14);

  const projects = [
    {
      title: '🔺 삼각 진단: 심플 기획 아이디어',
      categories: [
        { id: 'c1', label: '아이디어 참신성', desc: '기존에 없던 새로운 방식인가?' },
        { id: 'c2', label: '실현 가능성', desc: '현재 기술로 구현할 수 있는가?' },
        { id: 'c3', label: '시장 니즈', desc: '사람들이 진짜 원하는 서비스인가?' }
      ]
    },
    {
      title: '⬜ 사각 진단: 표준 비즈니스 모델',
      categories: [
        { id: 'c1', label: '수익 모델', desc: '돈을 벌 수 있는 구조인가?' },
        { id: 'c2', label: '운영 효율', desc: '관리가 용이한가?' },
        { id: 'c3', label: '확장성', desc: '더 큰 시장으로 나갈 수 있는가?' },
        { id: 'c4', label: '보안/안정성', desc: '데이터와 서비스가 안전한가?' }
      ]
    },
    {
      title: '⬟ 오각 진단: 종합 크리에이티브 아트',
      categories: [
        { id: 'c1', label: '심미성', desc: '시각적으로 아름다운가?' },
        { id: 'c2', label: '색채 조화', desc: '컬러 팔레트가 어울리는가?' },
        { id: 'c3', label: '구도', desc: '레이아웃 배치가 안정적인가?' },
        { id: 'c4', label: '메시지', desc: '전하고자 하는 바가 뚜렷한가?' },
        { id: 'c5', label: '디테일', desc: '작은 부분까지 신경 썼는가?' }
      ]
    },
    {
      title: '⬢ 육각 진단: 풀스택 마스터피스',
      categories: [
        { id: 'c1', label: '프론트엔드', desc: 'UI/UX가 매끄러운가?' },
        { id: 'c2', label: '백엔드', desc: '서버 로직이 탄탄한가?' },
        { id: 'c3', label: '퍼포먼스', desc: '속도가 빠른가?' },
        { id: 'c4', label: '유지보수', desc: '코드가 깔끔한가?' },
        { id: 'c5', label: '데이터베이스', desc: '스키마 설계가 효율적인가?' },
        { id: 'c6', label: '혁신성', desc: '기술적으로 도전적인가?' }
      ]
    }
  ];

  for (const p of projects) {
    const { data, error } = await supabase.from('Project').insert({
      user_id: userId,
      title: p.title,
      summary: `${p.categories.length}각형 UI 테스트를 위한 프로젝트입니다.`,
      visibility: 'public',
      is_growth_requested: true,
      audit_deadline: deadline.toISOString(),
      custom_data: {
        is_feedback_requested: true,
        audit_config: {
          type: 'link',
          mediaA: 'https://example.com/test',
          categories: p.categories,
          poll: { 
            desc: '현업자 스티커 투표', 
            options: [
              { id: 'v1', label: '대박 보장', desc: '무조건 잘될 것 같아요.', image_url: '/review/a1.jpeg' },
              { id: 'v2', label: '보완 필수', desc: '조금 더 다듬어봐요.', image_url: '/review/a2.jpeg' }
            ]
          },
          questions: ['어떤 점이 가장 인상적이었나요?', '개선할 점 3가지만 꼽는다면?']
        }
      }
    }).select();

    if (error) {
      console.error(`Error inserting ${p.title}:`, error.message);
    } else {
      console.log(`Success: ${p.title} (ID: ${data[0].project_id})`);
    }
  }
}

registerTestProjects();
