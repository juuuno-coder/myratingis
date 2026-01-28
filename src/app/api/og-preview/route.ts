import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

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

    // Use microlink for reliable preview and screenshot
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=true&embed=screenshot.url`;
    
    const response = await fetch(microlinkUrl);
    const data = await response.json();

    if (data.status === 'success') {
       return NextResponse.json({
         title: data.data.title,
         description: data.data.description,
         // Use screenshot or fallback to image
         image: data.data.screenshot?.url || data.data.image?.url
       });
    } else {
       // Fallback for fail
       return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('OG Preview Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
