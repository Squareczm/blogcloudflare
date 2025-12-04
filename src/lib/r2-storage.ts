/**
 * R2 存储适配器
 * 用于替代文件系统存储，支持 Cloudflare R2
 */

// R2 环境类型定义
export interface R2Env {
  BLOG_STORAGE: R2Bucket;
}

// 数据文件键名
export const DATA_KEYS = {
  ABOUT: 'about.json',
  POSTS: 'posts.json',
  ADMIN: 'admin.json',
  SUBSCRIBERS: 'subscribers.json',
  CONTACTS: 'contacts.json',
  MESSAGES: 'messages.json',
  SETTINGS: 'settings.json',
} as const;

/**
 * 从 R2 读取 JSON 数据
 */
export async function readFromR2<T>(
  key: string,
  defaultValue: T,
  env?: R2Env
): Promise<T> {
  try {
    // 如果 env 不存在（本地开发），回退到文件系统
    if (!env?.BLOG_STORAGE) {
      return await readFromFileSystem(key, defaultValue);
    }

    const object = await env.BLOG_STORAGE.get(key);
    
    if (!object) {
      // 如果不存在，创建默认值
      await writeToR2(key, defaultValue, env);
      return defaultValue;
    }

    const text = await object.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(`从 R2 读取 ${key} 失败:`, error);
    // 如果 R2 失败，尝试从文件系统读取（开发环境）
    return await readFromFileSystem(key, defaultValue);
  }
}

/**
 * 写入 JSON 数据到 R2
 */
export async function writeToR2<T>(
  key: string,
  data: T,
  env?: R2Env
): Promise<void> {
  try {
    // 如果 env 不存在（本地开发），回退到文件系统
    if (!env?.BLOG_STORAGE) {
      return await writeToFileSystem(key, data);
    }

    const jsonString = JSON.stringify(data, null, 2);
    await env.BLOG_STORAGE.put(key, jsonString, {
      httpMetadata: {
        contentType: 'application/json',
      },
    });

    console.log(`数据已保存到 R2: ${key}`);
  } catch (error) {
    console.error(`写入 R2 ${key} 失败:`, error);
    // 如果 R2 失败，尝试写入文件系统（开发环境）
    await writeToFileSystem(key, data);
  }
}

/**
 * 从 R2 删除数据
 */
export async function deleteFromR2(
  key: string,
  env?: R2Env
): Promise<void> {
  try {
    if (!env?.BLOG_STORAGE) {
      // 本地开发环境，删除文件
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'data', key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    await env.BLOG_STORAGE.delete(key);
    console.log(`已从 R2 删除: ${key}`);
  } catch (error) {
    console.error(`从 R2 删除 ${key} 失败:`, error);
  }
}

/**
 * 上传文件到 R2
 */
export async function uploadFileToR2(
  fileName: string,
  file: File | Buffer,
  env?: R2Env
): Promise<string> {
  try {
    if (!env?.BLOG_STORAGE) {
      // 本地开发环境，保存到文件系统
      return await uploadToFileSystem(fileName, file);
    }

    const buffer = file instanceof File 
      ? Buffer.from(await file.arrayBuffer())
      : file;

    await env.BLOG_STORAGE.put(`uploads/${fileName}`, buffer, {
      httpMetadata: {
        contentType: file instanceof File ? file.type : 'application/octet-stream',
      },
    });

    // 返回公开访问 URL（需要配置 R2 公共访问或使用自定义域名）
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error(`上传文件到 R2 失败:`, error);
    // 回退到文件系统
    return await uploadToFileSystem(fileName, file);
  }
}

/**
 * 从 R2 获取文件
 */
export async function getFileFromR2(
  fileName: string,
  env?: R2Env
): Promise<{ body: ReadableStream; contentType: string } | null> {
  try {
    if (!env?.BLOG_STORAGE) {
      // 本地开发环境，从文件系统读取
      return await getFileFromFileSystem(fileName);
    }

    const object = await env.BLOG_STORAGE.get(`uploads/${fileName}`);
    
    if (!object) {
      return null;
    }

    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    
    return {
      body: object.body,
      contentType,
    };
  } catch (error) {
    console.error(`从 R2 获取文件失败:`, error);
    return await getFileFromFileSystem(fileName);
  }
}

// ========== 文件系统回退函数（用于本地开发） ==========

async function readFromFileSystem<T>(key: string, defaultValue: T): Promise<T> {
  const fs = await import('fs');
  const path = await import('path');
  const filePath = path.join(process.cwd(), 'data', key);
  
  if (!fs.existsSync(filePath)) {
    await writeToFileSystem(key, defaultValue);
    return defaultValue;
  }
  
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

async function writeToFileSystem<T>(key: string, data: T): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, key);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function uploadToFileSystem(
  fileName: string,
  file: File | Buffer
): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, fileName);
  const buffer = file instanceof File 
    ? Buffer.from(await file.arrayBuffer())
    : file;
  
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${fileName}`;
}

async function getFileFromFileSystem(
  fileName: string
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const fs = await import('fs');
  const path = await import('path');
  const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(fileName).toLowerCase();
  
  const contentTypeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  
  const contentType = contentTypeMap[ext] || 'application/octet-stream';
  
  return {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    }),
    contentType,
  };
}

