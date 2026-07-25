import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { AUTO_SCROLL_SPEEDS, useStoryReader } from '@/hooks/use-story-reader';

const BODY_FONT_SIZE = 20;
const TITLE_FONT_SIZE = 28;

// Stepped +/- scale rather than a continuous drag -- same "tap to adjust"
// idiom as the auto-scroll speed control below. Index 3 (1.1x) is the
// default: noticeably bigger than the normal reading page's flat 20px
// without needing a tap to get there.
const FONT_SCALE_STEPS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6];
const DEFAULT_FONT_SCALE_INDEX = 3;
const SPACING_OPTIONS = [1.0, 1.2, 1.4];
// One icon per spacing level, tight to loose, so the selection reads at a
// glance instead of every chip showing the same glyph.
const SPACING_ICONS = ['reorder-four-outline', 'reorder-three-outline', 'reorder-two-outline'] as const;

// Reader Mode's own palette set, deliberately independent of the app-wide
// Appearance settings -- sepia has no equivalent in the global theme, so it's
// defined locally with the same shape as Colors.light/dark.
const SEPIA_COLORS = {
  text: '#3b2f22',
  background: '#F4ECD8',
  backgroundElement: '#ECE0C4',
  backgroundSelected: '#E3D5B0',
  textSecondary: '#6b5c47',
  border: '#ddcfb0',
  placeholder: '#8a7a5f',
  cardAshSolid: '#ECE0C4',
} as const;

