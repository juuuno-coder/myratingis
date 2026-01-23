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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
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
    let ogImage = $('meta[property="og:image"]').attr('content');

    // 상대 경로 이미지 처리
    if (ogImage && !ogImage.startsWith('http')) {
      const baseUrl = new URL(url);
      if (ogImage.startsWith('//')) {
         ogImage = `${baseUrl.protocol}${ogImage}`;
      } else if (ogImage.startsWith('/')) {
         ogImage = `${baseUrl.origin}${ogImage}`;
      } else {
         ogImage = `${baseUrl.origin}/${ogImage}`;
      }
    }

    return NextResponse.json({
      title: ogTitle || '링크 미리보기',
      description: ogDescription || '',
      image: ogImage || null,
    });
  } catch (error: any) {
    console.error('OG Preview Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
