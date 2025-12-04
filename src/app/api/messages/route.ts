import { NextRequest, NextResponse } from 'next/server';
import { readFromR2, writeToR2, DATA_KEYS, R2Env } from '@/lib/r2-storage';

interface Message {
  id: string;
  email: string;
  content: string;
  receivedAt: string;
  status: 'unread' | 'read';
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

async function readMessages(): Promise<Message[]> {
  const env = getEnv();
  return await readFromR2<Message[]>(DATA_KEYS.MESSAGES, [], env);
}

async function writeMessages(messages: Message[]): Promise<void> {
  const env = getEnv();
  await writeToR2(DATA_KEYS.MESSAGES, messages, env);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as { email?: string; content?: string };
    const { email, content } = data;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: '留言内容至少需要10个字符' },
        { status: 400 }
      );
    }

    // 添加新留言
    const newMessage: Message = {
      id: Date.now().toString(),
      email,
      content: content.trim(),
      receivedAt: new Date().toISOString(),
      status: 'unread'
    };

    const messages = await readMessages();
    messages.push(newMessage);
    await writeMessages(messages);

    console.log('新留言:', newMessage);

    return NextResponse.json(
      { message: '留言已收到，感谢您的反馈！' },
      { status: 200 }
    );
  } catch (error) {
    console.error('留言错误:', error);
    return NextResponse.json(
      { error: '留言失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const messages = await readMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('获取留言失败:', error);
    return NextResponse.json(
      { error: '获取留言失败' },
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
        { error: '缺少消息ID' },
        { status: 400 }
      );
    }

    const messages = await readMessages();
    const messageIndex = messages.findIndex((msg: Message) => msg.id === id);
    if (messageIndex === -1) {
      return NextResponse.json(
        { error: '消息不存在' },
        { status: 404 }
      );
    }

    messages.splice(messageIndex, 1);
    await writeMessages(messages);

    console.log('消息已删除:', id);

    return NextResponse.json(
      { message: '消息删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除消息失败:', error);
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    );
  }
}