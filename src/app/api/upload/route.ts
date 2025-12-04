import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2, R2Env } from '@/lib/r2-storage';

// 获取 Cloudflare 环境变量
function getEnv(): R2Env | undefined {
  if (typeof process !== 'undefined' && (process.env as any).BLOG_STORAGE) {
    return {
      BLOG_STORAGE: (process.env as any).BLOG_STORAGE,
    };
  }
  if (typeof (globalThis as any).BLOG_STORAGE !== 'undefined') {
    return {
      BLOG_STORAGE: (globalThis as any).BLOG_STORAGE,
    };
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型，请上传图片文件 (JPEG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    // 检查文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件太大，请上传小于5MB的图片' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    // 上传到 R2（或回退到文件系统）
    const env = getEnv();
    const fileUrl = await uploadFileToR2(fileName, file, env);
    
    console.log('文件上传成功:', fileUrl);
    
    return NextResponse.json(
      { 
        message: '文件上传成功',
        url: fileUrl,
        fileName: fileName
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}