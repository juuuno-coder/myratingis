import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // 웹페이지 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyRatingIs/1.0; +https://myratingis.vercel.app)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Open Graph 메타 태그 추출
    const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
    const ogDescription = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');

    return NextResponse.json({
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
    });
  } catch (error: any) {
    console.error('OG Preview Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
