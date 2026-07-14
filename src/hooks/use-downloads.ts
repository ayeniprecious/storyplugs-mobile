import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { Story, StoryChapter } from '@/lib/database.types';

const INDEX_KEY = 'storyplugs:downloads-index';

export type DownloadedStory = Story & { downloadedAt: string };

// expo-file-system's File/Directory classes are iOS/Android-only -- constructing
// one on web throws ("this.validatePath is not a function") rather than
// degrading gracefully, since there's no native filesystem behind a browser
// tab. Web instead stores downloaded content directly in AsyncStorage (backed
// by localStorage on web) -- story text is small enough to comfortably fit
// localStorage's ~5MB budget for a reasonable library size.
const IS_WEB = Platform.OS === 'web';

// Native only: cache dir, not documents -- downloaded story text/covers are
// trivially re-fetchable, so per Apple's own guidance they don't belong in
// backed-up storage. Tradeoff: the OS can purge this under storage pressure
// without warning, so every read below re-checks the file actually exists on
// disk rather than trusting the AsyncStorage index alone.
function downloadsDir() {
  const dir = new Directory(Paths.cache, 'downloads');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function contentFile(storyId: string) {
  return new File(downloadsDir(), `${storyId}.json`);
}

function webContentKey(storyId: string) {
  return `storyplugs:download-content:${storyId}`;
}

// Plain functions (not hooks) so read.tsx can check/read a single story
// without subscribing to the whole downloads list.
export async function isDownloaded(storyId: string): Promise<boolean> {
  if (IS_WEB) return (await AsyncStorage.getItem(webContentKey(storyId))) !== null;
  return contentFile(storyId).exists;
}

export async function readDownloadedContent(
  storyId: string
): Promise<{ story: Story; chapters: StoryChapter[] } | null> {
  try {
    if (IS_WEB) {
      const raw = await AsyncStorage.getItem(webContentKey(storyId));
      return raw ? (JSON.parse(raw) as { story: Story; chapters: StoryChapter[] }) : null;
    }
    const file = contentFile(storyId);
    if (!file.exists) return null;
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
// image download shouldn't block or fail the story download itself. Web skips
// this entirely -- there's no local file to save it to, and the browser's own
// HTTP cache already gives the remote image a reasonable shot at working
// offline without any extra code here.
async function downloadCoverIfPossible(story: Story): Promise<string | null> {
  if (IS_WEB || !story.image_url) return null;
  try {
    const ext = story.image_url.split('?')[0].split('.').pop() || 'jpg';
    const dest = new File(downloadsDir(), `${story.id}-cover.${ext}`);
    const result = await File.downloadFileAsync(story.image_url, dest, { idempotent: true });
    return result.uri;
  } catch {
    return null;
  }
}

// Standalone, hook-independent mutators for callers that don't want to mount
// the full reactive useDownloads() list (which reconciles every entry in the
// index against disk on every mount -- fine once per screen, wasteful if
// mounted per row across a long list like StoryRowCard is). The hook below
// wraps these and additionally refreshes its own list state.
export async function downloadStoryContent(story: Story, chapters: StoryChapter[]) {
  const payload = JSON.stringify({ story, chapters });
  if (IS_WEB) {
    await AsyncStorage.setItem(webContentKey(story.id), payload);
  } else {
    const file = contentFile(story.id);
    file.create({ intermediates: true, overwrite: true });
    file.write(payload);
  }
  const localCoverUri = await downloadCoverIfPossible(story);

  const current = await readIndex();
  const withoutExisting = current.filter((item) => item.id !== story.id);
  await writeIndex([
    ...withoutExisting,
    { ...story, image_url: localCoverUri ?? story.image_url, downloadedAt: new Date().toISOString() },
  ]);
}

export async function removeDownloadedStory(storyId: string) {
  if (IS_WEB) {
    await AsyncStorage.removeItem(webContentKey(storyId));
  } else {
    for (const entry of downloadsDir().list()) {
      if (entry.name.startsWith(storyId)) entry.delete();
    }
  }
  const current = await readIndex();
  await writeIndex(current.filter((item) => item.id !== storyId));
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadedStory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const stored = await readIndex();
    const reconciled: DownloadedStory[] = [];
    for (const item of stored) {
      if (await isDownloaded(item.id)) reconciled.push(item);
    }
    if (reconciled.length !== stored.length) await writeIndex(reconciled);
    setDownloads(reconciled);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const downloadStory = useCallback(
    async (story: Story, chapters: StoryChapter[]) => {
      await downloadStoryContent(story, chapters);
      await refresh();
    },
    [refresh]
  );

  const removeDownload = useCallback(
    async (storyId: string) => {
      await removeDownloadedStory(storyId);
      await refresh();
    },
    [refresh]
  );

  return { downloads, loading, downloadStory, removeDownload, refresh };
}
