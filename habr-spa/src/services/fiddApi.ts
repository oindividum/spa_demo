import { MessagesApi, Configuration } from '../api';
import { DownloadApi } from '../api/apis/DownloadApi';
import type { Post } from '../types/Post';
const BASE_URL = ''; 
const restConfig = new Configuration({ 
  basePath: '/api/v1',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});
const downloadConfig = new Configuration({ 
  basePath: '/fidds/v1',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});
const messagesApi = new MessagesApi(restConfig);
const downloadApi = new DownloadApi(downloadConfig);

function getLogicalFilePath(file: any): string | undefined {
  if (!file) {
    return undefined;
  }
  return file.filePath ?? file.metadata?.filePath;
}

export async function getActiveFiddIds(): Promise<string[]> {
  try {
    const response = await fetch('/instances');
    if (!response.ok) {
      throw new Error('Failed to fetch instances');
    }
    const ids = await response.json();
    return ids;
  } catch {
    return [];
  }
}
// функция для получения постов и находит нужные типы
export async function getPostsForFidd(fiddId: string, count: number = 10): Promise<Post[]> {
  try {
    const messageNumbers = await messagesApi.getMessageNumbersTail({ fiddId, count });
    
    
    
    // console.log(`[getPostsForFidd] fiddId=${fiddId}, messageNumbers=`, messageNumbers);
    const posts: Post[] = [];
    for (const messageNumber of messageNumbers) {
      try {
        // Single merged call instead of separate /logical-files + /metadata requests
        const messageInfo = await messagesApi.getMessageInfo({ fiddId, messageNumber });
        const logicalFiles = messageInfo.logicalFiles;
        const metadata = messageInfo.metadata;

        // console.log(`[getPostsForFidd] logicalFiles for ${messageNumber}:`, logicalFiles.map(f => f.filePath));
        const configFile = logicalFiles.find(f => {
          const path = getLogicalFilePath(f)?.toLowerCase() || '';
          return path === 'config.json' || path === '/config.json' || path.endsWith('/config.json');
        });
        let postConfig: any = {};

        const configPath = getLogicalFilePath(configFile);
        if (configPath) {

          try {


            const configBlob = await downloadApi.readLogicalFile({
              fiddId,

              messageNumber,
              logicalFilePath: configPath
            });
            const configText = await configBlob.text();
            postConfig = JSON.parse(configText);
          } catch (configErr) {
            console.warn(`[getPostsForFidd] Invalid config.json in message ${messageNumber}:`, configErr);
          }
        }

        const files = logicalFiles
          .map(f => getLogicalFilePath(f))
          .filter((filePath: unknown): filePath is string => typeof filePath === 'string' && filePath.length > 0);
        const postFileName = typeof postConfig.post === 'string' ? postConfig.post : 'README.md';
        const actualPostFile = logicalFiles.find(f => 
          getLogicalFilePath(f)?.toLowerCase() === postFileName.toLowerCase() || getLogicalFilePath(f)?.toLowerCase() === 'post.md'
        );
        const fallbackMarkdownFile = logicalFiles.find(f => {
          const path = (getLogicalFilePath(f) || '').toLowerCase();
          return path.endsWith('.md') || path.endsWith('.markdown');
        });
        const postFilePath = getLogicalFilePath(actualPostFile) || getLogicalFilePath(fallbackMarkdownFile);
        let content = '';
        if (postFilePath) {
          try {
            const contentBlob = await downloadApi.readLogicalFile({
              fiddId,
              messageNumber,
              logicalFilePath: postFilePath
            });
            content = await contentBlob.text();
          } catch (contentErr) {
            console.warn(`[getPostsForFidd] Post content unavailable for ${fiddId}/${messageNumber}:`, contentErr);
          }
        }
        const createdAtDate = metadata?.messageCreationTime
          ? new Date(metadata.messageCreationTime).toLocaleDateString('ru-RU')
          : 'unknown';
        const author = metadata?.authorsPublicKey
          ? metadata.authorsPublicKey.slice(0, 8) + '...'
          : 'unknown';

        const firstNonEmptyLine = content
          .split('\n')
          .map(line => line.trim())
          .find(line => line.length > 0 && !line.startsWith('#'));

        const title = typeof postConfig.title === 'string' && postConfig.title.trim().length > 0
          ? postConfig.title
          : (firstNonEmptyLine || `Post ${messageNumber}`);

        let summaryText = '';
        if (typeof postConfig.description === 'string' && postConfig.description.trim().length > 0) {
          summaryText = postConfig.description.trim();
        } else {
          const cleanContent = content
            .replace(/[#*`_>]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\n+/g, ' ')
            .trim();
          if (cleanContent.length > 0) {
            summaryText = cleanContent.slice(0, 200) + (cleanContent.length > 200 ? '...' : '');
          } else {
            summaryText = `Файлы в сообщении: ${files.length}`;
          }
        }
        let coverPath = postConfig.image || postConfig.cover;
        const coverExists = logicalFiles.some(f => getLogicalFilePath(f)?.toLowerCase() === coverPath?.toLowerCase());
        if (!coverPath || !coverExists) {
          const imageFile = logicalFiles.find(f => {
            const p = getLogicalFilePath(f)?.toLowerCase() || '';
            return p.endsWith('.png') || p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.webp');
          });
          if (imageFile) {
            coverPath = getLogicalFilePath(imageFile);
          } else {
            coverPath = undefined; 
          }
        }
        let imageUrl = undefined;
        if (coverPath) {
          imageUrl = `/fidds/v1/${fiddId}/${messageNumber}/${encodeURIComponent(coverPath)}`;
        }
        // console.log(`[getPostsForFidd] Pushing post from ${messageNumber}`, postConfig.title);
        posts.push({
          id: `${fiddId}_${messageNumber}`,
          title,
          author,
          content,
          summary: summaryText || 'Здесь пока нет текста...', 
          createdAt: createdAtDate, 
          tags: postConfig.tags || [],
          views: 0,
          imageUrl,
          files
        });
      } catch (err) {
        console.error(`[getPostsForFidd] Error processing message ${messageNumber}:`, err);
        continue;
      }
    }
    console.info(`[getPostsForFidd] ${fiddId}: loaded ${posts.length} posts from ${messageNumbers.length} messages`);
    return posts;
  } catch (err) {
    console.error(`[getPostsForFidd] Error in getPostsForFidd:`, err);
    return [];
  }
}
export async function getAllPosts(countPerFidd: number = 10): Promise<Post[]> {
  try {
    const fiddIds = await getActiveFiddIds();
    const allPostsPromises = fiddIds.map(id => getPostsForFidd(id, countPerFidd));
    const results = await Promise.all(allPostsPromises);
    return results.flat();
  } catch (e) {
    throw e;
  }
}
