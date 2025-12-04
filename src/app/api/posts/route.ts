import { NextRequest, NextResponse } from 'next/server';
import { readFromR2, writeToR2, DATA_KEYS, R2Env } from '@/lib/r2-storage';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: 'ai' | 'nova' | 'life';
  status: 'draft' | 'published';
  publishedAt: string | null;
  slug: string;
  featuredImage: string;
  tags: string[];
  readingTime: number;
}

// 获取 Cloudflare 环境变量
function getEnv(): R2Env | undefined {
  // 在 Cloudflare Pages 中，env 通过 process.env 或全局变量访问
  // 这里使用类型断言，实际运行时 Cloudflare 会注入
  if (typeof process !== 'undefined' && (process.env as any).BLOG_STORAGE) {
    return {
      BLOG_STORAGE: (process.env as any).BLOG_STORAGE,
    };
  }
  // 尝试从全局变量获取（Cloudflare Pages 运行时）
  if (typeof (globalThis as any).BLOG_STORAGE !== 'undefined') {
    return {
      BLOG_STORAGE: (globalThis as any).BLOG_STORAGE,
    };
  }
  return undefined;
}

// 读取文章数据
async function readPosts(): Promise<Post[]> {
  const env = getEnv();
  return await readFromR2<Post[]>(DATA_KEYS.POSTS, [], env);
}

// 写入文章数据
async function writePosts(posts: Post[]): Promise<void> {
  const env = getEnv();
  await writeToR2(DATA_KEYS.POSTS, posts, env);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const limit = searchParams.get('limit');

  let filteredPosts = await readPosts();

  // 按slug查找单个文章
  if (slug) {
    const post = filteredPosts.find(p => p.slug === slug);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  // 按分类筛选
  if (category) {
    filteredPosts = filteredPosts.filter(p => p.category === category);
  }

  // 按状态筛选
  if (status) {
    filteredPosts = filteredPosts.filter(p => p.status === status);
  }

  // 按发布时间倒序排列
  filteredPosts.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // 限制数量
  if (limit) {
    filteredPosts = filteredPosts.slice(0, parseInt(limit));
  }

  return NextResponse.json({ posts: filteredPosts });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const newPost: Post = {
      id: Date.now().toString(),
      title: data.title || '无标题',
      content: data.content || '',
      excerpt: data.excerpt || '',
      category: data.category || 'ai',
      status: data.status || 'draft',
      publishedAt: data.status === 'published' ? new Date().toISOString() : null,
      slug: generateSlug(data.title || '无标题'),
      featuredImage: data.coverImage || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      tags: data.tags || [],
      readingTime: Math.ceil((data.content || '').length / 500)
    };

    const posts = await readPosts();
    posts.push(newPost);
    await writePosts(posts);

    console.log('新文章已创建:', newPost);

    return NextResponse.json(
      { message: '文章创建成功', post: newPost },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建文章错误:', error);
    return NextResponse.json(
      { error: '创建文章失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const posts = await readPosts();
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    posts[postIndex] = {
      ...posts[postIndex],
      ...updateData,
      publishedAt: updateData.status === 'published' && !posts[postIndex].publishedAt 
        ? new Date().toISOString() 
        : posts[postIndex].publishedAt
    };

    await writePosts(posts);
    console.log('文章已更新:', posts[postIndex]);

    return NextResponse.json(
      { message: '文章更新成功', post: posts[postIndex] },
      { status: 200 }
    );
  } catch (error) {
    console.error('更新文章错误:', error);
    return NextResponse.json(
      { error: '更新文章失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
    }

    const posts = await readPosts();
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const deletedPost = posts.splice(postIndex, 1)[0];
    await writePosts(posts);

    console.log('文章已删除:', deletedPost);

    return NextResponse.json(
      { message: '文章删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除文章错误:', error);
    return NextResponse.json(
      { error: '删除文章失败' },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}