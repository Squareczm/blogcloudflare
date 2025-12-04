import { NextRequest, NextResponse } from 'next/server';
import { readFromR2, writeToR2, DATA_KEYS, R2Env } from '@/lib/r2-storage';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  status: 'confirmed' | 'pending';
}

function getEnv(): R2Env | undefined {
  if (typeof process !== 'undefined' && (process.env as any).BLOG_STORAGE) {
    return { BLOG_STORAGE: (process.env as any).BLOG_STORAGE };
  }
  if (typeof (globalThis as any).BLOG_STORAGE !== 'undefined') {
    return { BLOG_STORAGE: (globalThis as any).BLOG_STORAGE };
  }
  return undefined;
}

async function readSubscribers(): Promise<Subscriber[]> {
  const env = getEnv();
  return await readFromR2<Subscriber[]>(DATA_KEYS.SUBSCRIBERS, [], env);
}

async function writeSubscribers(subscribers: Subscriber[]): Promise<void> {
  const env = getEnv();
  await writeToR2(DATA_KEYS.SUBSCRIBERS, subscribers, env);
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const subscribers = await readSubscribers();
    
    // 检查是否已经订阅
    const existingSubscriber = subscribers.find((sub: Subscriber) => sub.email === email);
    if (existingSubscriber) {
      return NextResponse.json(
        { error: '该邮箱已经订阅过了' },
        { status: 400 }
      );
    }

    // 添加新订阅者
    const newSubscriber: Subscriber = {
      id: Date.now().toString(),
      email,
      subscribedAt: new Date().toISOString(),
      status: 'confirmed' // 简化流程，直接设为已确认
    };

    subscribers.push(newSubscriber);
    await writeSubscribers(subscribers);

    // 这里应该发送确认邮件，暂时跳过
    console.log('新订阅者:', newSubscriber);

    return NextResponse.json(
      { message: '订阅成功！感谢您的关注' },
      { status: 200 }
    );
  } catch (error) {
    console.error('订阅错误:', error);
    return NextResponse.json(
      { error: '订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const subscribers = await readSubscribers();
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error('获取订阅者失败:', error);
    return NextResponse.json(
      { error: '获取订阅者失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少订阅者ID' },
        { status: 400 }
      );
    }

    const subscribers = await readSubscribers();
    const subscriberIndex = subscribers.findIndex((sub: Subscriber) => sub.id === id);
    if (subscriberIndex === -1) {
      return NextResponse.json(
        { error: '订阅者不存在' },
        { status: 404 }
      );
    }

    subscribers.splice(subscriberIndex, 1);
    await writeSubscribers(subscribers);

    console.log('订阅者已删除:', id);

    return NextResponse.json(
      { message: '订阅者删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除订阅者失败:', error);
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    );
  }
}