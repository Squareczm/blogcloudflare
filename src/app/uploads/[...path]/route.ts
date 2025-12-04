import { NextRequest, NextResponse } from 'next/server';
import { getFileFromR2, R2Env } from '@/lib/r2-storage';

function getEnv(): R2Env | undefined {
  if (typeof process !== 'undefined' && (process.env as any).BLOG_STORAGE) {
    return { BLOG_STORAGE: (process.env as any).BLOG_STORAGE };
  }
  if (typeof (globalThis as any).BLOG_STORAGE !== 'undefined') {
    return { BLOG_STORAGE: (globalThis as any).BLOG_STORAGE };
  }
  return undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const fileName = resolvedParams.path[resolvedParams.path.length - 1];
    
    const env = getEnv();
    const fileData = await getFileFromR2(fileName, env);
    
    if (!fileData) {
      return new NextResponse('File not found', { status: 404 });
    }

    // 将 ReadableStream 转换为 Response
    return new NextResponse(fileData.body, {
      headers: {
        'Content-Type': fileData.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving uploaded file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}