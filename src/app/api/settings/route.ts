import { NextRequest, NextResponse } from 'next/server';
import { readFromR2, writeToR2, DATA_KEYS, R2Env } from '@/lib/r2-storage';

interface SiteSettings {
  title: string;
  subtitle: string;
  titleAlign: string;
  subtitleAlign: string;
  copyright: string;
  aboutText: string;
  bannerImage: string;
  wechatQRCode: string;
  coffeeQRCode: string;
}

const defaultSettings: SiteSettings = {
  title: 'AInovalife',
  subtitle: '在代码与山水间，寻找内心的宁静与成长',
  titleAlign: 'center',
  subtitleAlign: 'center',
  copyright: 'Copyright © 2025 AInovalife. All rights reserved.',
  aboutText: '一个融合科技洞察、个人成长与生活美学的个人博客空间。在这里，科技与人文交织，理性与感性共存。',
  bannerImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  wechatQRCode: '',
  coffeeQRCode: ''
};

function getEnv(): R2Env | undefined {
  if (typeof process !== 'undefined' && (process.env as any).BLOG_STORAGE) {
    return { BLOG_STORAGE: (process.env as any).BLOG_STORAGE };
  }
  if (typeof (globalThis as any).BLOG_STORAGE !== 'undefined') {
    return { BLOG_STORAGE: (globalThis as any).BLOG_STORAGE };
  }
  return undefined;
}

async function readSettings(): Promise<SiteSettings> {
  const env = getEnv();
  return await readFromR2<SiteSettings>(DATA_KEYS.SETTINGS, defaultSettings, env);
}

async function writeSettings(settings: SiteSettings): Promise<void> {
  const env = getEnv();
  await writeToR2(DATA_KEYS.SETTINGS, settings, env);
}

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json(
      { error: '获取设置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newSettings = await request.json() as Partial<SiteSettings>;
    const currentSettings = await readSettings();
    
    // 更新设置
    const updatedSettings = { ...currentSettings, ...newSettings };
    await writeSettings(updatedSettings);
    
    console.log('站点设置已更新:', updatedSettings);
    
    return NextResponse.json(
      { message: '设置已保存', settings: updatedSettings },
      { status: 200 }
    );
  } catch (error) {
    console.error('保存设置错误:', error);
    return NextResponse.json(
      { error: '保存失败，请稍后重试' },
      { status: 500 }
    );
  }
}