// This is the dedicated, distraction-free Reader Mode screen -- a genuinely
// separate route (not a same-page toggle on read.tsx): just the story text
// and its own font/theme/spacing settings, no reflections, lesson, or
// comments. Reached only by navigating here from the normal read page.
export default function ReaderMode() {
  const { id, chapter } = useLocalSearchParams<{ id: string; chapter?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const reader = useStoryReader(id, chapter, scrollRef);
  const {
    story,
    loading,
    notFound,
    chapters,
    chaptersLoading,
    hasChapters,
    chapterIndex,
    currentChapter,
    bodyText,
    isArchiveLocked,
    progress,
    markComplete,
    hasRecordedAudio,
    playerStatus,
    tts,
    isListening,
    handleScroll,
    handleContentSizeChange,
    handleScrollViewLayout,
    handleBodyLayout,
    autoScrollOn,
    setAutoScrollOn,
    speedIndex,
    adjustSpeed,
    goToChapter,
    handleListenToggle,
  } = reader;

  const [chapterListOpen, setChapterListOpen] = useState(false);
  // The whole settings panel -- not just its contents -- can be dismissed
  // entirely so the full screen is free for reading; the header icon is the
  // only way in or out once closed.
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [fontScaleIndex, setFontScaleIndex] = useState(DEFAULT_FONT_SCALE_INDEX);
  const [spacingIndex, setSpacingIndex] = useState(1);
  const readerFontScale = FONT_SCALE_STEPS[fontScaleIndex];
  const spacingMultiplier = SPACING_OPTIONS[spacingIndex];

  function adjustFontScale(delta: number) {
    setFontScaleIndex((prev) => Math.min(FONT_SCALE_STEPS.length - 1, Math.max(0, prev + delta)));
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

  if (notFound || !story || isArchiveLocked) {
    return <RedirectToRead id={id} chapter={chapter} />;
  }

  const isLastChapter = !hasChapters || chapterIndex === chapters.length - 1;
  const isFirstChapter = chapterIndex === 0;
  const readerColors = readerTheme === 'sepia' ? SEPIA_COLORS : Colors[readerTheme];
  const isDarkNow = readerTheme === 'dark';

  return (
    <ThemedView style={[styles.container, { backgroundColor: readerColors.background }]}>
      <ThemedView style={styles.progressTrack}>
        <ThemedView style={[styles.progressFill, { width: `${progress?.progressPercent ?? 0}%` }]} />
      </ThemedView>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={[styles.topRow, { backgroundColor: readerColors.background }]}>
          <BackButton href={{ pathname: '/story/[id]/read', params: { id: id ?? '', chapter } }} />
          <ThemedView style={[styles.topRowCenter, { backgroundColor: readerColors.background }]}>
            <ThemedText type="smallBold" numberOfLines={1} style={[styles.topRowTitle, { color: readerColors.text }]}>
              {story.title}
            </ThemedText>
            {hasChapters && (
              <ThemedText type="small" style={[styles.topRowSubtitle, { color: readerColors.textSecondary }]}>
                Part {chapterIndex + 1} of {chapters.length}
              </ThemedText>
            )}
          </ThemedView>
          <ThemedView style={[styles.topRowActions, { backgroundColor: readerColors.background }]}>
            <Pressable
              onPress={() => setSettingsOpen((prev) => !prev)}
              hitSlop={8}
              accessibilityLabel={settingsOpen ? 'Hide reader settings' : 'Show reader settings'}
            >
              <Ionicons name={settingsOpen ? 'options' : 'options-outline'} size={20} color={readerColors.text} />
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleScrollViewLayout}
          scrollEventThrottle={200}
        >
          <ThemedText type="small" style={[styles.categoryTag, { color: '#C01918' }]}>
            {hasChapters ? `Part ${chapterIndex + 1}` : 'Story'}
          </ThemedText>
          <ThemedText
            type="title"
            style={[
              styles.title,
              { color: readerColors.text, fontSize: TITLE_FONT_SIZE * readerFontScale, lineHeight: 33 * readerFontScale },
            ]}
          >
            {hasChapters ? currentChapter?.title || `Part ${chapterIndex + 1}` : story.title}
          </ThemedText>
          <ThemedText
            onLayout={handleBodyLayout}
            style={[
              styles.body,
              {
                color: readerColors.text,
                opacity: 1,
                fontSize: BODY_FONT_SIZE * readerFontScale,
                lineHeight: 30 * readerFontScale * spacingMultiplier,
              },
            ]}
          >
            {hasRecordedAudio
              ? bodyText
              : tts.sentences.map((sentence, i) => (
                  <Text
                    key={i}
                    style={
                      i === tts.currentIndex
                        ? isDarkNow
                          ? styles.activeSentenceDark
                          : styles.activeSentence
                        : undefined
                    }
                  >
                    {sentence.text}{' '}
                  </Text>
                ))}
          </ThemedText>

          {isLastChapter &&
            (progress?.completed ? (
              <ThemedView style={[styles.completedBadge, styles.completedBadgeRow]}>
                <Ionicons name="checkmark-circle" size={18} color="#32b45a" />
                <ThemedText style={styles.completedBadgeText}>Marked as Complete</ThemedText>
              </ThemedView>
            ) : (
              <Pressable style={styles.completeButton} onPress={markComplete}>
                <ThemedText style={styles.completeButtonText}>Mark as Complete</ThemedText>
              </Pressable>
            ))}
        </ScrollView>

        <ThemedView style={[styles.playbackBar, { backgroundColor: readerColors.background }]}>
          <Pressable onPress={() => hasChapters && setChapterListOpen(true)} hitSlop={8} disabled={!hasChapters}>
            <Ionicons name="list-outline" size={20} color={hasChapters ? readerColors.text : '#5a5a5c'} />
          </Pressable>
          {hasChapters && (
            <Pressable onPress={() => goToChapter(chapterIndex)} disabled={isFirstChapter} hitSlop={8}>
              <Ionicons name="play-skip-back" size={18} color={isFirstChapter ? '#5a5a5c' : readerColors.text} />
            </Pressable>
          )}
          <Pressable onPress={handleListenToggle} style={styles.playButton} hitSlop={8}>
            <Ionicons name={isListening ? (hasRecordedAudio ? 'pause' : 'stop') : 'play'} size={20} color="#fff" />
          </Pressable>
          {hasChapters && (
            <Pressable onPress={() => goToChapter(chapterIndex + 2)} disabled={isLastChapter} hitSlop={8}>
              <Ionicons name="play-skip-forward" size={18} color={isLastChapter ? '#5a5a5c' : readerColors.text} />
            </Pressable>
          )}
          <ThemedText type="small" style={[styles.playbackPercent, { color: readerColors.textSecondary }]}>
            {progress?.progressPercent ?? 0}%
          </ThemedText>
        </ThemedView>

        {settingsOpen && (
          <ThemedView style={[styles.readerPanel, { backgroundColor: readerColors.cardAshSolid }]}>
            <ThemedView style={styles.readerPanelHeader}>
              <ThemedText type="smallBold" style={[styles.readerPanelHeading, { color: readerColors.text }]}>
                Reader Settings
              </ThemedText>
              <Pressable onPress={() => setSettingsOpen(false)} hitSlop={8} accessibilityLabel="Close reader settings">
                <Ionicons name="close" size={18} color={readerColors.text} />
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.readerControlRow}>
              <ThemedText type="small" style={[styles.readerControlLabel, { color: readerColors.textSecondary }]}>
                Text Size
              </ThemedText>
              <ThemedView style={styles.readerControlButtons}>
                <Pressable
                  style={styles.readerControlButton}
                  onPress={() => adjustFontScale(-1)}
                  disabled={fontScaleIndex <= 0}
                >
                  <Ionicons name="remove" size={16} color={readerColors.text} />
                </Pressable>
                <ThemedText type="small" style={[styles.speedLabel, { color: readerColors.textSecondary }]}>
                  {Math.round(readerFontScale * 100)}%
                </ThemedText>
                <Pressable
                  style={styles.readerControlButton}
                  onPress={() => adjustFontScale(1)}
                  disabled={fontScaleIndex >= FONT_SCALE_STEPS.length - 1}
                >
                  <Ionicons name="add" size={16} color={readerColors.text} />
                </Pressable>
              </ThemedView>
            </ThemedView>

            <ThemedText type="small" style={[styles.readerPanelLabel, { color: readerColors.textSecondary }]}>
              Theme
            </ThemedText>
            <ThemedView style={styles.chipRow}>
              {(['light', 'sepia', 'dark'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.themeSwatch,
                    { backgroundColor: t === 'light' ? '#ffffff' : t === 'sepia' ? '#F4ECD8' : '#141414' },
                    readerTheme === t && styles.themeSwatchSelected,
                  ]}
                  onPress={() => setReaderTheme(t)}
                />
              ))}
            </ThemedView>

            <ThemedText type="small" style={[styles.readerPanelLabel, { color: readerColors.textSecondary }]}>
              Spacing
            </ThemedText>
            <ThemedView style={styles.chipRow}>
              {SPACING_OPTIONS.map((multiplier, i) => (
                <Pressable
                  key={multiplier}
                  style={[styles.spacingChip, spacingIndex === i && styles.fontChipSelected]}
                  onPress={() => setSpacingIndex(i)}
                >
                  <Ionicons
                    name={SPACING_ICONS[i]}
                    size={16}
                    color={spacingIndex === i ? '#fff' : readerColors.text}
                  />
                </Pressable>
              ))}
            </ThemedView>

            <ThemedView style={styles.readerControlRow}>
              <ThemedText type="small" style={[styles.readerControlLabel, { color: readerColors.textSecondary }]}>
                Auto-scroll
              </ThemedText>
              <ThemedView style={styles.readerControlButtons}>
                <Pressable
                  style={styles.readerControlButton}
                  onPress={() => adjustSpeed(-1)}
                  disabled={speedIndex <= 0}
                >
                  <Ionicons name="remove" size={16} color={readerColors.text} />
                </Pressable>
                <ThemedText type="small" style={[styles.speedLabel, { color: readerColors.textSecondary }]}>
                  {speedIndex + 1}/{AUTO_SCROLL_SPEEDS.length}
                </ThemedText>
                <Pressable
                  style={styles.readerControlButton}
                  onPress={() => adjustSpeed(1)}
                  disabled={speedIndex >= AUTO_SCROLL_SPEEDS.length - 1}
                >
                  <Ionicons name="add" size={16} color={readerColors.text} />
                </Pressable>
                <Pressable
                  style={[styles.readerControlButton, styles.autoScrollToggle]}
                  onPress={() => setAutoScrollOn((prev) => !prev)}
                >
                  <Ionicons name={autoScrollOn ? 'pause' : 'play'} size={16} color="#fff" />
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}
      </SafeAreaView>

      <Modal
        visible={chapterListOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setChapterListOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setChapterListOpen(false)}>
          <ThemedView type="cardAshSolid" style={styles.menuSheet} onStartShouldSetResponder={() => true}>
            <ThemedText type="smallBold" style={styles.chapterListHeading}>
              Chapters
            </ThemedText>
            <ScrollView style={styles.chapterListScroll}>
              {chapters.map((c, i) => (
                <Pressable
                  key={c.id}
                  style={styles.menuItem}
                  onPress={() => {
                    setChapterListOpen(false);
                    goToChapter(i + 1);
                  }}
                >
                  <ThemedView style={[styles.chapterListBadge, i === chapterIndex && styles.chapterListBadgeActive]}>
                    <ThemedText
                      style={[styles.chapterListBadgeText, i === chapterIndex && styles.chapterListBadgeTextActive]}
                    >
                      {i + 1}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText
                    style={[styles.menuItemText, i === chapterIndex && styles.chapterListActiveText]}
                    numberOfLines={1}
                  >
                    {c.title || `Chapter ${i + 1}`}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

// Reached if this story turns out not to exist / isn't loaded, or the
// account lost archive access mid-read -- navigation must happen in an
// effect, not during render, so it can't run twice for a chapter/id pair
// that was already redirected.
function RedirectToRead({ id, chapter }: { id?: string; chapter?: string }) {
  useEffect(() => {
    router.replace({ pathname: '/story/[id]/read', params: { id: id ?? '', chapter } });
  }, [id, chapter]);
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  skeletonBackLink: { width: 60, height: 24, borderRadius: 4, marginBottom: Spacing.two },
  skeletonTag: { width: 100, height: 20, borderRadius: 4, marginTop: Spacing.two },
  skeletonTitle: { width: '70%', height: 31, borderRadius: 6 },
  skeletonLine: { width: '100%', height: 24, borderRadius: 4 },
  skeletonLineShort: { width: '60%', height: 24, borderRadius: 4 },
  progressTrack: { height: 3, backgroundColor: 'rgba(128,128,128,0.25)' },
  progressFill: { height: 3, backgroundColor: '#C01918' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  topRowCenter: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.two },
  topRowTitle: { fontSize: 15, textAlign: 'center' },
  topRowSubtitle: { opacity: 0.6, fontSize: 12, textAlign: 'center' },
  topRowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, width: 20 },
  categoryTag: { fontWeight: '600', textTransform: 'uppercase' },
  title: { fontWeight: '800' },
  body: { lineHeight: 24 },
  activeSentence: { backgroundColor: 'rgba(192,25,24,0.22)', fontWeight: '700' },
  activeSentenceDark: { backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: '700' },
  completeButton: {
    marginTop: Spacing.two,
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two,
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
  playbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C01918',
  },
  playbackPercent: { marginLeft: 'auto', opacity: 0.6, fontVariant: ['tabular-nums'] },
  readerPanel: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  readerPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  readerPanelHeading: { fontSize: 15 },
  readerPanelLabel: { marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent' },
  fontChipSelected: { backgroundColor: '#C01918' },
  themeSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  themeSwatchSelected: { borderWidth: 2, borderColor: '#C01918' },
  spacingChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  readerControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: Spacing.one,
  },
  readerControlLabel: {},
  readerControlButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  readerControlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  autoScrollToggle: { backgroundColor: '#C01918' },
  speedLabel: { width: 32, textAlign: 'center' },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  menuSheet: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
    borderRadius: 16,
    padding: Spacing.four,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingVertical: Spacing.three,
  },
  menuItemText: { fontSize: 16, flex: 1 },
  chapterListHeading: { fontSize: 17, marginBottom: Spacing.two },
  chapterListScroll: { maxHeight: 380 },
  chapterListBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  chapterListBadgeActive: { backgroundColor: 'rgba(192,25,24,0.14)' },
  chapterListBadgeText: { fontSize: 12, fontWeight: '700' },
  chapterListBadgeTextActive: { color: '#C01918' },
  chapterListActiveText: { color: '#C01918', fontWeight: '700' },
});
