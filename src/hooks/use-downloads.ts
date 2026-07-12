import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { Story, StoryChapter } from '@/lib/database.types';

const INDEX_KEY = 'storyplugs:downloads-index';

export type DownloadedStory = Story & { downloadedAt: string };

// expo-file-system's File/Directory classes are iOS/Android-only -- there's no
// persistent native filesystem to back them in a browser tab, and constructing
// one throws ("this.validatePath is not a function") rather than degrading
// gracefully. Offline downloads is inherently a mobile-native concept anyway,
// so every entry point below no-ops on web instead of working around the crash.
const IS_WEB = Platform.OS === 'web';

// Cache dir, not documents -- downloaded story text/covers are trivially
// re-fetchable, so per Apple's own guidance they don't belong in backed-up
// storage. Tradeoff: the OS can purge this under storage pressure without
// warning, so every read below re-checks the file actually exists on disk
// rather than trusting the AsyncStorage index alone.
function downloadsDir() {
  const dir = new Directory(Paths.cache, 'downloads');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function contentFile(storyId: string) {
  return new File(downloadsDir(), `${storyId}.json`);
}

// Plain functions (not hooks) so read.tsx can check/read a single story
// without subscribing to the whole downloads list.
export function isDownloaded(storyId: string) {
  if (IS_WEB) return false;
  return contentFile(storyId).exists;
}

export async function readDownloadedContent(
  storyId: string
): Promise<{ story: Story; chapters: StoryChapter[] } | null> {
  if (IS_WEB) return null;
  const file = contentFile(storyId);
  if (!file.exists) return null;
  try {
    return JSON.parse(await file.text()) as { story: Story; chapters: StoryChapter[] };
  } catch {
    return null;
  }
}

async function readIndex(): Promise<DownloadedStory[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  return raw ? (JSON.parse(raw) as DownloadedStory[]) : [];
}

async function writeIndex(index: DownloadedStory[]) {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

// Best-effort: offline reading works fine without a local cover, so a failed
// image download shouldn't block or fail the story download itself.
async function downloadCoverIfPossible(story: Story): Promise<string | null> {
  if (!story.image_url) return null;
  try {
    const ext = story.image_url.split('?')[0].split('.').pop() || 'jpg';
    const dest = new File(downloadsDir(), `${story.id}-cover.${ext}`);
    const result = await File.downloadFileAsync(story.image_url, dest, { idempotent: true });
    return result.uri;
  } catch {
    return null;
  }
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadedStory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (IS_WEB) {
      setDownloads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const stored = await readIndex();
    const reconciled = stored.filter((item) => contentFile(item.id).exists);
    if (reconciled.length !== stored.length) await writeIndex(reconciled);
    setDownloads(reconciled);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const downloadStory = useCallback(
    async (story: Story, chapters: StoryChapter[]) => {
      if (IS_WEB) return;
      const file = contentFile(story.id);
      file.create({ intermediates: true, overwrite: true });
      file.write(JSON.stringify({ story, chapters }));
      const localCoverUri = await downloadCoverIfPossible(story);

      const current = await readIndex();
      const withoutExisting = current.filter((item) => item.id !== story.id);
      await writeIndex([
        ...withoutExisting,
        { ...story, image_url: localCoverUri ?? story.image_url, downloadedAt: new Date().toISOString() },
      ]);
      await refresh();
    },
    [refresh]
  );

  const removeDownload = useCallback(
    async (storyId: string) => {
      if (IS_WEB) return;
      for (const entry of downloadsDir().list()) {
        if (entry.name.startsWith(storyId)) entry.delete();
      }
      const current = await readIndex();
      await writeIndex(current.filter((item) => item.id !== storyId));
      await refresh();
    },
    [refresh]
  );

  return { downloads, loading, downloadStory, removeDownload, refresh };
}
