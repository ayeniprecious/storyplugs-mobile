import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useRecordActivity } from '@/hooks/use-record-activity';
import { useStoryChapters } from '@/hooks/use-story-chapters';
import { useStoryProgress } from '@/hooks/use-story-progress';
import type { Story } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export default function StoryRead() {
  const { id, chapter } = useLocalSearchParams<{ id: string; chapter?: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { chapters, loading: chaptersLoading } = useStoryChapters(id ?? '');
  const { progress, markComplete, updateProgressPercent } = useStoryProgress(id ?? '');
  const { labels: categoryLabels } = useCategories();
  useRecordActivity();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();

      if (!cancelled) {
        if (error || !data) {
          setNotFound(true);
        } else {
          setStory(data as Story);
        }
        setLoading(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    if (scrollable <= 0) return;
    const percent = Math.min(100, Math.round((contentOffset.y / scrollable) * 100));
    updateProgressPercent(percent);
  }

  if (loading || chaptersLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.scrollContent}>
            <Skeleton style={styles.skeletonBackLink} />
            <Skeleton style={styles.skeletonTag} />
            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={styles.skeletonLineShort} />
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (notFound || !story) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centerFill}>
          <ThemedText type="smallBold">Story not found</ThemedText>
          <Link href="/(app)" asChild>
            <Pressable style={styles.backLinkCombined}>
              <Ionicons name="chevron-back" size={16} color="#e50914" />
              <ThemedText type="link">Back to Home</ThemedText>
            </Pressable>
          </Link>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const hasChapters = chapters.length > 0;
  const requestedChapter = chapter ? parseInt(chapter, 10) : 1;
  const chapterIndex = hasChapters
    ? Math.max(0, Math.min(chapters.length - 1, requestedChapter - 1))
    : 0;
  const currentChapter = hasChapters ? chapters[chapterIndex] : null;
  const bodyText = currentChapter ? currentChapter.body : story.body;
  const isLastChapter = !hasChapters || chapterIndex === chapters.length - 1;
  const isFirstChapter = chapterIndex === 0;

  function goToChapter(nextChapterNumber: number) {
    router.setParams({ chapter: String(nextChapterNumber) });
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.progressTrack}>
        <ThemedView style={[styles.progressFill, { width: `${progress?.progressPercent ?? 0}%` }]} />
      </ThemedView>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={200}
        >
          <Link href={{ pathname: '/story/[id]', params: { id } }} asChild>
            <Pressable style={styles.backLinkCombined}>
              <Ionicons name="chevron-back" size={16} color="#e50914" />
              <ThemedText type="link">Back</ThemedText>
            </Pressable>
          </Link>

          {hasChapters ? (
            <ThemedText type="small" style={styles.categoryTag}>
              Chapter {chapterIndex + 1} of {chapters.length}
              {currentChapter?.title ? ` · ${currentChapter.title}` : ''}
            </ThemedText>
          ) : (
            <ThemedText type="small" style={styles.categoryTag}>
              {categoryLabels[story.category] ?? story.category}
            </ThemedText>
          )}
          <ThemedText type="title" style={styles.title}>
            {story.title}
          </ThemedText>
          <ThemedText style={styles.body}>{bodyText}</ThemedText>

          {hasChapters && (
            <ThemedView style={styles.chapterNavRow}>
              <Pressable
                style={[styles.chapterNavButton, isFirstChapter && styles.chapterNavButtonDisabled]}
                onPress={() => goToChapter(chapterIndex)}
                disabled={isFirstChapter}
              >
                <Ionicons name="chevron-back" size={16} color={isFirstChapter ? '#5a5a5c' : '#e50914'} />
                <ThemedText
                  style={[styles.chapterNavText, isFirstChapter && styles.chapterNavTextDisabled]}
                >
                  Previous
                </ThemedText>
              </Pressable>
              {!isLastChapter && (
                <Pressable style={styles.chapterNavButton} onPress={() => goToChapter(chapterIndex + 2)}>
                  <ThemedText style={styles.chapterNavText}>Next Chapter</ThemedText>
                  <Ionicons name="chevron-forward" size={16} color="#e50914" />
                </Pressable>
              )}
            </ThemedView>
          )}

          {isLastChapter && (
            <>
              {story.reflection_question && (
                <ThemedView type="backgroundElement" style={styles.calloutBox}>
                  <ThemedText type="smallBold">Reflect</ThemedText>
                  <ThemedText type="small">{story.reflection_question}</ThemedText>
                </ThemedView>
              )}
              {story.daily_lesson && (
                <ThemedView type="backgroundElement" style={styles.calloutBox}>
                  <ThemedText type="smallBold">Today&apos;s Lesson</ThemedText>
                  <ThemedText type="small">{story.daily_lesson}</ThemedText>
                </ThemedView>
              )}

              {progress?.completed ? (
                <ThemedView style={[styles.completedBadge, styles.completedBadgeRow]}>
                  <Ionicons name="checkmark-circle" size={18} color="#32b45a" />
                  <ThemedText style={styles.completedBadgeText}>Marked as Complete</ThemedText>
                </ThemedView>
              ) : (
                <Pressable style={styles.completeButton} onPress={markComplete}>
                  <ThemedText style={styles.completeButtonText}>Mark as Complete</ThemedText>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  scrollContent: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.six },
  skeletonBackLink: { width: 60, height: 16, borderRadius: 4, marginBottom: Spacing.two },
  skeletonTag: { width: 100, height: 12, borderRadius: 4, marginTop: Spacing.two },
  skeletonTitle: { width: '70%', height: 30, borderRadius: 6 },
  skeletonLine: { width: '100%', height: 16, borderRadius: 4 },
  skeletonLineShort: { width: '60%', height: 16, borderRadius: 4 },
  progressTrack: { height: 3, backgroundColor: 'rgba(128,128,128,0.25)' },
  progressFill: { height: 3, backgroundColor: '#e50914' },
  backLinkCombined: {
    marginBottom: Spacing.two,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  categoryTag: { color: '#e50914', fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: 25, lineHeight: 31 },
  body: { fontSize: 16, lineHeight: 24, opacity: 0.9 },
  chapterNavRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.two },
  chapterNavButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chapterNavButtonDisabled: { opacity: 0.4 },
  chapterNavText: { color: '#e50914', fontWeight: '600' },
  chapterNavTextDisabled: { color: '#5a5a5c' },
  calloutBox: { padding: Spacing.three, borderRadius: 12, gap: 4 },
  completeButton: {
    marginTop: Spacing.two,
    backgroundColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
  },
  completeButtonText: { color: '#fff', fontWeight: '600' },
  completedBadge: {
    marginTop: Spacing.two,
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    backgroundColor: 'rgba(50,180,90,0.15)',
  },
  completedBadgeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  completedBadgeText: { color: '#32b45a', fontWeight: '600' },
});
