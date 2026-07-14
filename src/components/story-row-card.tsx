import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Share, StyleSheet } from 'react-native';

import { PremiumLockModal } from '@/components/premium-lock-modal';
import { ReportModal } from '@/components/report-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import { useAppSettings } from '@/hooks/use-app-settings';
import { downloadStoryContent, isDownloaded, removeDownloadedStory } from '@/hooks/use-downloads';
import { useTheme } from '@/hooks/use-theme';
import type { Story, StoryChapter } from '@/lib/database.types';
import { estimateReadMinutes } from '@/lib/read-time';
import { supabase } from '@/lib/supabase';

interface StoryRowCardProps {
  story: Story;
  subtitle?: string;
  progressPercent?: number;
  onRemove?: () => void;
  removeLabel?: string;
}

// Horizontal list-item card -- title, then category/read-time/18+ on one meta
// line, then an optional progress bar or subtitle, then a 3-dot actions menu
// covering everything a story can do from a list row: open, download
// offline (premium), share, comment (free -- replying is the premium part,
// gated inside CommentsSection), report, and a context-specific remove. For
// anywhere a story needs to read as a scannable list row rather than the
// poster-style StoryCard's grid/carousel look -- Library's Continue
// Reading/Saved/Downloads/Completed/folder sections plus curated row-style
// sections on Home/Search.
export function StoryRowCard({ story, subtitle, progressPercent, onRemove, removeLabel }: StoryRowCardProps) {
  const { labels: categoryLabels } = useCategories();
  const theme = useTheme();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { settings } = useAppSettings();
  const hasProgress = progressPercent !== undefined;

  const [menuOpen, setMenuOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [showDownloadLock, setShowDownloadLock] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isDownloaded(story.id).then((value) => {
      if (!cancelled) setDownloaded(value);
    });
    return () => {
      cancelled = true;
    };
  }, [story.id]);

  function openStory() {
    setMenuOpen(false);
    router.push({ pathname: '/story/[id]', params: { id: story.id } });
  }

  function handleRemove() {
    setMenuOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove?.();
  }

  function openMenu() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(true);
  }

  async function handleDownloadToggle() {
    if (!profile?.is_premium) {
      setMenuOpen(false);
      setShowDownloadLock(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDownloadBusy(true);
    if (downloaded) {
      await removeDownloadedStory(story.id);
      setDownloaded(false);
    } else {
      const { data } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('story_id', story.id)
        .order('chapter_number', { ascending: true });
      await downloadStoryContent(story, (data as StoryChapter[]) ?? []);
      setDownloaded(true);
    }
    setDownloadBusy(false);
    setMenuOpen(false);
  }

  async function handleShare() {
    setMenuOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const appName = settings.app_name || 'StoryPlugs';
    try {
      const result = await Share.share({
        message: `"${story.title}" — a story from ${appName}.\n\n${story.body.slice(0, 140)}...`,
        title: story.title,
      });
      if (result.action === Share.sharedAction && user?.id) {
        const platform = (result as { activityType?: string }).activityType || Platform.OS;
        await supabase.from('story_shares').insert({ user_id: user.id, story_id: story.id, platform });
      }
    } catch {
      // user cancelled or the share sheet is unavailable on this platform
    }
  }

  function handleCommentPress() {
    setMenuOpen(false);
    // Commenting is free for everyone -- only replying to another user's
    // comment is premium-gated, and that gate lives in CommentsSection
    // itself (rendered on the preview page this navigates to), not here.
    router.push({ pathname: '/story/[id]', params: { id: story.id } });
  }

  function handleReportPress() {
    setMenuOpen(false);
    setReporting(true);
  }

  return (
    <ThemedView style={styles.row}>
      <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
        <Pressable style={styles.rowPressable}>
          {story.image_url && (
            <Image source={{ uri: story.image_url }} style={styles.thumb} contentFit="cover" />
          )}
          <ThemedView style={styles.rowBody}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {story.title}
            </ThemedText>
            <ThemedView style={styles.metaRow}>
              <ThemedText type="small" style={styles.categoryTag}>
                {(categoryLabels[story.category] ?? story.category).toUpperCase()}
              </ThemedText>
              <ThemedText type="small" style={styles.readTime}>
                · {estimateReadMinutes(story.body)} min read
              </ThemedText>
              {story.is_mature && (
                <MaterialIcons name="explicit" size={13} color="#C01918" style={styles.matureIcon} />
              )}
            </ThemedView>
            {hasProgress ? (
              <>
                <ThemedView style={styles.progressTrack}>
                  <ThemedView style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </ThemedView>
                <ThemedText type="small" style={styles.progressLabel}>
                  {progressPercent}% read
                </ThemedText>
              </>
            ) : subtitle ? (
              <ThemedText type="small" style={styles.progressLabel}>
                {subtitle}
              </ThemedText>
            ) : null}
          </ThemedView>
        </Pressable>
      </Link>
      <Pressable style={styles.menuButton} onPress={openMenu} accessibilityLabel="More actions">
        <Ionicons name="ellipsis-vertical" size={18} color="#8a8a8e" />
      </Pressable>

      {/* A standalone, centered dialog rather than a bottom sheet -- it
          doesn't read as "attached" to any screen edge, and a close icon in
          its own header replaces the old full-width Cancel row. */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <ThemedView type="cardAshSolid" style={styles.menuSheet} onStartShouldSetResponder={() => true}>
            <ThemedView style={styles.menuHeader}>
              <ThemedText type="smallBold" numberOfLines={1} style={styles.menuTitle}>
                {story.title}
              </ThemedText>
              <Pressable onPress={() => setMenuOpen(false)} hitSlop={8} accessibilityLabel="Close">
                <Ionicons name="close-circle" size={24} color={theme.placeholder} />
              </Pressable>
            </ThemedView>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable style={styles.menuItem} onPress={openStory}>
                <Ionicons name="book-outline" size={18} color={theme.text} />
                <ThemedText style={styles.menuItemText}>Open Story</ThemedText>
              </Pressable>

              <Pressable style={styles.menuItem} onPress={handleDownloadToggle} disabled={downloadBusy}>
                {downloadBusy ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Ionicons name={downloaded ? 'cloud-done' : 'cloud-download-outline'} size={18} color={theme.text} />
                )}
                <ThemedText style={styles.menuItemText}>
                  {downloaded ? 'Remove Download' : 'Download Offline'}
                </ThemedText>
                {!profile?.is_premium && (
                  <Ionicons name="lock-closed" size={13} color={theme.placeholder} style={styles.menuItemLock} />
                )}
              </Pressable>

              <Pressable style={styles.menuItem} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color={theme.text} />
                <ThemedText style={styles.menuItemText}>Share Story</ThemedText>
              </Pressable>

              <Pressable style={styles.menuItem} onPress={handleCommentPress}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.text} />
                <ThemedText style={styles.menuItemText}>Comment</ThemedText>
              </Pressable>

              <Pressable style={styles.menuItem} onPress={handleReportPress}>
                <Ionicons name="flag-outline" size={18} color={theme.text} />
                <ThemedText style={styles.menuItemText}>Report</ThemedText>
              </Pressable>

              {onRemove && (
                <Pressable style={styles.menuItem} onPress={handleRemove}>
                  <Ionicons name="trash-outline" size={18} color="#C01918" />
                  <ThemedText style={[styles.menuItemText, styles.menuItemDestructiveText]}>
                    {removeLabel ?? 'Remove'}
                  </ThemedText>
                </Pressable>
              )}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>

      <PremiumLockModal
        visible={showDownloadLock}
        onClose={() => setShowDownloadLock(false)}
        title="Offline downloads are a premium feature"
        body="Save stories to read anytime, even without a signal. Upgrade to start downloading."
      />
      <ReportModal visible={reporting} onClose={() => setReporting(false)} targetType="story" targetId={story.id} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: Spacing.two,
    overflow: 'hidden',
    backgroundColor: CardAsh,
  },
  rowPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  rowBody: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  categoryTag: { color: '#C01918', fontWeight: '700', fontSize: 11 },
  readTime: { opacity: 0.6, fontSize: 11 },
  matureIcon: { marginLeft: 2 },
  progressTrack: { height: 4, backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#C01918' },
  progressLabel: { opacity: 0.6, fontSize: 12 },
  menuButton: { paddingHorizontal: Spacing.three, alignSelf: 'stretch', justifyContent: 'center' },
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
    maxHeight: '80%',
    borderRadius: 16,
    padding: Spacing.four,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  menuTitle: { flex: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingVertical: Spacing.three,
  },
  menuItemText: { fontSize: 16, flex: 1 },
  menuItemLock: { marginLeft: -Spacing.two },
  menuItemDestructiveText: { color: '#C01918' },
});
